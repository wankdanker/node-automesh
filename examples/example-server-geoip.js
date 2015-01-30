var m = require("../")({ server : true, service : 'geoip' });

m.on("client", function (client) {
	client.write("hello inbound connection i am the server\n");

	process.stdin.pipe(client).pipe(process.stdout);
});

