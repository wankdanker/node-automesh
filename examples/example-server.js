var m = require("../")({ server : true });

m.on("inbound", function (remote) {
	remote.write("hello inbound connection i am the server\n");

	process.stdin.pipe(remote).pipe(process.stdout);
});

