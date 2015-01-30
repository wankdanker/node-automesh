var m = require("../")({ server : true, service : 'thing', type : 'dnode' });
var dnode = require('dnode');

var fns = {
	echo : function (text, cb) {
		return cb(text);
	}
};

m.on("client", function (client) {
	var d = dnode(fns);

	client.pipe(d).pipe(client);
});

