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

	bolt.Request = {
		to: function(url, options, callback){
			if (url.indexOf("/") == 0) {
				url = Bolt.Env.getAddress() + url;
			}

			if (url.indexOf("http://") != 0 && url.indexOf("https://") != 0) {
				url = "http://" + url;
			}
			
			var xhttp = __getXmlHttp();
			xhttp.open(options.method || 'GET', url, true);
			if(options.headers) {
				var headers = options.headers;
				for (var header in headers) {
					if (headers.hasOwnProperty(header)) {
						var headerValue = headers[header];
						xhttp.setRequestHeader(header, headerValue);
					}
				}
			}
	      	xhttp.onreadystatechange = function(){
	      		if(xhttp.readyState === 4){//=== XMLHttpRequest.DONE){
	      			if(xhttp.status === 200 || xhttp.status === 0) {
	      				callback(null, xhttp.responseText);
	      			} else {
	      				var error = new Error(xhttp.statusText);
						error.code = xhttp.status;
	      				callback(error);
	      			}
	      		}
	      	}
			xhttp.send(options.body);
		}
	};

	return bolt;
}(Bolt || {}));