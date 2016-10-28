var Bolt = (function(bolt){
	var __protocol = "http";
	var __host = "localhost";
	var __port;

	bolt.Config = {
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

	return bolt;
}(Bolt || {}));