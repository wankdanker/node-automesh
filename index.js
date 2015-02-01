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

AutoMesh.types = {};

function AutoMesh (options) {
	EventEmitter.call(this);
	options = options || {};

	var self = this;
	var doListen = options.server || (!options.server && !options.client);
	var doConnect = options.client || (!options.server && !options.client);

	if (!doConnect) {
		//enable node-discover client only mode
		options.client = true;
	}

	self.autoconnect = (options.autoconnect === false) ? false : true;
	self.autoserve = (options.autoserve === false) ? false : true;
	self.discover = discover(options);
	self.services = {};
	self.types = {};
	self.shuttingDown = false;
	self.localServices = [];

	if (doConnect) {
		self._connect();
	}

	if (doListen && self.autoserve) {
		self.register(options.service, options.type);
	}
};

inherits(AutoMesh, EventEmitter);

AutoMesh.prototype._connect = function () {
	var self = this;
	var d = self.discover;

	d.on('added', function (node) {
		if (!node.advertisement || !node.advertisement.services) {
			//remote node is not advertising a port
			//it must not be listening or is part of
			//some other node-discover network running
			//on the same port
			return;
		}
		
		if (!self.autoconnect) {
			return;
		}

		node.services = node.services || [];

		//connect to each newly discovered service
		node.advertisement.services.forEach(function (service) {
			node.services.push(service);

			service.connection = net.createConnection(service.port, node.address, function () {
				self.emit("outbound", service.connection, node, service);	
				self.emit("server", service.connection, node, service);

				if (service.service) {
					self._processDiscoveredService(service, node);
				}
			});
		});
	});
};

AutoMesh.prototype._processDiscoveredService = function (service, node) {
	var self = this;
	var version = service.version || null;
	var role = service.service;
	var versions = self.services[role] = self.services[role] || {};
	var versionList = versions[version] = versions[version] || [];

	versionList.push(service);

	//monitor the connection for the close event
	service.connection.on('close', function () {
		//help out node-discover by removing the remote node from its collection
		//of nodes, otherwise it won't remove it until it times out
		//this assumes that if this particular connection has ended that all
		//other connections on this node are also ended
		//TODO: keep a count of active connections per node and when they have 
		//all died, then delete?
		delete self.discover.nodes[node.id];

		//remove it from the versionList array
		versionList.splice(versionList.indexOf(service), 1);
	});

	self.emit(role, service, node);
};

AutoMesh.prototype._listen = function (service, version, type, cb) {
	var self = this;
	var d = self.discover;
	var localService = {
		service : service
		, version : version
		, type : type
	};

	//create a tcp server
	localService.server = net.createServer(function (c) {
		self.emit("inbound", c, service, version);
		self.emit("client", c, service, version);
		if (cb) {
			cb(c);
		}
	});

	//get a random local port to listen on
	getPort(function (err, port) {
		if (err) {
			return console.log(err);
		}

		localService.port = port;

		localService.server.listen(port);

		self.localServices.push(localService);

		//update local services advertisement
		d.advertise({
			services : self.localServices.map(function (s) {
				//we do a map here so that we only output
				//the specific fields that we want.
				return {
					service : s.service
					, port : s.port
					, version : s.version
					, type : s.type
				};
			})
		});
	});
};

AutoMesh.prototype.register = function (role, type, cb) {
	var self = this;
	var service = (role || "").split("@")[0] || null;
	var version = (role || "").split("@")[1] || null;

	return self._listen(service, version, type, cb);
};

AutoMesh.prototype.require = function (key, cb) {
	var self = this;
	var service = key.split('@')[0] || null;
	var version = key.split('@')[1] || null;
	var canCallback = true;
	
	self.on(service, function (service, node) {
		//check for exact version match match
		if (service.version == version) {
			//TODO: watch remote.on('end') and auto failover
			return maybeCallback([service], service.version, node);
		}

		if (semver.satisfies(service.version, version)) {
			//TODO: on remote.on('end') check to see if another server is available
			// and call the callback again.
			return maybeCallback([service], service.version, node);
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

			var versionList = Object.keys(versions);
			var v;

			//loop through each service version and find one that satisfies semver
			for (var x = 0; x < versionList.length; x++) {
				v = versionList[x];

				if (semver.satisfies(v, version) && versions[v].length) {
					return maybeCallback(versions[v], v);
				}
			}
		}
	}

	function maybeCallback(services, version, node) {
		if (!canCallback || !services.length || self.shuttingDown) {
			return;
		}

		//TODO: return random/roundrobin/etc from remotes
		var service = services[0];
		var remote = service.connection;

		remote.on('close', function () {
			canCallback = true;
			evaluateServices();
		});

		canCallback = false;

		if (!service || !service.type) {
			//not type was available, just hand off the socket
			return cb(null, remote, version, node);
		}

		var type = service.type;

		//try to handle the type by types registered in this instance
		if (self.types[type]) {
			return self.types[type](remote, function (err, obj) {
				cb(err, obj, version, node);
			});
		}

		//try to handle the type by types registered on the module
		if (AutoMesh.types[type]) {
			return AutoMesh.types[type](remote, function (err, obj) {
				cb(err, obj, version, node);
			});
		}

		//try to handle the type by an external module
		try {
			var handler = require('automesh-' + type);

			handler(remote, function (err, obj) {
				cb(err, obj, version, node);
			});
		}
		catch (err) {
			return cb(err, remote, version, node);
		}
	}
};

AutoMesh.prototype.query = function (service) {
	var self = this;
	var services = [];

	self.discover.eachNode(function (node) {
		if (!node.advertisement) {
			return;
		}

		node.services.forEach(function (service) {
			services.push({
				service : service.service || ""
				, version : service.version || ""
				, hostname : node.hostName || ""
				, address : node.address || ""
				, port : service.port || ""
				, id : node.id
				, type : service.type || ""
				, connection : service.connection
			});
		});
        });

	return services;
};

AutoMesh.prototype.end = function () {
	var self = this;

	self.shuttingDown = true;
	
	self.query().forEach(function (service) {
		service.connection.destroy();
	});

	self.discover.stop();
};
