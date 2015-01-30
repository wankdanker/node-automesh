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
			d.advertise({ port : port });
		});
	}
};

inherits(AutoMesh, EventEmitter);
