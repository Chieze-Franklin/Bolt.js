var Jaysos = (function(jaysos){
	jaysos.JQ = (function(jq){
		jq.AppManager = {
			startAppByName: function(app, options){
				Jaysos.JQ.WindowManager.openWindow(app, options);
			},
			startAppByTag: function(tag, options){
				Jaysos.ServiceManager.get('/apps/' + tag, function(err, data){
					if(err){
						//TODO: do sth
						return;
					}

					var contexts = JSON.parse(data);
      				if(contexts.length > 1){
      					//TODO: ask the user to choose
      					var msg = "Choose App:\n\n";
      					contexts.forEach(function(context, index){
      						msg += context.appInfo.name + " (" + context.path + ")\n\n";
      					});
      					var app = prompt(msg, contexts[0].path);
      					if(app != null)//TODO: include a confirm to ask if to use this app always (as against jst once)
      						Jaysos.JQ.WindowManager.openWindow(app, options);
      				}
      				else if(contexts.length == 1){
      					var context = contexts[0];
      					Jaysos.JQ.WindowManager.openWindow(context.path, options);
      				}
      				else{
      					//TODO: no app found
      					alert("No app found");
      				}
				});
			},
			stopAppByName: function(app){
				Jaysos.ServiceManager.get('/app-stop/' + app, function(err, data){
					if(err){
						//TODO: do sth
						return;
					}

					var context = JSON.parse(data);

					Jaysos.JQ.WindowManager.closeWindow(context.path);
				});
			}
		};

		return jq;
	}(jaysos.JQ || {}));

	return jaysos;
}(Jaysos || {}));