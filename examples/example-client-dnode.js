var m = require("../")({ client : true });
var dnode = require('dnode');

m.types.dnode = function (stream, cb) {
	var d = dnode();

	d.on('remote', function (remote) {
		cb(null, remote);
	});

	stream.pipe(d).pipe(stream)
};

m.require("thing", function (err, thing, version) {
	if (err) {
		console.log(err);
		return m.end();
	}

	console.log('got thing version %s', version);

	thing.echo('hello', console.log);
});
