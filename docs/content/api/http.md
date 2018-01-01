# Cycle HTTP - [source](https://github.com/cyclejs/cyclejs/tree/master/http)

A Driver for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

## Usage

Basics:

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  // ...
}

const drivers = {
  HTTP: makeHTTPDriver()
}

run(main, drivers);
```

Simple and normal use case:

```js
function main(sources) {
  let request$ = xs.of({
    url: 'http://localhost:8080/hello', // GET method by default
    category: 'hello',
  });

  let response$ = sources.HTTP
    .select('hello')
    .flatten();

  let vdom$ = response$
    .map(res => res.text) // We expect this to be "Hello World"
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text)
      ])
    );

  return {
    DOM: vdom$,
    HTTP: request$
  };
}
```

A thorough guide to the API inside `main`:

```js
function main(source) {
  // The HTTP Source has properties:
  // - select(category) or select()
  // - filter(predicate)
  // Notice $$: it means this is a metastream, in other words,
  // a stream of streams.
  let httpResponse$$ = source.HTTP.select();

  httpResponse$$.addListener({
    next: httpResponse$ => {
      // Notice that httpResponse$$ emits httpResponse$.

      // The response stream has a special field attached to it:
      // `request`, which is the same object we emit in the sink stream.
      // This is useful for filtering: you can find the
      // httpResponse$ corresponding to a certain request.
      console.log(httpResponse$.request);
    },
    error: () => {},
    complete: () => {},
  });

  let httpResponse$ = httpResponse$$.flatten(); // flattens the metastream
  // the reason why we need to flatten in this API is that you
  // should choose which concurrency strategy to use.
  // Normal xstream flatten() has limited concurrency of 1, meaning that
  // the previous request will be canceled once the next request to the
  // same resource occurs.
  // To have full concurrency (no cancelling), use flattenConcurrently()

  httpResponse$.addListener({
    next: httpResponse => {
      // httpResponse is the object we get as response from superagent.
      // Check the documentation in superagent to know the structure of
      // this object.
      console.log(httpResponse.status); // 200
    },
    error: (err) => {
      // This is a network error
      console.error(err);
    },
    complete: () => {},
  });

  // The request stream is an object with property `url` and value
  // `http://localhost:8080/ping` emitted periodically, every second.
  let request$ = xs.periodic(1000)
    .mapTo({ url: 'http://localhost:8080/ping', method: 'GET' });

  return {
    HTTP: request$ // HTTP driver expects the request$ as input
  };
}
```

## Error handling

You can handle errors using standard xstream or RxJS operators. The response stream is a stream of streams, i.e. each response will be its own stream so usually you want to catch errors for that single response stream:

```js
sources.HTTP
  .select('hello')
  .map((response$) =>
    response$.replaceError(() => xs.of(errorObject))
  ).flatten()
```
For more information, refer to the [xstream documentation for replaceError](https://github.com/staltz/xstream#replaceError) or the [RxJS documention for catch](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/catch.md).

## More information

For a more advanced usage, check the [Search example](https://github.com/cyclejs/cyclejs/tree/master/examples/http-search-github).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

# Isolation semantics

Cycle HTTP supports isolation between components using the `@cycle/isolate` package. Here is how isolation contexts work in Cycle HTTP given a `scope` to `isolate(Component, scope)`:

**When the scope is `null`: no isolation.**

The child component will have run in the same context as its parent, and methods like `HTTPSource.select()` will have access to response streams related to the parent. This means the child component is able to see responses that it did not itself produce.

**When the scope is a string: siblings isolation.**

A `HTTPSource.select()` call in a parent component will have access to HTTP responses from its children. However, a `HTTPSource.select()` inside a child component isolated with "siblings isolation" will have no access to HTTP responses in other children components isolated with "siblings isolation".

# API
