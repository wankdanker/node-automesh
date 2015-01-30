automesh
--------

Automatically discover, connect to and accept TCP connections from other
nodes on a subnet.

example
-------

```js
var m = require("automesh")();

m.on("inbound", function (remote) {
        remote.write("hello inbound connection\n");
        remote.pipe(process.stdout);
});

m.on("outbound", function (remote) {
        remote.write("hello outbound connection\n");
        process.stdin.pipe(remote).pipe(process.stdout);
});
```

install
-------

```bash
npm install automesh
```

api
---

### Constructor

```js
var mesh = automesh([options]);
```

* options is an optional configuration object
	* options.client
	* options.server
	* all other options are passed to the underlying [node-discover](https://github.com/wankdanker/node-discover/#constructor)
	constructor.

events
------

### inbound

Called when an inbound connection has been established.

```js
mesh.on('inbound', function (remote) {});
```

### outbound

Called when an outbound connection has been established.

```js
mesh.on('outbound', function (remote, node) {});
```

license
-------

MIT
