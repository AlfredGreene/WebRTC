// node-static understands and supports conditional GET and HEAD requests. node-static was inspired by some of the other static-file serving modules out there, such as node-paperboy and antinode.
var static = require('node-static');

var http = require('http');

// Create a node-static server instance listening on port 8181
var file = new(static.Server)();

// We use the http modules createServer function and
// use our instance of node-static to serve the files
var app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(8181);

console.log('Listening on ' + app.address().port);

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

// Let's start *managing connections*!
io.sockets.on('connection', function (socket){

		// Handle 'message' messages
        socket.on('message', function (message) {
                log('S --> Got message: ', message);
                socket.broadcast.to(message.channel).emit('message', message.message);
        });

		// Handle 'create or join' messages
        socket.on('create or join', function (channel) {
                var numClients = findClientsSocket(channel);
                log('numclients = ' + numClients);

                // First client joining...
                if (numClients == 0){
                        socket.join(channel);
                        socket.emit('created', channel);
                // Second client joining...
                } else if (numClients == 1) {
                        // Inform initiator...
                		io.sockets.in(channel).emit('remotePeerJoining', channel);
                		// Let the new peer join channel
                        socket.join(channel);
                        // broadcasting on a channel made of just two peers is equivalent to sending a notification to the peer who was not the sender of the message itself
                        socket.broadcast.to(channel).emit('broadcast: joined', 'S --> \
                        		broadcast(): client ' + socket.id + ' joined channel ' + channel);
                } else { // max two clients
                		log("Channel full!");
                        socket.emit('full', channel);
                }
        });

        // Handle 'response' messages
        socket.on('response', function (response) {
            log('S --> Got response: ', response);

            // Just forward message to the other peer
            // broadcasting on a channel made of just two peers is equivalent to sending a notification to the peer who was not the sender of the message itself
            socket.broadcast.to(response.channel).emit('response', response.message);
        });

        // Handle 'Bye' messages
        socket.on('Bye', function(channel){
        	// Notify other peer
        	socket.broadcast.to(channel).emit('Bye');

        	// Close socket from server's side
        	socket.disconnect();
        });

        // Handle 'Ack' messages
        socket.on('Ack', function () {
            log('Got an Ack!');
            // Close socket from server's side
        	socket.disconnect();
        });

		// Utility function used for remote logging
		function log(){
			var array = [">>> "];
			for (var i = 0; i < arguments.length; i++) {
				array.push(arguments[i]);
			}
			socket.emit('log', array);
		};
});