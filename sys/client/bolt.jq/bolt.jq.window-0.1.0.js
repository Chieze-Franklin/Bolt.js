var Bolt = (function(bolt, $){
	bolt.JQ = (function(jq){
		var __mapPathToWindows = new Map();

		jq.WindowManager = {

			dialog: function(message, title, options){
				var opt = {
					beforeClose: function(){
						if(options.beforeClose){
							options.beforeClose();
						}
					},
					closeOnEscape: true,
					open: function(){ $(this).html(message); },
					title: title
				};
				$('<div>').dialog(opt);
			},
			closeWindow: function(_path){
				var winContextArray = __mapPathToWindows.get(_path);
				if(winContextArray && winContextArray.length > 0){
					winContextArray.forEach(function(winContext, index){
						if(winContext && winContext.window){
							if (winContext.type === 'js') {//native javascript win
  								winContext.window.close();
  							}
  							else if (winContext.type === 'jq') {//jquery dialog
  								winContext.window.dialog('destroy');
  							}
						}
					});
					__mapPathToWindows.delete(_path);
				}
			},
			openWindow: function(app, options){
				for(i = 0; app.charAt(i) == '/' && i < app.length; )
					app = app.substring(i + 1);

				Bolt.ServiceManager.post('/app-start', { app: app}, function(err, data){
					if(err){
						//TODO: do sth
						return;
					}

					var response = JSON.parse(data);
					var context = response.body;

					var winContext;

					//see if a window for tha app is already open
					if(options.instance !== 'new'){
						var winContextArray = __mapPathToWindows.get(context.path);
						if(winContextArray && winContextArray.length > 0)
							winContext = winContextArray[winContextArray.length - 1];
					}

					if(context.port && context.appInfo.bolt.index){
	  					var _host = (context.host) ? context.host : Bolt.Config.getHost();
	  					var url = Bolt.Config.getProtocol() + "://" + _host + ":" + context.port + context.appInfo.bolt.index;

	  					if(options.mode === 'full-screen' || options.mode === 'new-tab'){
	  						var target = '_self';
	  						if(options.mode === 'new-tab')
	  							target = '_blank';
	  						if(winContext && winContext.window) {//reopen old window
	  							if (winContext.type === 'js') {//native javascripi win
	  								winContext.window.open(url, target);//TODO: Error: Permission denied to access property "open"
	  							}
	  							else if (winContext.type === 'jq') {//jquery dialog
	  								winContext.window.dialog('open');
	  							}
	  							return;//so that the lines of code adding a new window to __mapPathToWindows won't run
	  						}
	  						else { //open new window
	  							var w = window.open(url, target);
	  							//TODO: a reliable to detect browser/tab close (not refresh or link click or any other pseudo-close events)
	  							winContext = {
	  								type: 'js',
	  								window: w
	  							};
	  						}
	  					}
	  					else {//if(options.mode === 'dialog' || options.mode === 'window'){
	  						if(winContext && winContext.window) {//reopen old window
	  							if (winContext.type === 'js') {//native javascripi win
	  								winContext.window.open(url, '_self');//TODO: Error: Permission denied to access property "open"
	  							}
	  							else if (winContext.type === 'jq') {//jquery dialog
	  								if(winContext.window.dialog('isOpen'))
	  									winContext.window.dialog('moveToTop');
	  								else
	  									winContext.window.dialog('open');
	  							}
	  							return;//so that the lines of code adding a new window to __mapPathToWindows won't run
	  						}
	  						else { //open new window
	  							var _closeOnEscape = (options.mode === 'dialog') ? true : false;
	  							var _height = (options.height) ? options.height : ((options.mode === 'dialog') ? "auto" : 600);
	  							var _minHeight = (options.minHeight) ? options.minHeight : 150;
	  							var _minWidth = (options.minWidth) ? options.minWidth : 150;
	  							var _modal = (options.mode === 'dialog') ? true : false;
	  							var _title = (options.title) ? options.title : context.appInfo.name; //TODO: revise this
	  							var _width = (options.width) ? options.width : ((options.mode === 'dialog') ? "auto" : 600);
	  							var opt = {
	  								//TODO: buttons
	  								close: function(){
	  									var wcarray = __mapPathToWindows.get(context.path);
	  									for(index = 0; index < wcarray.length; index++){
	  										var wc = wcarray[index];
	  										if(wc.type === 'jq' && wc.window[0].id === $(this)[0].id){
	  											wcarray.splice(index, 1);
	  											break;
	  										}
	  									}
	  								},
	  								closeOnEscape: _closeOnEscape,
	  								focus: function(){ console.log("move to top"); $(this).dialog('moveToTop'); },
	  								height: _height,
	  								maxHeight: options.maxHeight,
	  								maxWidth: options.maxWidth,
	  								minHeight: _minHeight,
	  								minWidth: _minWidth,
	  								modal: _modal,
	  								open: function(){ $(this).css('width','95%'); },
	  								position: options.position,
	  								stack: true,
									title: _title,
									width: _width
								};
	  							var w = $('<iframe src="' + url + '">').dialog(opt);
	  							winContext = {
	  								type: 'jq',
	  								window: w
	  							};
	  						}
	  					}

						var winContextArray = __mapPathToWindows.get(context.path);
						if(!winContextArray)
							winContextArray = [];
						winContextArray.push(winContext);
						__mapPathToWindows.set(context.path, winContextArray);
	  				}
				});
			}
		};

		return jq;
	}(bolt.JQ || {}));

	return bolt;
}(Bolt || {}, jQuery));