var Bolt = (function(bolt){

	var __getXmlHttp = function(){
		var xhttp;
		if(window.XMLHttpRequest){
			xhttp = new XMLHttpRequest();
		} else{
			xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		return xhttp;
	}

	bolt.ServiceManager = {
		get: function(route, handler){
			var xhttp = __getXmlHttp();
			xhttp.open("GET", Bolt.Config.getProtocol() + "://" + Bolt.Config.getHost() + ":" + Bolt.Config.getPort() + route, true);
			xhttp.send();
	      	xhttp.onreadystatechange = function(){
	      		if(xhttp.readyState === 4){//=== XMLHttpRequest.DONE){
	      			if(xhttp.status === 200 || xhttp.status === 0) {
	      				handler(null, xhttp.responseText);
	      			} else {
	      				var error = new Error(xhttp.statusText);
						error.code = xhttp.status;
	      				handler(error);
	      			}
	      		}
	      	}
		}
	};

	return bolt;
}(Bolt || {}));