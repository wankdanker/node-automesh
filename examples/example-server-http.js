var http = require('http')
var m = require("../")({ server : true });

m.register('www.example.com', 'http', null, function (err, service) { 
	var server = http.createServer(function (req, res) {
		res.end('hello');
	});

	server.listen(service.server);
});

