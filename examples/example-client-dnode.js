var m = require("../")({ client : true });
var dnode = require('dnode');

m.require("thing@*", function (err, thing, version, node) {
	if (err) {
		console.log(err);
		return m.end();
	}

	console.log('got thing version %s', version, node);

	thing.echo('hello', console.log);
});
