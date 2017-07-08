var Bolt = (function(bolt){
	var __address;

	bolt.Env = {
		getAddress: function(){
			return __address;
		},
		setAddress: function(port){
			__address = port;
		}
	};

	return bolt;
}(Bolt || {}));