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

### inbound/client

Called when an inbound connection has been established
from a remote client.

```js
mesh.on('inbound', function (remote) {});
// or
mesh.on('client', function (remote) {});
```

### outbound/server

Called when an outbound connection has been established
to a remote server.

```js
mesh.on('outbound', function (remote, node) {});
// or
mesh.on('server', function (remote, node) {});
```

license
-------

MIT
