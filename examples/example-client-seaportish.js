var m = require("../")({ client : true });

m.get("geoip@^1.0.0", function (err, remote, version) {
	console.log('got geoip version %s', version);
});
