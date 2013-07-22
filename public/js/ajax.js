var Ajax = enchant.Class.create(enchant.EventTarget, {
	classname: "Ajax",
	_method: 'GET', 
	_params: null, 
	_url: null,
	_request: null, 
	_jsonResponse: null, 

	initialize: function(){
		enchant.EventTarget.call(this);
		this._request = new XMLHttpRequest();
		this._loadedCallBack = bind(this._loaded, this);
	},
	load: function(url, params){
		this._url = url;
		this._params = params;
		this._request.open(this._method, this._url, true);
		this._request.onreadystatechange = bind(this._loaded, this);
		this._request.addEventListener('readystatechange', this._loadedCallback, false);
		this._request.send(this._params);
	},
	_loaded: function(){
		if(this._request.readyState == 4){
			if(this._request.status == 200 || this._request.status === 0){
				this.dispatchEvent(new enchant.Event(enchant.Event.LOAD));
			} else {
				this.dispatchEvent(new enchant.Event(enchant.Event.ERROR));
				throw new Error("Load Error : " + this._url);
			}
		}
	},
	unload: function(){
		this._request.abort();
		this._jsonResponse = null;
		this._request.removeEventListener('readystatechange', this_loadedCallback, false);
	},
	setMethod: function(method){
		this._method = method;
	},
	getResponseText: function(){
		return this._request.responseText;
	},
	getResponseJSON: function(){
		if(!this._jsonResponse){
			this._jsonResponse = JSON.parse(this._request.responseText);
		}
		return this._jsonResponse;
	},
	getURL: function(){
		return this._url;
	}
});
