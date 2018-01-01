// import { makeDOMDriver, DOMSource, VNode } from '@cycle/dom';
import { h, init } from 'snabbdom';
import ClassModule from 'snabbdom/modules/class';
import PropsModule from 'snabbdom/modules/props';
import AttrsModule from 'snabbdom/modules/attributes';
import StyleModule from 'snabbdom/modules/style';
import DatasetModule from 'snabbdom/modules/dataset';
import { VNode } from 'snabbdom/vnode';
import { toVNode } from 'snabbdom/tovnode';
import { Straw, Push } from './types';
import xs, { Stream } from 'xstream';

const modules = [
  StyleModule,
  ClassModule,
  PropsModule,
  AttrsModule,
  DatasetModule,
];

export { h } from 'snabbdom';

function getValidNode(
  selectors: Element | DocumentFragment | string,
): Element | DocumentFragment | null {
  const domElement =
    typeof selectors === 'string'
      ? document.querySelector(selectors)
      : selectors;

  if (typeof selectors === 'string' && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${selectors}\``);
  }
  return domElement;
}

class DOMSource {
  constructor(
    private root: Element | DocumentFragment | null,
    private namespace: Array<any> = [],
  ) {}

  public select(selector: string): DOMSource {
    return new DOMSource(this.root, this.namespace.concat(selector));
  }

  public events(type: string): Stream<any> {
    // TODO: instead of this, we should have a sink msg type for
    // adding event listeners, and a source msg type for events
    return xs.create({
      start: (listener: any) => {
        setTimeout(() => {
          let target = this.root;
          this.namespace.forEach(selector => {
            target = target.querySelector(selector);
          });
          target.addEventListener(type, ev => {
            listener.next(ev);
          });
        }, 2000);
      },
      stop: () => {},
    });
  }
}

/**
 * sink -1: stop
 * sink 1: patch
 */

export function makeDOMPlugin(container: string) {
  const patch = init(modules);
  const firstRoot = getValidNode(container) || document.body;

  function domDriver(sink: Straw<any>): Straw<any> {
    let vnode = toVNode(firstRoot);

    const stop = sink((x, type, instance) => {
      if (type === -1 && stop) {
        stop();
        return;
      }

      if (type === 1) {
        vnode = patch(vnode, x as VNode);
        return;
      }
    });

    const pushableStraw = {
      straw: function straw(push: Push<any>): void {
        this.destination = push;
      },
      push: function push(x: any): void {
        this.destination(x);
      },
    };

    return pushableStraw.straw;
  }

  function domAdapter(main: (so: any) => any, chan: string): (so: any) => any {
    return function loMain(loSources: any): any {
      const hiSource = new DOMSource(firstRoot);
      const hiSources = { ...loSources, [chan]: hiSource };
      const hiSinks = main(hiSources);
      const vnode$ = hiSinks[chan];
      const loSink: Straw<any> = (cb: (x: any, type: number) => void) => {
        vnode$.subscribe({
          next: (x: VNode) => {
            cb(x, 1);
          },
        });
      };
      const loSinks = { ...hiSinks, [chan]: loSink };
      return loSinks;
    };
  }

  return [domDriver, domAdapter] as [typeof domDriver, typeof domAdapter];
}
