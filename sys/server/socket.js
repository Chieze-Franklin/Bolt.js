var io = require('socket.io');

exports.initialize = function(server) {
	io = io.listen(server);
	io.sockets.on("connection", function(socket) {
		console.log("/////////////////////////Successfully connected to socket!!!");
		socket.send(JSON.stringify({
			type: 'serverMessage',
			message: 'Hello World'
		}));
		/*socket.on('message', function(message){
			message = JSON.parse(message);
			if(message.type == 'userMessage') {
				socket.broadcast.send(JSON.stringify(message));
				message.type = 'myMessage';
				socket.send(JSON.stringify(message));
			}
		});*/
		socket.on('disconnect', function() {});
	});
}