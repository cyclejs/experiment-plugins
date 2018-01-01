/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';

import {
  Location,
  captureClicks,
  makeHashHistoryDriver,
  makeHistoryDriver,
} from '../../src';
import {createMemoryHistory} from 'history';
import xs, {Stream} from 'xstream';
import {setup} from '@cycle/run';
import {setAdapt} from '@cycle/run/lib/adapt';

describe('makeHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHistoryDriver, 'function');
  });

  it('should return a function', () => {
    assert.strictEqual(typeof makeHistoryDriver(), 'function');
  });

  it('should return allow injecting History object directly', () => {
    const history = createMemoryHistory();
    assert.strictEqual(typeof makeHistoryDriver(history), 'function');
  });

  it('should start emitting the current location', function(done) {
    const history$ = makeHistoryDriver()(xs.never());

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert(location.pathname);
        done();
      },
      error: err => {},
      complete: () => {},
    });

    setTimeout(() => {
      sub.unsubscribe();
    });
  });
});

// This is skipped because somehow, IN LATEST FIREFOX IN WIN10, state is being
// carried around between tests. Tests work when run separately, but when run
// all together, something fails.
describe.skip('makeHashHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver, 'function');
  });

  it('should return a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver(), 'function');
  });

  it('should start emitting the current location', function(done) {
    const history$ = makeHashHistoryDriver()(xs.never());

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert(location.pathname);
        done();
      },
      error: err => {},
      complete: () => {},
    });

    setTimeout(() => {
      sub.unsubscribe();
    });
  });
});

describe('captureClicks', () => {
  it('should allow listening to link clicks and change route', function(done) {
    const historyDriver = makeHistoryDriver();
    const sink = xs.never();
    const history$ = captureClicks(historyDriver)(sink);

    const sub = history$.drop(1).subscribe({
      next: (location: Location) => {
        assert.strictEqual(location.pathname, '/test');
        sub.unsubscribe();
        sink.shamefullySendComplete();
        done();
      },
      error: err => {},
      complete: () => {},
    });

    const a = document.createElement('a');
    a.href = '/test';
    document.body.appendChild(a);

    setTimeout(() => {
      a.click();
    });
  });

  it('should remove click listener when disposed of', function(done) {
    setAdapt(x => x);

    function main(sources: {history: Stream<Location>}) {
      return {
        history: xs.never(),
      };
    }

    const {sources: sources1, run: run1} = setup(main, {
      history: captureClicks(makeHistoryDriver()),
    });
    const sub1 = sources1.history.drop(1).subscribe({
      next: () => done(new Error('should not trigger')),
      error: err => {},
      complete: () => {},
    });
    const dispose1 = run1();
    dispose1();

    const {sources: sources2, run: run2} = setup(main, {
      history: captureClicks(makeHistoryDriver()),
    });
    let dispose2 = () => {};
    const sub2 = sources2.history.drop(1).subscribe({
      next: (location: Location) => {
        assert.strictEqual(location.pathname, '/dispose');
        sub1.unsubscribe();
        sub2.unsubscribe();
        dispose2();
        done();
      },
      error: err => done(err),
      complete: () => {},
    });

    dispose2 = run2();

    const a = document.createElement('a');
    a.href = '/dispose';
    document.body.appendChild(a);

    setTimeout(() => {
      a.click();
    });
  });
});
