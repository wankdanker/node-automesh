var discover = require("node-discover")
	, net = require("net")
	, getPort = require("get-port")
	, EventEmitter = require("events").EventEmitter
	, inherits = require("util").inherits
	;

module.exports = function (options) {
	return new AutoMesh(options);
};

function AutoMesh (options) {
	EventEmitter.call(this);
	options = options || {};

	var self = this;
	var d = self.discover = discover(options);
	var doListen = options.server || (!options.server && !options.client);
	var doConnect = options.client || (!options.server && !options.client);
	var service = (options.service || "").split("@")[0] || null;
	var version = (options.service || "").split("@")[1] || null;

	self.services = {};

	if (doConnect) {
		d.on('added', function (node) {
			if (!node.advertisement.port) {
				//remote node is not advertising a port
				//it must not be listening.
				return;
			}

			//connect to the newly discovered node
			node.connection = net.createConnection(node.advertisement.port, node.address, function () {
				self.emit("outbound", node.connection, node);	
				self.emit("server", node.connection, node);

				if (node.advertisement.service) {
					var key = genKey(node.advertisement.service, node.advertisement.version);
					var services = self.services[key] = self.services[key] || [];
					services.push(node.connection);

					self.emit(node.advertisement.service, node.connection, node.advertisement.version);
					
					//when the connection ends, remove it from the services array
					node.connection.on('end', function () {
						services.splice(services.indexOf(node.connection), 1);
					});
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

AutoMesh.prototype.get = function (key, cb) {
	var self = this;
	var service = key.split('@')[0];
	var version = key.split('@')[1];
	
	//TODO loop through all the services to find semver
	//compatible services
	if (self.services[key] && self.services[key].length) {
		//TODO: toggle for returning random, round robin, or first service entry?
		return cb(null, self.services[key][0], version);
	}

	self.on(service, function (remote, version) {
		//TODO: check to see if version satisfies semver
		//TODO: on remote.on('end') check to see if another server is available
		// and call the callback again.
		return cb(null, remote, version);
	});
};

function genKey (service, version) {
	return (version) 
		? [service, version].join('@')
		: service
		;
}

