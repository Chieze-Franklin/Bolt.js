var Jaysos = (function(jaysos){
	var __protocol = "http";
	var __host = "localhost";
	var __port;

	jaysos.Config = {
		getHost: function(){
			return __host;
		},
		getPort: function(){
			return __port;
		},
		getProtocol: function(){
			return __protocol;
		},
		setHost: function(host){
			__host = host;
		},
		setPort: function(port){
			__port = port;
		},
		setProtocol: function(protocol){
			__protocol = protocol;
		}
	};

	return jaysos;
}(Jaysos || {}));