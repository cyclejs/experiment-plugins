import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import BmiCalculator from './BmiCalculator';

const main = BmiCalculator;

run(main, {
  DOM: makeDOMDriver('#main-container'),
});
