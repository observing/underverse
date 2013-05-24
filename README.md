# Underverse

Underverse is a small backlog/queue manager that detects when items in your
backlog are out of sync and issues a fetch event to retrieve the missing items.
This module makes the following assumptions about your backlog of data:

- The backlog works with a bag of a ids.
- The ids a nummeric which equals the position of the backlog.
- The ids are ordered.
- The backlog has limit.
- The backlog resets it's ids once the limit is reached.

### Build status

[![Build Status](https://travis-ci.org/observing/underverse.png)](https://travis-ci.org/observing/underverse)

### Installation

The installation is done through `npm`

```
npm install underverse --save
```

Add the `--save` if you want to save the module in your `package.json`.

### Usage

The module is initialized with the size of the `backlog`;

```js
var Underverse = require('underverse')
  , uv = new Underverse(1000);
```

The snippet above creates a new `underverse` that works with a backlog that
can contain `1000` items. You should set the initial id of log. For example if
your queue is filled with 100/10000 slots:

```js
uv.cursor(100);
```

As it could be possible that your messages get out of sync if you use a remote
backlog (for example a reconnect) you can listen to the `fetch` event to know
which ids are missing.

```
uv.on('fetch', function (missing, mark) {

})
```

The `fetch` event receives 2 arguments, an array of missing id and a `mark`
function. The mark function allows you set all ids in to a `fetching` state so
you won't retrieve duplicate fetch calls that retrieve the same information. If
you call the `mark` function with a boolean `true` it will mark all missing
ids as `received`.

When you have received a message from your backlog call the `uv.received()`
method with the id.

```js
uv.received(10)
```

and that's it. Take a look at the tests for some examples.

## License

MIT
