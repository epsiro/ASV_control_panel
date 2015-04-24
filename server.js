/* Setup logging */
var winston = require('winston');
winston.add(winston.transports.File, { filename: 'myrerjordet_test_2014-04-25.log' });

winston.info('Starting server.');

/* Setting up webserver */
var node_static = require('node-static');

var files = new node_static.Server('./public');

function http_handler(request, response) {
    request.on('end', function() {
        files.serve(request, response);
    }).resume();
}

var http = require('http');

var app = http.createServer(http_handler);
app.listen(80, '0.0.0.0');

/* Setting up socket.io */
var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket) {

    socket.on('message', function(data) {

        //console.log("sending:" + data);
        winston.info("sending:" + data);

        var client = new net.Socket();
        var message = new Buffer(data);

        client.connect(30470, "192.168.1.21", function() {
            client.write(message);
            client.destroy();
        });

    });
});

/* Setting up TCP client */
var net = require('net');

/* Setting up UDP server */
var dgram = require('dgram');

var udp_server = dgram.createSocket("udp4");

udp_server.on("listening", function() {
    var address = udp_server.address();
    //console.log("Server listening on " + address.address + ":" + address.port);
    winston.info("Server listening on " + address.address + ":" + address.port);
});

udp_server.on("message", function(msg, rinfo) {
    //console.log("Server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
    winston.info("Server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
    io.sockets.emit('message', "" + msg);
});

udp_server.on('error', function(err) {
    console.error(err);
    process.exit(0);
});

udp_server.bind(8000);
