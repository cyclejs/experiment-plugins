import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {adapt} from '@cycle/run/lib/adapt';

function makeThrottleAnimation(
  timeSource: any,
  schedule: any,
  currentTime: () => number,
) {
  return function throttleAnimation<T>(stream: Stream<T>): Stream<T> {
    const source = timeSource();

    const throttledStream = xs.create<T>({
      start(listener) {
        let lastValue: any = null;
        let emittedLastValue = true;
        const frame$ = xs.fromObservable(source.animationFrames());

        const animationListener = {
          next(event: any) {
            if (!emittedLastValue) {
              listener.next(lastValue);
              emittedLastValue = true;
            }
          },
        };

        xs.fromObservable(stream).addListener({
          next(event: T) {
            lastValue = event;
            emittedLastValue = false;
          },

          error(err: Error) {
            listener.error(err);
          },

          complete() {
            frame$.removeListener(animationListener);
            listener.complete();
          },
        });

        frame$.addListener(animationListener);
      },

      stop() {},
    });

    return adapt(throttledStream);
  };
}

export {makeThrottleAnimation};
