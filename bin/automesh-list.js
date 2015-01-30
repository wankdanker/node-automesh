var table = require('text-table');

module.exports = function (program, mesh) {
    console.log('discovering services...');
    mesh.discover.on('added', function () {
        console.log('.');
    });

    setTimeout(enumerateServices, 5000);

    function enumerateServices () {
        var columns = ['service', 'version', 'address', 'port', 'id'];
        var data    = [columns];
        var services = mesh.query();

        data.push(['----', '-------', '-------', '----', '--']);

        services.forEach(function (service) {
            var tmp = [];

            columns.forEach(function (column) {
                tmp.push(service[column]);
            });

            data.push(tmp);
        });

        console.log(table(data));

        mesh.end();
    }
};

