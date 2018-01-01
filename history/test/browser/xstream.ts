/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';

import {
  HistoryInput,
  Location,
  captureClicks,
  makeHistoryDriver,
} from '../../src';
import {run, setup} from '@cycle/run';
import xs, {Stream} from 'xstream';

import {setAdapt} from '@cycle/run/lib/adapt';

let dispose = () => {};

describe('historyDriver - xstream', () => {
  beforeEach(function() {
    setAdapt(x => x);
    dispose();
  });

  it('should return a stream', () => {
    function main(sources: {history: Stream<Location>}) {
      assert.strictEqual(typeof sources.history.remember, 'function');
      return {
        history: xs.never(),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});
    assert.strictEqual(typeof sources.history.remember, 'function');
  });

  it('should create a location from pathname', function(done) {
    function main(sources: {history: Stream<Location>}) {
      return {
        history: xs.of('/test'),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.drop(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should create a location from PushHistoryInput', function(done) {
    function main(sources: {history: Stream<Location>}) {
      return {
        history: xs.of({type: 'push', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.drop(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should create a location from ReplaceHistoryInput', function(done) {
    function main(sources: {history: Stream<Location>}) {
      return {
        history: xs.of({type: 'replace', pathname: '/test'}),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    sources.history.drop(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, '/test');
        done();
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });

  it('should allow going back/forwards with `go`, `goBack`, `goForward`', function(
    done,
  ) {
    function main(sources: {history: Stream<Location>}) {
      return {
        history: xs
          .periodic(100)
          .take(6)
          .map(
            i =>
              [
                '/test',
                '/other',
                {type: 'go', amount: -1},
                {type: 'go', amount: +1},
                {type: 'goBack'},
                {type: 'goForward'},
              ][i],
          ),
      };
    }

    const {sources, run} = setup(main, {history: makeHistoryDriver()});

    const expected = ['/test', '/other', '/test', '/other', '/test', '/other'];

    sources.history.drop(1).subscribe({
      next(location: Location) {
        assert.strictEqual(location.pathname, expected.shift());
        if (expected.length === 0) {
          done();
        }
      },
      error: done,
      complete: () => {
        done('complete should not be called');
      },
    });
    dispose = run();
  });
});
