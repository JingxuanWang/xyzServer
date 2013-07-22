var Shade = enchant.Class.create(enchant.Sprite, {
	classname: "Shade",
	initialize: function(grid, type, cb_touch_end, cb_touch_move) {
		this.width = CONFIG.get(["map", "tileWidth"]);
		this.height = CONFIG.get(["map", "tileHeight"]);

		enchant.Sprite.call(this, this.width, this. height);

		this.route = grid.route;
		this.i = grid.i;
		this.j = grid.j;

		if (type == "ATK") {
			this.type = "ATK";
			this.image = GAME.assets[CONFIG.get(["UI", "atk_base"])];
		} else if (type == "AR") {
			this.type = "AR";
			this.image = GAME.assets[CONFIG.get(["UI", "ar"])];
		} else if (type == "ROUTE") {
			this.type = "ROUTE";
			this.image = GAME.assets[CONFIG.get(["UI", "route_base"])];
		} else {
			// default is 'mov'
			this.type = "MOV";
			this.image = GAME.assets[CONFIG.get(["UI", "mov_base"])];
		}

		if (cb_touch_end) { 
			this.addEventListener(enchant.Event.TOUCH_END, function() {
				cb_touch_end.call(this, grid);
			});
		}
		if (cb_touch_move) {
			this.addEventListener(enchant.Event.TOUCH_MOVE, function() {
		//		cb_touch_move.call(this, grid);
			});
		}
	},
	i: {
		get: function() {
			return Math.round(this.x / this.width);
		},
		set: function(ti) {
			this.x = ti * this.width;
		}
	},
	j: {
		get: function() {
			return Math.round(this.y / this.height);
		},
		set: function(ty) {
			this.y = ty * this.height;
		}
	},

	_noop: function() {}	
});

// containts button & label & image
var Menu = enchant.Class.create(enchant.Group, {
	classname: "Menu",
	buttons: ["atk", "mov"],
	initialize: function(x, y, unit, cb_list) {
		this.drawBackround();
		for (var i = 0; i < buttons.length; i ++) {
			var type = buttons[i];
			var cb = cb_list[type];
			addButton(x, y, w, h, type, cb);
		}
	},
	drawBackground: function() {
		var bg = new Sprite(this.width, this.height);
		if (image) {
			bg.image = image;
		} else {
			bg.image.context.fillStyle = '#fff';
			bg.image.context.fillRect(0, 0, this.width, this.height);
		}
		this.bg = bg;
		this.addChild(bg);
	},
	addButton: function(type, cb) {
		var button = new Button(x, y, w, h, type, cb);
		this.addChild(button);
	},
	_noop: function() {}	
});


// a button contains a image and a lable
var Button = enchant.Class.create(enchant.Group, {
	classname: "Button",
	initialize: function(x, y, image, text, cb) {
		enchant.Group.call(this, w, h);
		this.addLabel(text);
		this.moveTo(x, y);
		this.width = 40;
		this.height = 40;
		this.drawBackground();

		if (type == "atk") {
			addLabel(type);	
			addImage(GAME.assets[CONFIG.get(["UI", "img_menu_atk"])]);
		} else if (type == "mov") {
			addLabel(type);	
			addImage(GAME.assets[CONFIG.get(["UI", "img_menu_mov"])]);
		} else {
			console.log("invalide type");
		}

		this._pressed = false;
		this.addEventListener(enchant.Event.TOUCH_START, function() {
			this._pressed = true;
			this.y++;
			this.changeStyle();
			callback.call();
		});
		this.addEventListener(enchant.Event.TOUCH_END, function() {
			this._pressed = false;
			this.y--;
			this.changeStyle();
			callback.call();
		});
	},
	drawBackground: function(image) {
		var bg = new Sprite(this.width, this.height);
		if (image) {
			bg.image = image;
		} else {
			bg.image.context.fillStyle = '#fff';
			bg.image.context.fillRect(0, 0, this.width, this.height);
		}
		this.bg = bg;
		this.addChild(bg);
	},
	changeStyle: function() {
		// currently only the background
		if (this._pressed === true) {
			this.bg.image.context.fillStyle = '#fff';
			this.bg.image.context.fillRect(0, 0, this.width, this.height);
		} else {
			this.bg.image.context.fillStyle = '#333';
			this.bg.image.context.fillRect(0, 0, this.width, this.height);
		}
	},
	addImage: function(image) {
		// fixed width/height
		var img = new Sprite(32, 32);
		img.image = image;
		img.moveTo(2, 2);
		this.img = img;
		this.addChild(img);
	},
	addLabel: function(text) {
		var lb = new Label(text);
		lb.moveTo(36, 2);
		this.lb = lb;
		this.addChild(lb); 
	},
	_noop: function() {}	

});

// contains hp/mp bar & label & image
var InfoBox = enchant.Class.create(enchant.Group, {
	classname: "InfoBox",
	initialize: function(unit, type, onAnimComplete) {
		enchant.Group.call(this);
		this.unit = unit;
		this.side = unit.side;
		this.type = type;
		this.width = 192;
		this.height = 96;
		this._in_anim = false;
		this.onAnimComplete = onAnimComplete;

		if (this.side == CONSTS.side.PLAYER && this.type == "ATK") {
			this.height = 144;
		}

		this.setBasePoint(this.unit.x + MAP._offsetX, this.unit.y + MAP._offsetY);
		this.drawBackground(GAME.assets[CONFIG.get(["Menu", "base"])]);

		this.setName();
		this.setLevel();
		this.setSchool();
			this.setHpStat();
			this.setMpStat();
		if (this.side == CONSTS.side.PLAYER && this.type == "ATK") {
			this.setExpStat();
		}
		if (this.type != "ATK") {
			//this.setTerrainStat();
		}
	
		// check animation status
		// and trigger event when status change
		this.addEventListener('enterframe', function() {
			this.updateAnimStatus();
		}); 
	},
	change: function(attr) {
		this.hp_stat.value = attr.hp;
	},
	syncHp: function() {
	},
	drawBackground: function(image) {
		var bg = new Sprite(this.width, this.height);
		if (image) {
			bg.image = image;
		} else {
			bg.image.context.fillStyle = '#fff';
			bg.image.context.fillRect(0, 0, this.width, this.height);
		}
		this.bg = bg;
		this.addChild(bg);
	},
	setBasePoint: function(x, y) {
		if (x  >= CONFIG.get(["system", "width"]) / 2) {
			this.x = x - 4 * CONFIG.get(["map", "tileWidth"]);
		} else {
			this.x = x + CONFIG.get(["map", "tileWidth"]);
		}
		if (y  >= CONFIG.get(["system", "height"]) / 2) {
			if (this.side == CONSTS.side.PLAYER && this.type == "ATK") {
				this.y = y - 2 * CONFIG.get(["map", "tileHeight"]);
			} else {
				this.y = y - CONFIG.get(["map", "tileHeight"]);
			}
		} else {
			this.y = y;
		}
		
		// convert global coordinate to local(scrren) coordinate
		this.x -= MAP._offsetX;
		this.y -= MAP._offsetY;
	},
	setName: function() {
		this.name = new Label(this.unit.attr.current.name);
		this.name.color = '#ffffff';
		this.name.moveTo(10, 5);
		this.addChild(this.name);
	},
	setLevel: function() {
		this.level = new Label("Lv. " + this.unit.attr.current.level);
		this.level.color = '#ffffff';
		this.level.moveTo(60, 5);
		this.addChild(this.level);
	},
	setSchool: function() {
		this.school = new Label(CONSTS.getUnitTypeName(this.unit.attr.current.school));
		this.school.color = '#ffffff';
		this.school.moveTo(130, 5);
		this.addChild(this.school);
	},
	setTerrainStat: function() {
		var terrain_name = MAP.getTerrainName(this.unit.x, this.unit.y);
		var terrain_info = MAP.getTerrainInfo(this.unit.x, this.unit.y);
		this.terrain = new Label(
			terrain_name + " " + terrain_info + "%"	
		);
		this.terrain.color = '#ffffff';
		this.terrain.moveTo(120, 80);
		this.addChild(this.terrain);
	},

	setHpStat: function() {
		var bl = 35;
		// image
		this.hp_img = new Sprite(24, 24);
		this.hp_img.image = GAME.assets[CONFIG.get(["Menu", "icon", "hp"])];
		this.hp_img.moveTo(10, bl - 5);
		this.addChild(this.hp_img);
		// bar & lable
		this.hp_stat = new TextBar(130, 8, 
			this.unit.attr.last.hp, 
			this.unit.attr.master.hp
		);
		this.hp_stat.bar.value = this.unit.attr.current.hp;

		this.hp_stat.bar.image = GAME.assets[CONFIG.get(["Menu", "bar", "hp"])];
		this.hp_stat.moveTo(45, bl - 3);

		this.addChild(this.hp_stat);
	},
	setMpStat: function() {
		var bl = 60;
		// image
		this.mp_img = new Sprite(24, 24);
		this.mp_img.image = GAME.assets[CONFIG.get(["Menu", "icon", "mp"])];
		this.mp_img.moveTo(10, bl - 5);
		this.addChild(this.mp_img);
		// bar & lable
		this.mp_stat = new TextBar(130, 8, 
			this.unit.attr.last.mp, 
			this.unit.attr.master.mp
		);
		this.mp_stat.bar.value = this.unit.attr.current.mp;

		this.mp_stat.bar.image = GAME.assets[CONFIG.get(["Menu", "bar", "mp"])];
		this.mp_stat.moveTo(45, bl - 3);

		this.addChild(this.mp_stat);
	},
	setExpStat: function() {
		var bl = 85;
		// image
		this.exp_img = new Sprite(24, 24);
		this.exp_img.image = GAME.assets[CONFIG.get(["Menu", "icon", "exp"])];
		this.exp_img.moveTo(10, bl - 5);
		this.addChild(this.exp_img);
		// bar & lable
		this.exp_stat = new TextBar(130, 8, 
			this.unit.attr.last.exp, 
			this.unit.attr.master.exp
		);
		// if current.exp < last.exp
		// it means there is a level up
		// so we should redefine actions
		if (this.unit.attr.current.level > this.unit.attr.last.level) {
			// LEVEL UP
			this.exp_stat.bar.value = this.unit.attr.master.exp;
		} else {
			// NO LEVEL UP
			this.exp_stat.bar.value = this.unit.attr.current.exp;
		}

		this.exp_stat.bar.image = GAME.assets[CONFIG.get(["Menu", "bar", "exp"])];
		this.exp_stat.moveTo(45, bl - 3);

		this.addChild(this.exp_stat);
	},
	// check if it is in an animation
	updateAnimStatus: function() {
		if (this._in_anim == true) {
			if (this.checkStatus() == false) {
				this._in_anim = false;
				// to sync unit's attr
				this.unit.attr.backup();
				this.onAnimComplete.call(this);
			}
		} else {
			if (this.checkStatus() == true) {
				this._in_anim = true;
			}
		}
	},
	// check if status is changing
	checkStatus: function() {
		if (this.hp_stat.bar.is_changing()) {
			return true;
		}
		if (this.mp_stat.bar.is_changing()) {
			return true;
		}
		if (this.exp_stat && this.exp_stat.bar.is_changing()) {
			return true;
		}
		return false;
	},
	_noop: function() {}	
});

/*
	// Bar
	var bar = new Bar(20, 100);
	bar.image = game.assets["bar.png"];
	bar.maxvalue = 200;
	bar.value = 0;
	bar.on("enterframe", function() {
		if (this.age % 60 == 0) {
			this.value = Math.random() * 200;
		}	
	}); 
	game.rootScene.addChild(bar);
*/
var TextBar = enchant.Class.create(enchant.Group, {
	initialize: function(w, h, curVal, maxVal) {
		if (curVal == null || maxVal == null) {
			throw new Error('Undefined value ' + curVal + " " + maxVal);
		}
		enchant.Group.call(this);
		this.bar = new Bar(w, h, w, curVal, maxVal);
		this.bar.moveTo(0, 5);

		this.label = new Label(Math.round(curVal) + " / " + Math.round(maxVal));
		this.label.color = '#ffffff';
		this.label.textAlign = 'center';
		this.label.width = w - 40;
		this.label.font = '14pt Helvetica';
		this.label.moveTo(20, -2);
		// move label to the middle of the bar

		this.addChild(this.bar);
		this.addChild(this.label);

		this.addEventListener('enterframe', function() {
			this.label.text = Math.round(this.bar.curvalue) + 
				" / " + Math.round(this.bar.maxvalue);
		});
	}
});

var Bar = enchant.Class.create(enchant.Sprite, {
	initialize: function(w, h, maxwidth, curVal, maxVal) {
		enchant.Sprite.call(this, w, h);
		this.image = new enchant.Surface(w, h);// Null用
		this.image.context.fillColor = 'RGB(0, 0, 256)';
		this.image.context.fillRect(0, 0, w, h);
		this._direction = 'right';
		this._origin = 0;
		this._maxvalue = maxVal;
		this._lastvalue = curVal;
		this.value = curVal;
		this.easing = 10;
		this._maxwidth = maxwidth;

		// initialize
		this.width = this._lastvalue;

		this.addEventListener('enterframe', function() {
			if (this.value < 0) {
				this.value = 0;
			}
			this._lastvalue += (this.value - this._lastvalue) / this.easing;
			if (Math.abs(this._lastvalue - this.value) < 1.3) {
				this._lastvalue = this.value;
			}
			this.width = Math.round((this._lastvalue / this._maxvalue) * this._maxwidth) | 0;
			if (this.width > this._maxwidth) {
				this.width = this._maxwidth;
			}
			if (this._direction === 'left') {
				this._x = this._origin - this.width;
			} else {
				this._x = this._origin;
			}
			this._updateCoordinate();
		});
	},
	is_changing: function() {
		return this.value != this.curvalue;
	},
	direction: {
		get: function() {
			return this._direction;
		},
		set: function(newdirection) {
			if (newdirection !== 'right' && newdirection !== 'left') {
				// ignore
			} else {
				this._direction = newdirection;
			}
		}
	},
	x: {
		get: function() {
			return this._origin;
		},
		set: function(x) {
			this._x = x;
			this._origin = x;
			this._dirty = true;
		}
	},
	maxvalue: {
		get: function() {
			return this._maxvalue;
		},
		set: function(val) {
			this._maxvalue = val;
		}
	},
	// readonly 
	// returns current value
	curvalue: {
		get: function() {
			return this._lastvalue;
		},
		set: function(val) {
			this._lastvalue = val;
		},
	}
});

var LabelScene = enchant.Class.create(enchant.Scene, {
	classname: "LableScene",
	initialize: function(conf) {
		enchant.Scene.call(this);

		this.width = CONFIG.get(["system",  "width"]);
		this.height = CONFIG.get(["system",  "height"]);

		this.lifetime = conf.lifetime ? conf.lifetime : 60; // default 60 frames
		this.labels = conf.labels;
		this.last_change = this.age;
		this.li = 0;	// lable index

		this.bg = new Sprite(this.width, this.height);
		this.bg.image = GAME.assets[CONFIG.get(["Menu", "base"])];

		this.label = new Label(this.labels[this.li].text);
		this.label.color = '#ffffff';
		this.label.textAlign = 'center';
		this.label.width = 300;
		this.label.height = 150;
		this.label.font = '20pt Helvetica';
		this.label.moveTo(
			~~(this.width / 2 - this.label.width / 2), 
			~~(this.height / 2 - this.label.width / 2)
		);

		this.addChild(this.bg);
		this.addChild(this.label);

		var self = this;
		this.addEventListener('enterframe', function(){
			if (self.shouldChangeLabel()) {
				self.nextLabel();
			}
		});
	},
	shouldChangeLabel: function() {
		if (this.age - this.last_change >= this.labels[this.li].lifetime) {
			return true;
		}
		return false;
	},
	nextLabel: function() {
		this.last_change = this.age;
		this.li ++;
		if (this.labels[this.li] !== undefined) {
			this.label.text = this.labels[this.li].text;
		} else {
			this.onDestory();		
		}
	},
	onDestory: function() {
		GAME.removeScene(this);
	},
	_noop: function() {}
});
