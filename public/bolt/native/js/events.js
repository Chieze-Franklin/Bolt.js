var Bolt = (function(bolt){

	hooks = [];

	bolt.EventManager = {
		fire: function(){
			//
		},
		on: function(route, handler, name){
			route = route.replace("\\", "/");

			var publisher, evnt;

			if (route.indexOf("/") == -1) {
				publisher = "*";
				evnt = route;
			}
			else {
				publisher = route.substring(0, route.indexOf("/"));
				if (publisher == "") publisher = "*";

				evnt = route.substr(route.indexOf("/") + 1);
				if (evnt == "") evnt = "*";
			}

			var newHook = {
				event: evnt,
				publisher: publisher,
				handler: handler
			};
			if (name) {
				newHook.name = name;
			}
			hooks.push(newHook)
		},
		remove: function(name){
			//
		}
	};

	var socket = io.connect("/");

	socket.on('message', function (event) {
		event = JSON.parse(event);
		hooks.forEach(function(hook){
			if ((hook.event == event.name || hook.event == "*") 
				&& (hook.publisher == event.publisher || hook.publisher == "*")) {
				hook.handler(event);
			}
		});
	});

	return bolt;
}(Bolt || {}));