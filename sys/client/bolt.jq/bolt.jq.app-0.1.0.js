var Bolt = (function(bolt){
	bolt.JQ = (function(jq){
		jq.AppManager = {
			startAppByName: function(app, options){
				Bolt.JQ.WindowManager.openWindow(app, options);
			},
			startAppByTag: function(tag, options){
				Bolt.ServiceManager.get('/apps/' + tag, function(err, data){
					if(err){
						//TODO: do sth
						return;
					}

					var response = JSON.parse(data);
					var contexts = response.body;
      				if(contexts.length > 1){
      					//TODO: ask the user to choose
      					var msg = "Choose App:\n\n";
      					contexts.forEach(function(context, index){
      						msg += context.appInfo.name + " (" + context.path + ")\n\n";
      					});
      					var app = prompt(msg, contexts[0].path);
      					if(app != null)//TODO: include a confirm to ask if to use this app always (as against jst once)
      						Bolt.JQ.WindowManager.openWindow(app, options);
      				}
      				else if(contexts.length == 1){
      					var context = contexts[0];
      					Bolt.JQ.WindowManager.openWindow(context.path, options);
      				}
      				else{
      					//TODO: no app found
      					alert("No app found");
      				}
				});
			},
			stopAppByName: function(app){
				Bolt.ServiceManager.post('/app-stop/' + app, {}, function(err, data){
					if(err){
						//TODO: do sth
						return;
					}

					var response = JSON.parse(data);
					var context = response.body;

					Bolt.JQ.WindowManager.closeWindow(context.path);
				});
			}
		};

		return jq;
	}(bolt.JQ || {}));

	return bolt;
}(Bolt || {}));