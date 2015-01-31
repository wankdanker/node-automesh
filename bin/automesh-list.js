var table = require('text-table');

module.exports = function (program, mesh) {
    process.stdout.write('discovering services');
    mesh.discover.on('added', function () {
        process.stdout.write('.');
    });

    setTimeout(enumerateServices, 5000);

    function enumerateServices () {
        var columns = ['service', 'version', 'type', 'address', 'port', 'id'];
        var data    = [columns];
        var services = mesh.query();

        data.push(['----', '-------', '----', '-------', '----', '--']);

        services.forEach(function (service) {
            var tmp = [];

            columns.forEach(function (column) {
                tmp.push(service[column]);
            });

            data.push(tmp);
        });

        console.log('\n', table(data));

        mesh.end();
    }
};

