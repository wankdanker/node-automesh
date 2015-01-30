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
	* options.service - a service name provided by the mesh node. Example: 'auth@1.2.3' or 'geoip'
	* options.client - operate in client only mode. Disables outbound/server events (default: false)
	* options.server - operate in server only mode. Disables inbound/client events (default: flase)
	* all other options are passed to the underlying [node-discover](https://github.com/wankdanker/node-discover/#constructor)
	constructor.

### mesh.require('service@x.x.x', function CallBack (err, remote, version) {})

Seaportish service registry callback. Get a callback when a mesh node
appears on the network that provides a service that satisfies the semver portion
of the service requirement. Callback is called again if remote closes and a 
matching service is available on another node.

Example Client:

```js
var mesh = automesh({ client : true });

mesh.require('auth', function (err, remote, version) {

});

mesh.require('geoip@^1.0.0', function (err, remote, version ) {

});
```

Example Auth Server:

```js
var mesh = automesh({ server : true, service : 'auth' });

mesh.on('client', function (remote) {
	//TODO: bind our auth functions via dnode to the remote stream
});
```

Example Geoip Server:

```js
var mesh = automesh({ server : true, service : 'geoip@1.2.3' })

mesh.on('client', function (remote) {
	//TODO: bind the geoip functions to the remote stream using dnode
});
```

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
