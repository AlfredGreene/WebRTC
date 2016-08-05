var static = require('node-static');
var http = require('http');
// Create a node-static server instance
var file = new(static.Server)();

// We use the http module's createServer function and
// rely on our instance of node-static to serve the files
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(8181);

// Use socket.io JavaScript library for real-time web applications
var io = require('socket.io').listen(app);

// Here channel is equivalent to the "room" concept in socke.io
// credits to http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients/24145381#24145381
function findClientsSocket(roomId, namespace) {
    // if room is not exist
    if (!(roomId in io.sockets.adapter.rooms)) {
        console.log("0 in this room")
        return 0;
    }
    // room exists
    else {
        var room = io.sockets.adapter.rooms[roomId];
            console.log(io.sockets.adapter.rooms);
            console.log(room.length + " in this room")
            return room.length;;
    }
}

// Let's start managing connections...
io.sockets.on('connection', function (socket){
	
    // Handle 'message' messages
    socket.on('message', function (message) {
        log('Server --> got message: ', message.message);
        // channel-only broadcast...
        socket.broadcast.to(message.channel).emit('message', message.message);
    });
        
    // Handle 'create or join' messages
    socket.on('create or join', function (room) {
        //var numClients = io.sockets.clients(room).length;
        var numClients = findClientsSocket(room);

        log('Server --> Room ' + room + ' has ' + numClients + ' client(s)');
        log('Server --> Request to create or join room', room);

        // First client joining...
        if (numClients == 0){
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            // Second client joining...
            // send join message to the Initiator who can now mark the channel as ready
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room);
        } else { // max two clients
            socket.emit('full', room);
        }
    });
        
    function log(){
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }
});