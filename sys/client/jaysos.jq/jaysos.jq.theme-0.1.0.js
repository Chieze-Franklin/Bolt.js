var Jaysos = (function(jaysos, $){
	jaysos.UI = (function(ui){
		ui.Window = {
			dialog: function(selector, context, options){
				$(selector, context).dialog();
			}
		};

		return ui;
	}(jaysos.UI || {}));

	return jaysos;
}(Jaysos || {}, jQuery));