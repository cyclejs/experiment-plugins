export type Push<X> = (x: X, type?: number, instance?: number) => void;
export type Stop = () => void;
export type Straw<X> = (cb: Push<X>) => Stop | void;

export type Sources = { [name: string]: Straw<any> };
export type Sinks = { [name: string]: Straw<any> };

export type SinkProxy = { push: Push<any>; straw: Straw<any> };
export type SinkProxies<Si extends Sinks> = { [P in keyof Si]: SinkProxy };

export interface Driver {
  (sink: Straw<any>, channel?: string): Straw<any>;
}

export type Plugins<So extends Sources, Si extends Sinks> = {
  [P in keyof (So & Si)]: Plugin<Si[P], So[P]>
};

export interface Adapter<So, Si, Ko extends keyof So, Ki extends keyof Si> {
  (main: (so: So) => Si, ch?: Ko & Ki): (so: Lower<So, Ko>) => Lower<Si, Ki>;
}

export type Lower<S, K extends keyof S> = { [P in K]: Straw<any> } &
  { [P in keyof S]: S[P] };

export type Plugin<So, Si> = [Driver, Adapter<So, Si, any, any>];

export interface CycleProgram<So extends Sources, Si extends Sinks> {
  sources: So;
  sinks: Si;
  run(): Stop;
}
