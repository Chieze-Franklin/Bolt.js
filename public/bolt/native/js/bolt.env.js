var Bolt = (function(bolt){
	var __address;
	var __protocol, __host, __port;

	bolt.Env = {
		getAddress: function(){
			return __address;
		},
		setAddress: function(address){
			__address = address;
		},
		getHost: function(){
			return __host;
		},
		setHost: function(host){
			__host = host;
		},
		getPort: function(){
			return __port;
		},
		setPort: function(port){
			__port = port;
		},
		getProtocol: function(){
			return __protocol;
		},
		setProtocol: function(protocol){
			__protocol = protocol;
		}
	};

	return bolt;
}(Bolt || {}));