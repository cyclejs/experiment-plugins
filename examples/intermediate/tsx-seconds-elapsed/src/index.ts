import xs, { Stream } from 'xstream';
import { run } from './run';
import { makeDOMPlugin, h } from './dom';

function main(sources: any): any {
  const vdom$ = sources.DOM
    .select('.myinput')
    .events('input')
    .map((ev: any) => ev.target.value)
    .startWith('')
    .map((name: string) =>
      h('div', [
        h('label', 'Name:'),
        h('input.myinput', { attrs: { type: 'text' } }),
        h('hr'),
        h('h1', `Hello ${name}`),
      ]),
    );
  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMPlugin('#main-container'),
});
