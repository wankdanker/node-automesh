var table = require('text-table');

module.exports = function (program, mesh) {
    process.stdout.write('discovering services');
    mesh.discover.on('added', function () {
        process.stdout.write('.');
    });

    setTimeout(enumerateServices, 5000);

    function enumerateServices () {
        var columns = ['service', 'version', 'type', 'hostname', 'address', 'port', 'id'];
        var data    = [columns];
        var services = mesh.query();

        data.push(['-------', '-------', '----', '--------', '-------', '----', '--']);

        services.forEach(function (service) {
            var tmp = [];

            columns.forEach(function (column) {
                tmp.push(service[column]);
            });

            data.push(tmp);
        });

	process.stdout.write('\n');
        process.stdout.write(table(data));
	process.stdout.write('\n');

        mesh.end();
    }
};

