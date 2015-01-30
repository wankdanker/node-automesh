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

	var self = this;
	var d = self.discover = discover(options);

	d.on('added', function (node) {
		node.connection = net.createConnection(node.advertisement.port, node.address, function () {
			self.emit("outbound", node.connection, node);	
		});
	});

	//create a tcp server
	var server = net.createServer(function (c) {
		self.emit("inbound", c);
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
};

inherits(AutoMesh, EventEmitter);
