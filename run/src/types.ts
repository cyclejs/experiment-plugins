import { Callbag } from 'callbag';

export type Sources = { [name: string]: Callbag };
export type Sinks = { [name: string]: Callbag };

export type SinkProxies<Si extends Sinks> = { [P in keyof Si]: Callbag };

export interface Driver {
  (sink: Callbag, channel?: string): Callbag;
}

export type Plugins<So extends Sources, Si extends Sinks> = {
  [P in keyof (So & Si)]: Plugin<Si[P], So[P]>
};

export interface Adapter<So, Si, Ko extends keyof So, Ki extends keyof Si> {
  (main: (so: So) => Si, ch?: Ko & Ki): (so: Lower<So, Ko>) => Lower<Si, Ki>;
}

export type Lower<S, K extends keyof S> = { [P in K]: Callbag } &
  { [P in keyof S]: S[P] };

export type Plugin<So, Si> = [Driver, Adapter<So, Si, any, any>];

export interface CycleProgram<So extends Sources, Si extends Sinks> {
  sources: So;
  sinks: Si;
  run(): any;
}
