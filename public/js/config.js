var Config = enchant.Class.create({
	classname: "Config",
	initialize: function(){
	},
	load: function(callback) {
		var self = this;
		var ajax = new Ajax();
		ajax.addEventListener(enchant.Event.LOAD, function() {
			self._all = ajax.getResponseJSON();
			self._text = ajax.getResponseText();
			callback.call();
		});
		ajax.load('../json/xyz.json');
	},
	get: function(arr) {
		var a = this._all;
		for (var i = 0; i < arr.length; i++) {
			if (a.hasOwnProperty(arr[i])) {
				a = a[arr[i]];
			} else {
				return null;
			}
		}
		return a;
	},
	// ajax utilities
	_noop: function() {}
});

