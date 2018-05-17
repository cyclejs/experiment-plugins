import { Callbag } from 'callbag';
import microtask from './microtask';
import {
  CycleProgram,
  Plugins,
  SinkProxies,
  Sources,
  Sinks,
  Adapter,
} from './types';
// import makeSubject = require('callbag-subject');
const makeSubject = require('callbag-subject');

export {
  Sources,
  Sinks,
  SinkProxies,
  Driver,
  Plugins,
  CycleProgram,
} from './types';

const scheduleMicrotask = microtask();

function makeSinkProxies<So extends Sources, Si extends Sinks>(
  plugins: Plugins<So, Si>,
): SinkProxies<Si> {
  const sinkProxies = {} as SinkProxies<Si>;
  for (const name in plugins) {
    if (plugins.hasOwnProperty(name)) {
      sinkProxies[name] = makeSubject();
    }
  }
  return sinkProxies;
}

function callDrivers<So extends Sources, Si extends Sinks>(
  plugins: Plugins<So, Si>,
  sinkProxies: SinkProxies<Si>,
): So {
  const sources: So = {} as So;
  for (const name in plugins) {
    if (plugins.hasOwnProperty(name)) {
      const driver = plugins[name][0];
      const sinkStraw = sinkProxies[name];
      sources[name] = driver(sinkStraw, name);
    }
  }
  return sources;
}

function callAdapters<So extends Sources, Si extends Sinks>(
  plugins: Plugins<So, Si>,
  main: any,
): any {
  return Object.keys(plugins).reduce((acc, name) => {
    const adapter = plugins[name][1];
    return adapter(acc, name);
  }, main);
}

/**
 * Notice that we do not replicate 'complete' from real sinks, in
 * SinksReplicators and ReplicationBuffers.
 * Complete is triggered only on disposeReplication. See discussion in #425
 * for details.
 */
type SinkReplicators<Si extends Sinks> = { [P in keyof Si]: Push<any> };

type BufferedPush = [any, number | undefined, number | undefined];

type ReplicationBuffers<Si extends Sinks> = {
  [P in keyof Si]: Array<BufferedPush>
};

function replicateMany<So extends Sources, Si extends Sinks>(
  sinks: Si,
  sinkProxies: SinkProxies<Si>,
): Stop {
  const sinkNames: Array<keyof Si> = Object.keys(sinks).filter(
    name => !!sinkProxies[name],
  );

  let preInitBuffers = {} as ReplicationBuffers<Si>;
  const replicators = {} as SinkReplicators<Si>;
  const postInitReplicators = {} as SinkReplicators<Si>;
  sinkNames.forEach(name => {
    preInitBuffers[name] = [];
    replicators[name] = (x: any, type: number, instance: number) => {
      if (postInitReplicators[name]) {
        postInitReplicators[name](x, type, instance);
      } else {
        preInitBuffers[name].push([x, type, instance]);
      }
    };
  });

  const subscriptions = sinkNames.map(name => sinks[name](replicators[name]));

  sinkNames.forEach(name => {
    const push = (x: any, type?: number, instance?: number) => {
      scheduleMicrotask(() => sinkProxies[name].push(x, type, instance));
    };
    preInitBuffers[name].forEach(b => push(b[0], b[1], b[2]));
    postInitReplicators[name] = push;
  });
  preInitBuffers = null as any; // free up for GC

  return function stopReplication() {
    subscriptions.forEach(stop => stop && stop());
    sinkNames.forEach(name => sinkProxies[name].push(null, -1));
  };
}

function isObjectEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * A function that prepares the Cycle application to be executed. Takes a `main`
 * function and prepares to circularly connects it to the given collection of
 * driver functions. As an output, `setup()` returns an object with three
 * properties: `sources`, `sinks` and `run`. Only when `run()` is called will
 * the application actually execute. Refer to the documentation of `run()` for
 * more details.
 *
 * **Example:**
 * ```js
 * import {setup} from '@cycle/run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} plugins an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `sinks` and
 * `run`. `sources` is the collection of driver sources, `sinks` is the
 * collection of driver sinks, these can be used for debugging or testing. `run`
 * is the function that once called will execute the application.
 * @function setup
 */
export function setup<So extends Sources, Si extends Sinks>(
  main: (sources: So) => Si,
  plugins: Plugins<So, Si>,
): CycleProgram<So, Si> {
  if (typeof main !== `function`) {
    throw new Error(
      `First argument given to Cycle must be the 'main' ` + `function.`,
    );
  }
  if (typeof plugins !== `object` || plugins === null) {
    throw new Error(
      `Second argument given to Cycle must be an object ` +
        `with driver functions as properties.`,
    );
  }
  if (isObjectEmpty(plugins)) {
    throw new Error(
      `Second argument given to Cycle must be an object ` +
        `with at least one driver function declared as a property.`,
    );
  }

  const sinkProxies = makeSinkProxies<So, Si>(plugins);
  const sources = callDrivers<So, Si>(plugins, sinkProxies);
  const lowLevelMain = callAdapters(plugins, main);
  const sinks = lowLevelMain(sources);
  function _run(): Stop {
    const stopReplication = replicateMany(sinks, sinkProxies);
    return stopReplication;
  }
  return { sinks, sources, run: _run };
}

/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/run';
 * const dispose = run(main, drivers);
 * // ...
 * dispose();
 * ```
 *
 * The `main` function expects a collection of "source" streams (returned from
 * drivers) as input, and should return a collection of "sink" streams (to be
 * given to drivers). A "collection of streams" is a JavaScript object where
 * keys match the driver names registered by the `drivers` object, and values
 * are the streams. Refer to the documentation of each driver to see more
 * details on what types of sources it outputs and sinks it receives.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} plugins an object where keys are driver names and values
 * are driver functions.
 * @return {Function} a dispose function, used to terminate the execution of the
 * Cycle.js program, cleaning up resources used.
 * @function run
 */
export function run<So extends Sources, Si extends Sinks>(
  main: (sources: So) => Si,
  plugins: Plugins<So, Si>,
): Stop {
  const program = setup(main, plugins);
  return program.run();
}

export default run;
