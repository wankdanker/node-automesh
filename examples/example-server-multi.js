var m = require("../")({ server : true, autoserve : false });
var dnode = require('dnode');

var fns = {
	echo : function (text, cb) {
		return cb(text);
	}
};

m.register("thing@1.2.3", "dnode", function (client) {
	var d = dnode(fns);

	client.pipe(d).pipe(client);
});

m.register("thing@2.4.5", "dnode", function (client) {
	var d = dnode(fns);

	client.pipe(d).pipe(client);
});

