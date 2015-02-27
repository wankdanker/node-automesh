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

cli

```bash
npm install -g automesh
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
	* options.port - discover port to use for UDP broadcast (passed to [node-discover][4])
	* options.key - key used to encrypt broadcast traffic (passed to [node-discover][4])
	* all other options are passed to the underlying [node-discover][4]
	constructor.

### mesh.end()

Destroy all connections that have been established and stop discover
services.

### mesh.query([service])

* service - optional - service name or servicename@semver to filter

This is a synchronous function that will return an array of services
currently available. If no service is provided all services are returned.

### mesh.register(service, type, connectionListener, readyListener)

* service - service name or servicename@semver to register
* type - the type of sevice. Used to tell the client how to process the stream
* connectionListener - a callback function that is called for each new connection
* readyListener - a callback function that is called when the service is registered
		and the stream is available. 

```js
var server = require('http').createServer(function (req, res) {
	res.end('hello');
});

mesh.register('www@1.0.0', null, null, function (err, service) {
	server.listen(service.server);
});
```

### mesh.require(service, callback)

* service - service name or servicename@semver to request
* callback - function (err, remote, version) 

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

### local-service

Called when a local service has been created

```js
var server = require('http').createServer(function (req, res) {
	res.end('hello');
});

mesh.on('local-service', function (service) {
	//tell the http server to listen using the newly
	//registered network stream
	server.listen(service.server);
});
```


cli
---

```bash
$ automesh list
```

inspiration
-----------

This started as an example on how to use [node-discover][3] for this [conversation][1].
For the purposes of that example, it may be best to review the code as of [the initial commit][2].
I have a problem keeping things simple so complexity has been introduced with new feature.

license
-------

MIT

[1]: https://github.com/wankdanker/node-discover/issues/7#issuecomment-72145016
[2]: https://github.com/wankdanker/node-automesh/tree/v1.0.0
[3]: https://github.com/wankdanker/node-discover
[4]: https://github.com/wankdanker/node-discover/#constructor
