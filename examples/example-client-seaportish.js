var m = require("../")({ client : true });

m.require("geoip", function (err, remote, version) {
	console.log('got geoip version %s', version);
});
