var m = require("../")({ client : true });

m.on("outbound", function (remote) {
	remote.write("hello there new server\n");
	process.stdin.pipe(remote).pipe(process.stdout);
});
