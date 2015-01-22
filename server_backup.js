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
app.listen(8080, '0.0.0.0');

/* Setting up socket.io */
var io = require('socket.io').listen(app);

io.sockets.on('connection', function(socket) {

    socket.on('message', function(data) {

        console.log(data);
        //var address = udp_server.address();
        var client = dgram.createSocket("udp4");
        var message = new Buffer(data);

        //client.send(message, 0, message.length, address.port, address.address, function(err, bytes) {
        client.send(message, 0, message.length, "8000", "192.168.0.126", function(err, bytes) {
            client.close();
        });
    });
});

/* Setting up UDP server */
var dgram = require('dgram');

var udp_server = dgram.createSocket("udp4");

udp_server.on("listening", function() {
    var address = udp_server.address();
    console.log("Server listening on " + address.address + ":" + address.port);
});

udp_server.on("message", function(msg, rinfo) {
    console.log("Server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
    io.sockets.emit('message', "" + msg);
});

udp_server.on('error', function(err) {
    console.error(err);
    process.exit(0);
});

udp_server.bind(8000);
