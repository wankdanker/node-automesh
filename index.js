var discover = require("node-discover")
	, net = require("net")
	, getPort = require("get-port")
	, EventEmitter = require("events").EventEmitter
	, inherits = require("util").inherits
	, semver = require('semver')
	;

module.exports = function (options) {
	return new AutoMesh(options);
};

function AutoMesh (options) {
	EventEmitter.call(this);
	options = options || {};

	var self = this;
	var doListen = options.server || (!options.server && !options.client);
	var doConnect = options.client || (!options.server && !options.client);
	var service = (options.service || "").split("@")[0] || null;
	var version = (options.service || "").split("@")[1] || null;

	if (!doConnect) {
		//enable node-discover client only mode
		options.client = true;
	}

	var d = self.discover = discover(options);

	self.services = {};

	if (doConnect) {
		d.on('added', function (node) {
			if (!node.advertisement || !node.advertisement.port) {
				//remote node is not advertising a port
				//it must not be listening or is part of
				//some other node-discover network running
				//on the same port
				return;
			}

			//connect to the newly discovered node
			node.connection = net.createConnection(node.advertisement.port, node.address, function () {
				self.emit("outbound", node.connection, node);	
				self.emit("server", node.connection, node);

				if (node.advertisement.service) {
					var version = node.advertisement.version || null;
					var service = node.advertisement.service;
					var versions = self.services[service] = self.services[service] || {};
					var versionList = versions[version] = versions[version] || [];

					versionList.push(node.connection);

					//when the connection ends, remove it from the services array
					node.connection.on('close', function () {
						versionList.splice(versionList.indexOf(node.connection), 1);
					});

					self.emit(service, node.connection, version);
				}
			});
		});
	}

	if (doListen) {
		//create a tcp server
		var server = net.createServer(function (c) {
			self.emit("inbound", c);
			self.emit("client", c);
		});

		//get a random local port to listen on
		getPort(function (err, port) {
			if (err) {
				return console.log(err);
			}

			server.listen(port);

			//advertise what port we are listening on
			d.advertise({
				port : port
				, service : service
				, version : version
			});
		});
	}
};

inherits(AutoMesh, EventEmitter);

AutoMesh.prototype.require = function (key, cb) {
	var self = this;
	var service = key.split('@')[0] || null;
	var version = key.split('@')[1] || null;
	var canCallback = true;
	
	self.on(service, function (remote, v) {
		//check for exact version match match
		if (v == version) {
			//TODO: watch remote.on('end') and auto failover
			return maybeCallback([remote], v);
		}

		if (semver.satisfies(v, version)) {
			//TODO: on remote.on('end') check to see if another server is available
			// and call the callback again.
			return maybeCallback([remote], v);
		}
	});

	evaluateServices();

	function evaluateServices() {
		if (self.services[service]) {
			var versions = self.services[service];

			//if exact match exists, return that
			if (versions[version]) {
				return maybeCallback(versions[version], version);
			}

			var versionList = Object.keys(services[service]);
			var v;

			//loop through each service version and find one that satisfies semver
			for (var x = 0; x < versionsList.length; x++) {
				v = versionsList[x];

				if (semver.satisfies(v, version) && versions[v].length) {
					return maybeCallback(versions[v], v);
				}
			}
		}
	}

	function maybeCallback(remotes, version) {
		if (!canCallback || !remotes.length) {
			return;
		}

		//TODO: return random/roundrobin/etc from remotes
		var remote = remotes[0];

		remote.on('close', function () {
			canCallback = true;
			evaluateServices();
		});

		canCallback = false;

		return cb(null, remote, version);
	}
};
