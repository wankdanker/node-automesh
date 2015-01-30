var m = require("./d")();

m.on("inbound", function (remote) {
	remote.write("hello inbound connection\n");
	remote.pipe(process.stdout);
});

m.on("outbound", function (remote) {
	remote.write("hello outbound connection\n");
	process.stdin.pipe(remote).pipe(process.stdout);
});
