/*
 * This example will only be inerested in available servers
 * It will keep track of all the available remote servers
 * and it will only pipe process.stdin to one remote server
 * at a time.
 *
 * If a remote server connection ends and there are more 
 * remote servers available it will connect to the next
 * available remote server.
 */

var m = require("../")({ client : true });

var servers = [];
var server;

m.on("server", function (remote) {
	servers.push(remote);

	if (!server) {
		server = remote;
		process.stdin.pipe(server).pipe(process.stdout);
	}
	
	remote.on('end', function () {
		process.stdin.unpipe(server);

		servers.splice(servers.indexOf(remote), 1);
	
		//swap the server	
		if (server == remote) {
			server = servers[0];

			if (server) {
				process.stdin.pipe(server).pipe(process.stdout);
			}
		}
	});
});

