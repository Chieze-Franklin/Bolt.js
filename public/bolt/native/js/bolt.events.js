var Bolt = (function(bolt){

	hooks = [];

	bolt.Events = {
		emit: function(eventName, eventData, appToken, callback){
			Bolt.Request.to("/api/events/" + eventName, 
				{
					method: 'POST', 
					headers: {'Content-Type': 'application/json', 'X-Bolt-App-Token': appToken}, 
					body: JSON.stringify(eventData)
				}, callback);
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
			var indicesToRemove = [];
			indicesToRemove = hooks.map(function(hook, index){
				if (hook.name == name) {
					return index;
				}
			});

			var filteredHooks = [];
			filteredHooks = hooks.filter(function(hook, index){
              return indicesToRemove.indexOf(index) == -1;
            });

            hooks = filteredHooks;
		}/*,
		for: function(channel){
			var s = io.connect("/" + channel);
			s.on('message',...)
		}*/
	};

	var socket = io.connect("/");

	socket.on('connection', function () {
		hooks.forEach(function(hook){
			if ((hook.event == "server-connected" || hook.event == "*") 
				&& (hook.publisher == "bolt" || hook.publisher == "*")) {
				if (typeof hook.handler === "function") hook.handler();
			}
		});
	});

	socket.on('message', function (event) {
		event = JSON.parse(event);
		hooks.forEach(function(hook){
			if ((hook.event == event.name || hook.event == "*") 
				&& (hook.publisher == event.publisher || hook.publisher == "*")) {
				if (typeof hook.handler === "function") hook.handler(event);
			}
		});
	});

	socket.on('disconnect', function () {
		hooks.forEach(function(hook){
			if ((hook.event == "server-disconnected" || hook.event == "*") 
				&& (hook.publisher == "bolt" || hook.publisher == "*")) {
				if (typeof hook.handler === "function") hook.handler();
			}
		});
	});

	return bolt;
}(Bolt || {}));