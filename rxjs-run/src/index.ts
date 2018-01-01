import {Stream} from 'xstream';
import {Observable} from 'rxjs/Observable';
// tslint:disable-next-line:no-import-side-effect
import 'rxjs/add/observable/from';
import {setAdapt} from '@cycle/run/lib/adapt';
import {
  setup as coreSetup,
  DisposeFunction,
  Driver,
  FantasyObservable,
  Sources,
  Sinks,
  CycleProgram,
} from '@cycle/run';

export type Drivers<So extends Sources, Si extends Sinks> = {
  [P in keyof (So & Si)]: Driver<FantasyObservable, any>
};

setAdapt(function adaptXstreamToRx(stream: Stream<any>): Observable<any> {
  return Observable.from(stream);
});

/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/rxjs-run';
 * const dispose = run(main, drivers);
 * // ...
 * dispose();
 * ```
 *
 * The `main` function expects a collection of "source" Observables (returned
 * from drivers) as input, and should return a collection of "sink" Observables
 * (to be given to drivers). A "collection of Observables" is a JavaScript
 * object where keys match the driver names registered by the `drivers` object,
 * and values are the Observables. Refer to the documentation of each driver to
 * see more details on what types of sources it outputs and sinks it receives.
 *
 * @param {Function} main a function that takes `sources` as input
 * and outputs a collection of `sinks` Observables.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Function} a dispose function, used to terminate the execution of the
 * Cycle.js program, cleaning up resources used.
 * @function run
 */
export function run<So extends Sources, Si extends Sinks>(
  main: (sources: So) => Si,
  drivers: Drivers<So, Si>,
): DisposeFunction {
  const program = coreSetup(main, drivers);
  return program.run();
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
 * import {setup} from '@cycle/rxjs-run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input
 * and outputs a collection of `sinks` Observables.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `sinks` and
 * `run`. `sources` is the collection of driver sources, `sinks` is the
 * collection of driver sinks, these can be used for debugging or testing. `run`
 * is the function that once called will execute the application.
 * @function setup
 */
export function setup<So extends Sources, Si extends Sinks>(
  main: (sources: So) => Si,
  drivers: Drivers<So, Si>,
): CycleProgram<So, Si> {
  return coreSetup(main, drivers);
}

export default run;
