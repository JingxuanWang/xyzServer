// system that manipulate canvas
var system;

// configuration
var CONFIG;

var DAMAGE = 50;

// game status
// avoid unit action at the same time
var STAT = 0;


var INFOBOX = null;

// 100 _onClick get through
// 200 show available grids for move
// 201 onMoveStart: is moving
// 300 show available grids for attack
// 301 onAttackStart: is attacking

var GameMain = arc.Class.create(arc.Game, {
	initialize: function(params) {

		this.map = new Map();
		this.addChild(this.map);
		this.bc = new BattleController();
		this.addChild(this.bc);
	},

	update: function() {
		//console.log(system.getFps());
		if ((STAT == 400 || STAT == 500) && INFOBOX != null) {
			INFOBOX.update();
		}
	},
});

window.addEventListener('DOMContentLoaded', function(e){
	var ajax = new arc.Ajax();
	ajax.addEventListener(arc.Event.COMPLETE, function() {
		CONFIG = ajax.getResponseJSON();
		system = new arc.System(
			CONFIG.const.system.width, 
			CONFIG.const.system.height, 
			'canvas'
		);
		system.setGameClass(GameMain);
		system.addEventListener(arc.Event.PROGRESS, function(e){});
		system.addEventListener(arc.Event.COMPLETE, function(e){});
		system.load(CONFIG.image);
	});
	ajax.load('js/data.json');
}, false);

var Grid = arc.Class.create(arc.display.DisplayObjectContainer, {
	_i: 0,
	_j: 0,
	_name: "Grid",

	initialize: function(i, j) {
		this._i = i;
		this._j = j;
		this.setX(i * CONFIG.const.SIZE);
		this.setY(j * CONFIG.const.SIZE);
	},
	set: function(i, j) {
		this._i = i;
		this._j = j;
	},
	get: function() {
		return [this._i, this._j];
	}
});

// UI
var Button = arc.Class.create(arc.display.DisplayObjectContainer, {
	_name: "Button",
	_bc: null,
	initialize: function(x, y, bc, sprite) {
		this.setX(x);
		this.setY(y);
		this._bc = bc;
		this.addChild(sprite);
		this._bc.addChild(this);
	},
});

var Matrix = arc.Class.create({
	_x: 0,
	_y: 0,
	_bc: null,
	_name: "Matrix",
	_array: [],

	initialize: function(bc, x, y, terrain) {
		this._bc = bc;
		this._x = x;
		this._y = y;
		this._array = terrain;
	},
	getIndex: function(x, y) {
		return y * this._y + x;
	},
	getXY: function(index) {
		var y = parseInt(index / this._y);
		var x = index - y * this._y;
		return [x, y];
	},
	isValidGrid: function(x, y) {
		if (x < 0 || x >= this._x || y < 0 || y >= this._y) {
			return false;
		}
		if (!this.getGridTerrain(x, y)) {
			// judge terrain
			return false;
		}
		if (!this._bc.canPass(
			x * CONFIG.const.SIZE, 
			y * CONFIG.const.SIZE
		)) {
			// judge other unit
			return false;
		}
		return true;
	},
	// 读入的矩阵是xy颠倒的，因此在这里反过来
	getGridTerrain: function(y, x) {
		if (this._array[x][y] >= 0) {
			return true;
		} else {
			return false;
		}
	},
	setX: function(x) {
		this._x = x;
	},
	setY: function(y) {
		this._y = y;
	},
	getX: function() {
		return this._x;
	},
	getY: function() {
		return this._y;
	},
	load: function(matrix) {
		//this._array = matrix;
	},
	getNeighbor_4: function(x, y) {
		var arr = [];
		if (isValidGrid(x - 1, y)) {
			arr.push(new Grid(x - 1, y));
		}
		if (isValidGrid(x + 1, y)) {
			arr.push(new Grid(x + 1, y));
		}
		if (isValidGrid(x, y - 1)) {
			arr.push(new Grid(x, y - 1));
		}
		if (isValidGrid(x, y + 1)) {
			arr.push(new Grid(x, y + 1));
		}
		return arr;
	},
	getNeighbor_8: function(x, y) {
		var arr = [];
		if (isValidGrid(x - 1, y -1)) {
			arr.push(new Grid(x - 1, y - 1));
		}
		if (isValidGrid(x + 1, y + 1)) {
			arr.push(new Grid(x + 1, y + 1));
		}
		if (isValidGrid(x - 1, y + 1)) {
			arr.push(new Grid(x - 1, y + 1));
		}
		if (isValidGrid(x + 1, y - 1)) {
			arr.push(new Grid(x + 1, y - 1));
		}
		return arr;
	},
	getAvailGrids: function(x, y, mov) {
		var grid = new Grid(x, y);
		grid.mov = mov;
		grid.stack = [];

		var queue = [];
		queue.push(grid);
	
		var visited = [];
		visited[grid._j * this.getX() + grid._i] = 1;
		var movableGrids = [];
		movableGrids.push(grid);

		while(queue.length > 0) {
			var t = queue.shift();

			if (t.mov > 0) {
				var gr = [];
				gr[0] = new Grid(t._i, t._j + 1);
				gr[1] = new Grid(t._i + 1, t._j);
				gr[2] = new Grid(t._i, t._j - 1);
				gr[3] = new Grid(t._i - 1, t._j);

				for (var a = 0; a <= 3; ++a) {
					var tg = gr[a];
					if (this.isValidGrid(tg._i, tg._j) 
					&& !visited[tg._j * this.getX() + tg._i]) {
						tg.mov = t.mov - 1;
						visited[tg._j * this.getX() + tg._i] = 1;
						tg.stack = [];
						//tg.stack.concat(t.stack);
						//tg.stack.push(t.stack.slice(0, t.stack.length));
						for (var b = 0; b < t.stack.length; ++b) {
							var tmp = new Grid(t.stack[b]._i, t.stack[b]._j);
							tmp.d = t.stack[b].d;
							tmp.l = t.stack[b].l;
							tg.stack.push(tmp);
						}
						
						var len = tg.stack.length;
						if (len > 0 && tg.stack[len - 1].d == a) {
							++tg.stack[len - 1].l;
						} else {
							var tmp = new Grid(t._i, t._j);
							tmp.d = a;
							tmp.l = 1;
							tg.stack.push(tmp);
						}
					
						/*
						var tmp = new Grid(t._i, t._j);
						tmp.d = a;
						tmp.l = 1;
						tg.stack.push(tmp);
						*/
						//console.log("Grid: "+tg._i+" : "+tg._j+" : "+t.d+" : "+t.l+" | "+t._i+" : "+t._j);
						//console.log(t.stack);
						//console.log(tg.stack);
						queue.push(tg);
						movableGrids.push(tg);
					}
				}
			}	
		}
		return movableGrids;
	},
	getAtkRngGrids: function(x, y, type) {
		var gr = [];
		var ar = [];
		if (type == 1) {
			gr[0] = new Grid(x, y + 1);
			gr[1] = new Grid(x + 1, y);
			gr[2] = new Grid(x, y - 1);
			gr[3] = new Grid(x - 1, y);
		} else if (type == 2){
			gr[0] = new Grid(x, y + 1);
			gr[1] = new Grid(x + 1, y);
			gr[2] = new Grid(x, y - 1);
			gr[3] = new Grid(x - 1, y);
			gr[4] = new Grid(x + 1, y + 1);
			gr[5] = new Grid(x + 1, y - 1);
			gr[6] = new Grid(x - 1, y - 1);
			gr[7] = new Grid(x - 1, y + 1);
		} else if (type == 3) {
			gr[0] = new Grid(x, y + 1);
			gr[1] = new Grid(x + 1, y);
			gr[2] = new Grid(x, y - 1);
			gr[3] = new Grid(x - 1, y);
			gr[4] = new Grid(x + 1, y + 1);
			gr[5] = new Grid(x + 1, y - 1);
			gr[6] = new Grid(x - 1, y - 1);
			gr[7] = new Grid(x - 1, y + 1);
			gr[8] = new Grid(x, y + 2);
			gr[9] = new Grid(x + 2, y);
			gr[10] = new Grid(x, y - 2);
			gr[11] = new Grid(x - 2, y);
		}
		while(gr.length > 0) {
			var tmp = gr.shift();
			//if (this.isValidGrid(tmp._i, tmp._j)) {
				ar.push(tmp);
			//}
		}
		return ar;
	}
});

var EventUnit = arc.Class.create({
	_name: "EventUnit",
	func: null,
	params: null,
	priority: 0,
	timestamp: 0,

	initialize: function(func, params, priority) {
		this.func = func;
		this.params = params;
		this.priority = priority;
		this.timestamp = new Date().getTime();
	}
});

var BattleController = arc.Class.create(arc.display.DisplayObjectContainer, {
	_name: "BattleController",
	_units: [],
	_player_units: [],
	_allies_units: [],
	_enemy_units: [],
	_buttons: [],
	_matrix: null,
	_mission: null,
	_round: 1,
	actor: null,
	avail_grids: [],
	attack_range: [],
	event_queue: [],

	initialize: function() {
		// load map
		this._matrix = new Matrix(this, CONFIG.map.width, CONFIG.map.height, CONFIG.map.terrain);

		this._unit_layer = new arc.display.DisplayObjectContainer();
		this._ui_layer = new arc.display.DisplayObjectContainer();
		this._effect_layer = new arc.display.DisplayObjectContainer();
		this.addChild(this._effect_layer);
		this.addChild(this._unit_layer);
		this.addChild(this._ui_layer);

		// init player unit
		for (var i = 0; i < CONFIG.map.player_unit.length; ++i) {
			var unit_conf = CONFIG.map.player_unit[i];
			// assign units
			var unit = new Unit(this, unit_conf, 0);
			//this.addChild(unit);
			this._unit_layer.addChild(unit);
			this._units.push(unit);
			this._player_units.push(unit);
		}

		// init allies unit
		for (var i = 0; i < CONFIG.map.allies_unit.length; ++i) {
			var unit_conf = CONFIG.map.allies_unit[i];
			// assign units
			var unit = new Unit(this, unit_conf, 1);
			//this.addChild(unit);
			this._unit_layer.addChild(unit);
			this._units.push(unit);
			this._allies_units.push(unit);
		}

		// init enemy unit
		for (var i = 0; i < CONFIG.map.enemy_unit.length; ++i) {
			var unit_conf = CONFIG.map.enemy_unit[i];
			// assign units
			var unit = new Unit(this, unit_conf, 2);
			//this.addChild(unit);
			this._unit_layer.addChild(unit);
			this._units.push(unit);
			this._enemy_units.push(unit);
		}

		this._mission = CONFIG.map.mission;
	},
	restore: function() {
	},

	scroll: function() {
	},

	// Event Queue Control Logic
	// get event from queue
	getEvent: function(priority) {
		return this.event_queue.shift();
	},
	// regist a event on tail of the queue
	pushEvent: function(func, params, priority) {
		console.log("PushEvent: " + func + " : " + params + " : " + priority );
		//this.event_queue.push(e);

		priority = priority > 0 ? priority : 0;
		var ev = new EventUnit(func, params, priority);

		// push event with priority and timestamp
		var i = 0;
		for (i = 0; i < this.event_queue.length; ++i) {
			var e = this.event_queue[i];
			if (e == null) {
				break;
			} 
			// find first one that should be in the latter half
			else if (e.priority == ev.priority && e.timestamp > ev.timestamp) {
				break;
			}
			else if (e.priority > ev.priority) {
				break;
			}
		}
		this.event_queue.splice(i, 0, ev);
		console.log(this.event_queue);
	},
	// play a event
	startEvent: function(e) {
		if (e.func != null) {
			e.func(e.params);
		}
	},
	nextEvent: function(priority) {
		var e = this.getEvent();
		if (e != null) {
			this.startEvent(e);
		} else {
			// action end
			//if (STAT < 502) {
			//	this.checkDead();
			//} else {
				// not more dead animation
				STAT = 0;
				if(this.checkTurnEnd(this.actor)) {
					this.sideChange(this.actor);
				}
			//}
		}
	},
	getEffectedArea: function(x, y, type) {
		return [{x : x, y : y}];
	},
	getEffectedUnits: function(x, y, type) {
		var ea = this.getEffectedArea(x, y, type);
		var effectList = [];
		for (var i = 0; i < ea.length; ++i) {
			var u = this.getUnit(ea[i].x, ea[i].y);
			if (u != null) {
				effectList.push(u);
			}
		}
		return effectList;
	},
	getUnit: function(x, y) {
		for (var i = 0; i < this._units.length; ++i) {
			if (this._units[i].getX() == x 
			&&  this._units[i].getY() == y) {
				return this._units[i];
			}
		}
		return null;
	},
	canPass: function(x, y) {
		var u = this.getUnit(x, y);
		if (u == null 
		|| this.actor == null
		) {
			return true;
		}
		if (this.actor._side == u._side) {
			return true;
		} else {
			return false;
		}
	},
	showAvailGrids: function(unit) {
		//unit = this.actor;
		// get avail grids
		this.avail_grids = [];
		this.attack_range = [];
		var avail_grids = this._matrix.getAvailGrids(
			parseInt(unit.getX() / CONFIG.const.SIZE), 
			parseInt(unit.getY() / CONFIG.const.SIZE),
			unit.get("mov")
		);
		var attack_range = this._matrix.getAtkRngGrids(
			parseInt(unit.getX() / CONFIG.const.SIZE), 
			parseInt(unit.getY() / CONFIG.const.SIZE),
			unit.get("rng")
		);

		// add shader click listener
		for (var i = 0; i < avail_grids.length; ++i) {
			var shader = new arc.display.Sprite(
				system.getImage(CONFIG.UI.mov_base)
			);
			var grid = avail_grids[i];
			grid.addChild(shader);
			grid.addEventListener(
				arc.Event.TOUCH_END, 
				arc.util.bind(unit._onMoveStart, unit)
			);
			this._effect_layer.addChild(grid);
			this.avail_grids.push(grid);
		}

		for (var i = 0; i < attack_range.length; ++i) {
			var mark = new arc.display.Sprite(
				system.getImage(CONFIG.UI.ar)
			);
			var grid = attack_range[i];
			for (var j = 0; j < avail_grids.length; ++j) {
				var g = avail_grids[j];
				if (g.getX() == grid.getX() && g.getY() == grid.getY()) {
					grid.stack = g.stack; 
					break;
				}
			}

			grid.addEventListener(
				arc.Event.TOUCH_END, 
				arc.util.bind(unit._onMoveStart, unit)
			);

			grid.addChild(mark);
			this._effect_layer.addChild(grid);
			this.attack_range.push(grid);
		}

	},
	showAttackRange: function(unit) {
		// get avail grids
		this.avail_grids = [];

		// TODO: this will be changed
		var avail_grids = this._matrix.getAtkRngGrids(
			parseInt(unit.getX() / CONFIG.const.SIZE), 
			parseInt(unit.getY() / CONFIG.const.SIZE),
			unit.get("rng")
		);

		// add shader click listener
		for (var i = 0; i < avail_grids.length; ++i) {
			var shader = new arc.display.Sprite(
				system.getImage(CONFIG.UI.mov_base)
			);
			var grid = avail_grids[i];
			grid.addChild(shader);
			
			var enemy = this.getUnit(grid.getX(), grid.getY());
			if (enemy == null) {
				grid.addEventListener(
					arc.Event.TOUCH_END, 
					arc.util.bind(unit._onAttackStart, unit)
				);
			} else {
				enemy.addEventListener(
					arc.Event.TOUCH_END, 
					arc.util.bind(unit._onAttackStart, unit)
				);
			}
			this._effect_layer.addChild(grid);
			//this.setChildIndex(grid, 1);
			this.avail_grids.push(grid);
		}

	},

	clearAvailGrids: function() {
		//for (var i = 0; i < this.avail_grids.length; ++i) {
		//	this.removeChild(this.avail_grids[i]);
		//}
		this._effect_layer._removeAllChild();
		this.avail_grids = [];
		//for (var i = 0; i < this.attack_range.length; ++i) {
		//	this.removeChild(this.attack_range[i]);
		//}
		this.attack_range = [];
	},
	showMenu: function(unit) {
		// show attack button
		var button_atk = new Button(
			unit.getX() - 30, 
			unit.getY(),
			this._ui_layer,
			new arc.display.Sprite(system.getImage(CONFIG.UI.img_menu_atk))
		);
		button_atk.addEventListener(
			arc.Event.TOUCH_END, 
			arc.util.bind(unit.prepareAttack, unit)
		);
		this._buttons.push(button_atk);

		// show move button
		var button_mov = new Button(
			unit.getX() + 50, 
			unit.getY(),
			this._ui_layer,
			new arc.display.Sprite(system.getImage(CONFIG.UI.img_menu_mov))
		);
		button_mov.addEventListener(
			arc.Event.TOUCH_END, 
			//arc.util.bind(unit.prepareMove, unit)
			arc.util.bind(unit.finish, unit)
		);
		this._buttons.push(button_mov);
	},
	clearMenu: function() {
		this._ui_layer._removeAllChild();
		this._buttons = [];
	},
	showInfoBox: function(unit, type) {
		this.removeInfoBox();	
		this.infobox = new InfoBox(unit, this, type);
		this._ui_layer.addChild(this.infobox, 100);
	},
	showInfoBoxHurt: function(unit) {
		this.showInfoBox(unit, 1);
		this.infobox.anim_hurt();
	},
	showInfoBoxExpUp: function(unit) {
		this.showInfoBox(unit, 1);
		this.infobox.anim_exp();
	},
	removeInfoBox: function() {
		if (this.infobox == null) {
			return;
		}
		this._ui_layer.removeChild(this.infobox);
		this.infobox = null;
		this.nextEvent();
	},
	checkActionEnd: function() {
		if(this.actor && this.actor.isFinished()) {
			return true;
		} else {
			return false;
		}
	},
	checkTurnEnd: function(unit) {
		if (!unit) {
			return false;
		}
		if (unit._side == 0) {
			for (var i = 0; i < this._player_units.length; ++i) {
				if (!this._player_units[i].isFinished()) {
					return false;
				}
			}	
		} else if (unit._side == 1) {
			for (var i = 0; i < this._allies_units.length; ++i) {
				if (!this._allies_units[i].isFinished()) {
					return false;
				}
			}	
		} else if (unit._side == 2) {
			for (var i = 0; i < this._enemy_units.length; ++i) {
				if (!this._enemy_units[i].isFinished()) {
					return false;
				}
			}	
		}
		return true;
	},
	sideChange: function(unit) {
		this._phrase = (unit._side + 1) % 3;
		//for (var i = 0; i < this._units.length; ++i) {
		//	if (this._units[i].get("cur_hp") > 0) {
		//		this._units[i].stand();
		//	}
		//}
		if (this._phrase == 0) {
			this.nextRound();
		}
	},
	nextRound: function() {
		++this._round;
		this.checkGameOver();
		
		// play round animation
		console.log("Round " + this._round + " start !!" );

		for (var i = 0; i < this._player_units.length; ++i) {
			this._player_units[i].roundInit();
		}
		for (var i = 0; i < this._allies_units.length; ++i) {
			this._allies_units[i].roundInit();
		}
		for (var i = 0; i < this._enemy_units.length; ++i) {
			this._enemy_units[i].roundInit();
		}
		STAT = 0;
	},
	checkGameOver: function() {
		// check round
		if (this._round > this._mission.max_round) {
			return true;
		}
		
		for (var i = 0; i < this._player_units.length; ++i) {
			var unit = this._player_units[i];
			// check hero exists
			if (unit.isHero() && !unit.isAlive()) {
				return true;			
			}
			
			// check key person exists
			if (this.isKeyChara(unit) && !unit.isAlive()) {
				return true;			
			}
		}
		return false;
	},
	isKeyChara: function(unit) {
		if (this._mission.key_chara[unit.get("chara_id")] == 1) {
			return true;
		} else {
			return false;
		}
	},
	checkMissionSuccess: function() {
		// TODO: 实现任务信息的可配置后，在这里判断是否胜利	
	},
	checkDead: function() {
		// callback for dead animation
		if (!this.tgt_units) {
			return;
		}
		
		for (var i = 0; i < this.tgt_units.length; ++i) {
			var unit = this.tgt_units[i];
			if (unit.get("cur_hp") <= 0 && unit.isAlive()) {
				STAT = 502;
				console.log("before checkDead");
				this.pushEvent(arc.util.bind(unit.die, unit), null, 100);
			}
		}
		// if we have event pushed in to the queue
		if (STAT == 502) {
			this.nextEvent();
		}
	}
});

var Map = arc.Class.create(arc.display.DisplayObjectContainer, {
	_name: "Map",
	_stat: 0,
	_scroll: 0,
	_phrase: 0,
	_turn: 1,

	initialize: function() {

		var map = new arc.display.Sprite(system.getImage(CONFIG.map.image));
		this.addChild(map);
		
		// draw map statically
		//var ctx = document.getElementById("map").getContext('2d');
		//var _map = new Image();
		//_map.src = CONFIG.map.image;
		//ctx.drawImage(_map, 0, 0);
		
		//this._debug();
	
		// regist event listener
		this.addEventListener(
			arc.Event.TOUCH_START, 
			arc.util.bind(this._onTouchStart, this)
		);
		this.addEventListener(
			arc.Event.TOUCH_MOVE, 
			arc.util.bind(this._onTouchMove, this)
		);
		this.addEventListener(
			arc.Event.TOUCH_END, 
			arc.util.bind(this._onTouchEnd, this)
		);

		// battle start
	},
	_debug: function() {
		for (var i = 0; i < CONFIG.map.width; ++i) {
			for (var j = 0; j < CONFIG.map.height; ++j) {
				var shader = new arc.display.Sprite(
					system.getImage(CONFIG.UI.mov_base)
				);
				shader.setX(i * CONFIG.const.SIZE);
				shader.setY(j * CONFIG.const.SIZE);
				if ((i + j) % 2) {
					this.addChild(shader);
				}
			}
		}
	},
	_onTouchStart: function(e) {
	},
	_onTouchMove: function(e) {
	},
	_onTouchEnd: function(e) {
	}
});

var Attr = arc.Class.create({
	_name: "Attr",
	name: null,
	chara_id : 0,
	lv: 0,
	school: null,
	hp: 0,
	mp: 0,
	atk: 0,
	def: 0,
	intl: 0,
	dex: 0,
	mor: 0,
	mov: 0,
	rng: 0,
	
	initialize: function(attr) {
		this.chara_id = attr.chara_id;
		this.name = attr.name;
		this.lv = attr.lv;
		this.school = attr.school;
		this.hp = attr.hp;
		this.mp = attr.mp;
		this.atk = attr.atk;
		this.def = attr.def;
		this.intl = attr.intl;
		this.dex = attr.dex;
		this.mor = attr.mor;
		this.mov = attr.mov;
		this.rng = attr.rng;
		this.exp = attr.exp ? attr.exp : 0;
		this.cur_hp = attr.cur_hp ? attr.cur_hp : this.hp;
		this.cur_mp = attr.cur_mp ? attr.cur_mp : this.mp;
		this.cur_exp = attr.cur_exp;
	},
	compare: function(attr) {
		for (var prop in this) {
			if (this[prop] != attr.prop) {
				return false;
			}
		}
		return true;
	}
});

var Unit = arc.Class.create(arc.display.DisplayObjectContainer, {
	_name: "Unit",
	_stat: 0,
	_d: 0,
	_bc: null,
	_attr: null,

	initialize: function(bc, unit_conf, side) {
		var attr = unit_conf.attr;
		var position = unit_conf.position;
		var resource = unit_conf.resource;
		
		this._side = side;

		// for future use
		this._attr = new Attr(attr);
		this._moveStack = [];

		this._bc = bc;
		this._d = position.d;
		this.setX(position.i * CONFIG.const.SIZE);
		this.setY(position.j * CONFIG.const.SIZE);
		// laod resoruce according unit type
		this.anim_mov = new arc.display.MovieClip(4, true, true); 
		this.anim_ready = new arc.display.MovieClip(2, true, true);
		this.anim_attack = new arc.display.MovieClip(10, false, false);
		this.anim_hurt = new arc.display.MovieClip(2, false, false);
		this.anim_defence = new arc.display.MovieClip(1, false, false);
		this.anim_levelup = new arc.display.MovieClip(8, false, false);
		this.anim_attrup = new arc.display.MovieClip(10, false, false);
		this.anim_die = new arc.display.MovieClip(8, false, false);

		this._ready = [];
		this._stand = [];
		this._move = [];
		this._attack = [];
		this._pattack = [];
		this._weak = new arc.display.SheetMovieClip(
			system.getImage(
				resource.img_mov, 
				[0, 192, 96, 48]
			),
			48, 2
		);
		this._hurt = new arc.display.SheetMovieClip(
			system.getImage(
				resource.img_spc, 
				[0, 96, 48, 48]
			),
			48, 2
		);
		this._turn_round = new arc.display.SheetMovieClip(
			system.getImage(
				resource.img_spc, 
				[0, 0, 192, 48]
			),
			48, 8, true
		);
		this._powerup = new arc.display.Sprite(
			system.getImage(
				resource.img_spc,
				[48, 96, 48, 48]
			)
		);
		for (var i = 0; i <= 3; ++i) {
			this._move[i] = new arc.display.SheetMovieClip(
				system.getImage(
					resource.img_mov, 
					[0, i * 48, 96, 48]
				), 
				48, 4
			);
			this._ready[i] = new arc.display.SheetMovieClip(
				system.getImage(
					resource.img_mov, 
					[0, i * 48, 96, 48]
				), 
				48, 2, true
			);
			this._attack[i] = new arc.display.SheetMovieClip(
				system.getImage(
					resource.img_atk, 
					[0, i * 64, 256, 64]
				), 
				64, 10
			);
			this._pattack[i] = new arc.display.SheetMovieClip(
				system.getImage(
					resource.img_atk, 
					[0, i * 64, 64, 64]
				), 
				64, 10, false, true
			);
			this._stand[i] = new arc.display.Sprite(
				system.getImage(
					resource.img_spc,
					[i * 48, 0, 48, 48]
				)
			);
		}
		//this._attack[this._d].addEventListener(
		this.anim_attack.addEventListener(
			arc.Event.COMPLETE,
			arc.util.bind(this._onAttackComplete, this)
		);
		this.anim_die.addEventListener(
			arc.Event.COMPLETE,
			arc.util.bind(this._onDead, this)
		);
		this.anim_levelup.addEventListener(
			arc.Event.COMPLETE,
			arc.util.bind(this._onLevelUpComplete, this)
		);

		this.roundInit();

		this.addChild(this._ready[this._d]);
		this._ready[this._d].play();
		this.addEventListener(
			arc.Event.TOUCH_END, 
			arc.util.bind(this._onClick, this)
		);
		this.addEventListener(
			arc.Event.TOUCH_MOVE,
			arc.util.bind(this._onDrag, this)
		);
	},
	//////////
	isHero: function() {
		if (this._side == 1) {
			return true;
		} else {
			return false;
		}
	},
	isAlive: function() {
		return this._flag == "dead" ? false : true;
	},
	isFinished: function() {
		if (!this.isAlive() || this._flag == "finished") {
			return true;
		} else {
			return false;
		}
	},
	roundInit: function() {
		// a certain rate of status change

		if (this.isAlive()) {
			this._flag = "ready";
		}
		this.ready();
	},
	/////////////

	_onDrag: function(e) {
		if (STAT == 0) {
			this._bc.showInfoBox(this);
			STAT = 101;
		}
	},

	// while unit is clicked 
	// show menu
	_onClick: function(e) {
		console.log("_onClick: " +STAT);
		if (STAT > 300) {
			return;
		} else if (STAT == 300 && this._bc.actor == this) {
			this._bc.clearAvailGrids();
			this.restore();
			return;
		} else if (STAT == 200 && this._bc.actor == this) {
			this._bc.clearAvailGrids();
			this._bc.showMenu(this);
			//this.restore();
			return;
		} else if (STAT == 200 && this._bc.actor != this) {
			alert ("那里有其他单位不能移动");
			return;
		} else if (STAT > 101) {
			return;
		} else if (STAT == 101) {
			this.restore();
			return;
		} else if (STAT == 100 && this._bc.actor == this) {
			this._bc.clearMenu();
			this._bc.showInfoBox(this);
			STAT = 101;
			return;
		} else if (STAT == 0 && !this.isFinished()) {
			STAT = 100;
			this._bc.actor = this;
			this.prepareMove();
		} else {	
			// Exceptions
			this.restore();
		}
	},

	// ------------------
	// move functions
	// ------------------

	// prepare to move
	// this is the entrance of UNIT MOVE
	prepareMove: function() {
		if (STAT != 100) {
			return;
		}
		this._bc.clearMenu();
		this._bc.showAvailGrids(this);
		STAT = 200;
	},

	_onMoveStart: function(e) {
		console.log("onMoveStart !! " + STAT);
		if (STAT != 200) {
			return;
		}
		this._bc.clearAvailGrids();
		
		// here we should remember original location
		// for cancel operation
		this._orig_x = this.getX();
		this._orig_y = this.getY();

		STAT = 201;
		var t = e.target;
		var stack = t.stack;

		//console.log(stack);

		var grid = this._bc.getUnit(t.getX(), t.getY());
		if (grid != null) {
			alert("There is another unit!");
			STAT = 200;
			return;
		}

		this._moveStack = stack;
		this.nextMove();
	},
	nextMove: function() {
		//console.log("nextMove called");
		if (this._moveStack.length > 0) {
			var next_move = this._moveStack.shift();
			//console.log(next_move);
			this.move(next_move.d, next_move.l);
		} else {
			// TODO: 
			// should let unit stand still
			// instead of play moving animation
			this.ready();
			this._bc.showMenu(this);
		}
	},
	move: function(direction, length) {
		//console.log("move ("+direction+","+length+")");
		this._removeAllChild();
		//this.anim_mov.addChild(this._move[direction], {1:{}, 2:{}, 3:{}, 4:{}});
		this.anim_mov.addChild(this._move[direction], {1:{}, 2:{}});
		this._d = direction;

		var cx = this.getX();
		var cy = this.getY();
	
		var tx = cx;
		var ty = cy;

		if (direction == 0) {
			ty += length * CONFIG.const.SIZE;
		} else if (direction == 1) {
			tx += length * CONFIG.const.SIZE;
		} else if (direction == 2) {
			ty -= length * CONFIG.const.SIZE;
		} else if (direction == 3) {
			tx -= length * CONFIG.const.SIZE;
		}
			
		this._cur_anim = new arc.anim.Animation(
			this.anim_mov,
			//{x: tx - cx, y: ty - cy},
			{x: tx - cx, y: ty - cy, time: 500 * length}
		);
		
		this.tx = tx;
		this.ty = ty;
		
		this._cur_anim.play();
		this._cur_anim.addEventListener(
			arc.Event.COMPLETE, 
			arc.util.bind(this._onMoveComplete, this) 
		);
		this.addChild(this.anim_mov);
	},
	_onMoveComplete: function() {
		this.setX(this.tx);
		this.setY(this.ty);
		this.anim_mov.setX(0);
		this.anim_mov.setY(0);
		this._cur_anim = null;
		//console.log(this.tx + " : " + this.ty);
		this.nextMove();
	},


	// -------------------------
	// attack functions
	// -------------------------

	// prepare to attack
	// this is the entrance of UNIT ATTACK
	prepareAttack: function() {
		if (STAT >= 300) {
			return;
		}
		this._bc.clearMenu();
		this._bc.showAttackRange(this);
		STAT = 300;
	},
	_onAttackStart: function(e) {
		console.log("_onAttackStart: " + STAT);
		if (STAT != 300) {
			return;
		}

		STAT = 301;
		
		var t = e.target;
		
		// get enemy unit
		var defenders = [];
		this._bc.defenders = [];
		
		this.tgt_units = this._bc.getEffectedUnits(t.getX(), t.getY());

		if (this.tgt_units == null) {
			alert("There is no enemy unit!");
			STAT = 300;
			return;
		}

		this.saveOrigStatus();
		for (var i = 0; i < this.tgt_units.length; ++i) {
			this.tgt_units[i].saveOrigStatus();	
		}

		// double link
		//this.tgt_units.actor = this;
		this._bc.tgt_units = this.tgt_units;

		var d = 0;	
		if (t.getX() > this.getX()) {
			d = 1;
		} 
		else if (t.getX() < this.getX()) {
			d = 3;
		}
		else if (t.getY() < this.getY()) {
			d = 2;
		}
		this._bc.clearAvailGrids();
		this.attack(d);
	},


	attack: function(direction) {
		this._d = direction;

		this.anim_attack._removeAllChild();
		this._removeAllChild();
		this._attack[this._d].gotoAndStop(1);
		this._pattack[this._d].gotoAndStop(1);
		this.anim_attack.addChild(
			this._pattack[this._d],
			{
				1: {visible: true},
				5: {visible: false},
			}
		);
		this.anim_attack.addChild(
			this._attack[this._d],
			{
				5: {},
				6: {},
				7: {},
				8: {},
			}
		);
		this.addChild(this.anim_attack);
		this.anim_attack.setX(-1 * CONFIG.const.MERGIN);
		this.anim_attack.setY(-1 * CONFIG.const.MERGIN);
		this.anim_attack.gotoAndPlay(1);
	},
	_onAttackComplete: function() {
		// for each enemy
		for (var i = 0; i < this._bc.tgt_units.length; ++i) {
			this._bc.tgt_units[i].hurt(this);
		}
	
		// register exp up InfoBox Event
		var self = this;
		console.log("before showInfoBoxExpUp");
		this._bc.pushEvent(
			arc.util.bind(this._bc.showInfoBoxExpUp, this._bc),
			self
		);
	},

	ready: function() {
		this._removeAllChild();
		if (this.isFinished()) {
			this.stand();
			return;
		}

		if (this.get("cur_hp") / this.get("hp") < 0.2) {
			this.anim_ready.addChild(this._weak, {1:{}, 2:{}});
		} else {
			this.anim_ready.addChild(this._ready[this._d], {1:{}, 2:{}});
		}
		this.addChild(this.anim_ready);
	},
	stand: function() {
		this._removeAllChild();
		//if (this.get("cur_hp") / this.get("hp") < 0.2) {
		//	this.anim_ready.addChild(this._weak, {1:{}, 2:{}});
		//	this.addChild(this.anim_ready);
		//} else {
			this.addChild(this._stand[this._d]);
		//}
	},
	finish: function(stat) {
		this._flag = "finished";
		this.initListener();		
		this.stand();
		this._bc.clearMenu();
		this._bc.removeInfoBox();
		this._bc.clearAvailGrids();
		if (typeof(stat) == 'object' || typeof(stat) == 'function') {
			STAT = 0;
		} else {
			STAT = stat ? stat : 0;
		}
		if (this.compare("lv") == true) {
			this._bc.checkDead();
		}
		//if (this._bc.checkActionEnd()) {
		//	this._bc.checkDead();
		//}
		if (this._bc.checkTurnEnd(this)) {
			// should not be checked here
			/*
			setTimeout(
				arc.util.bind(
				function() {
					if(confirm("是否要结束本回合？")) {
						this._bc.sideChange(this);
					}}, this), 1500);
			*/		
		}
	},
	restore: function(stat) {
		this.initListener();		
		if (!this.isFinished()) {
			this.ready();
		} else {
			this.stand();
		}
		this._bc.clearMenu();
		this._bc.removeInfoBox();
		this._bc.clearAvailGrids();
		if (typeof(stat) == 'object' || typeof(stat) == 'function') {
			STAT = 0;
		} else {
			STAT = stat ? stat : 0;
		}
	},
	initListener: function() {
		this.removeEventListener(arc.Event.TOUCH_END);
		this.addEventListener(
			arc.Event.TOUCH_END, 
			arc.util.bind(this._onClick, this)
		);
	},

	// animations without direction
	hurt: function(attacker) {
		this._removeAllChild();
	
		
		this.anim_hurt.addChild(this._hurt, {1: {}, 2: {}});
		this.addChild(this.anim_hurt);
		
		this.anim_hurt.removeEventListener(arc.Event.COMPLETE);
		this.anim_hurt.addEventListener(
			arc.Event.COMPLETE,
			arc.util.bind(attacker.removeAtkAnim, attacker)
		);

		this.anim_hurt.gotoAndPlay(1);

		var dmg = this.calDamage();
		attacker.calExp(this, dmg);
		this.setDamage(dmg);
		
		// change data
		this.set("cur_hp", this.get("cur_hp") - dmg);

		// register InfoBox Event
		var self = this;
		console.log("before showInfoBoxHurt");
		this._bc.pushEvent(
			arc.util.bind(this._bc.showInfoBoxHurt, this._bc),
			self
		);
	},
	levelup: function() {
		this._removeAllChild();
		this.anim_levelup.addChild(
			this._turn_round, 
			{
				1: {visible: true},
				2: {},
				3: {},
				4: {},
				5: {},
				6: {},
				7: {},
				8: {},
				9: {},
				10: {},
				11: {visible: false}
			}
		);
		this._turn_round.gotoAndStop(1);
		this.anim_levelup.addChild(
			this._powerup, 
			{
				1: {visible: false},
				11: {visible: true},
				12: {},
				13: {},
				14: {},
				15: {},
				16: {}
			}
		);
		this.addChild(this.anim_levelup);
		this.anim_levelup.gotoAndPlay(1);
	},
	_onLevelUpComplete: function() {
		console.log(this.get("name")+"等级提升至"+this.get("lv")+"级！");
		this.finish();
		this._bc.checkDead();
	},
	removeAtkAnim: function() {
		console.log("removeAtkAnim");
		// should change to multiple
		this.finish();
		this._bc.nextEvent();
		//this.tgt_units.showDamageInfoBox();
	},
	showDamageInfoBox: function() {
		this.restore();
		
		// InfoBox animation
		this._bc.showInfoBoxHurt(this);
	},
	calDamage: function() {
		var cur_hp = this.get("cur_hp");
		if (cur_hp >= DAMAGE) {
			this._damage = DAMAGE;
			return DAMAGE;
		} else {
			this._damage = cur_hp;
			return cur_hp;
		}
	},
	addExp: function(exp) {
		var tExp = this.get("cur_exp") + exp;
		if (tExp > this.get("exp")) {
			this.set("cur_exp", tExp % this.get("exp"));
			this.set("lv", this.get("lv") + parseInt(tExp / this.get("exp")));
		} else {
			this.set("cur_exp", tExp);
		}
	},
	calExp: function(defender, dmg) {
		if (this._side != 0) {
			return 0;
		}

		var lvDiff = defender.get("lv") - this.get("lv");
		var exp = parseInt(dmg / 1) + lvDiff;
		if (exp < 5) {
			exp = 5;
		}
		this.addExp(exp);
	},
	addExpKill: function(defender) {
		var lvDiff = defender.get("lv") - this.get("lv");
		var exp = 30 + lvDiff;
		if (exp < 10) {
			exp = 10;
		}
		this.addExp(exp);
	},
	setDamage: function(dmg) {
		if (dmg <= 0) {
			return;
		}
		this._dmgTxt = new arc.display.TextField();
		this._dmgTxt.setX(0);
		this._dmgTxt.setY(0);
		this._dmgTxt.setColor(0xffffff);
		this._dmgTxt.setFont("Helvetica", 13, false);
		this._dmgTxt.setText(dmg);
		this.addChild(this._dmgTxt);

	},
	weak: function() {
		this._removeAllChild();
		this.anim_ready.addChild(this._weak, {1:{}, 2:{}});
		this.addChild(this.anim_ready);
	},
	die: function() {
		this._flag = "dead";
		this._removeAllChild();
		this.anim_die.addChild(
			this._weak, 
			{
				1: {visible: true },
				2: {visible: false},
				3: {visible: true},
				4: {visible: false},
				5: {visible: true},
				6: {visible: false},
				7: {visible: true},
				8: {visible: false},
			}
		);
		this.addChild(this.anim_die);
		this.anim_die.gotoAndPlay(1);
	},
	_onDead: function() {
		this._bc._unit_layer.removeChild(this);
		this._bc.checkDead();
	},
	power_up: function() {
	},
	saveOrigStatus: function() {
		delete this._origAttr;
		this._origAttr = new Attr(this._attr);	
	},
	removeOrigStatus: function() {
		delete this._origAttr;
	},
	compare: function(property) {
		if (!this._origAttr) {
			return false;
		}
		return (this._attr[property] == this._origAttr[property]);
	},
	compareAll: function() {
		if (!this._origAttr) {
			return false;
		}
		return this._attr.compare(this._origAttr);
	},
	get: function(property) {
		return this._attr[property];
	},
	get_orig: function(property) {
		return this._origAttr[property];
	},
	set: function(property, value) {
		if (property == null || value == null || this._attr[property] == null) {
			return;
		} else {
			this._attr[property] = value;
		}
	}
});

var InfoBox = arc.Class.create(arc.display.DisplayObjectContainer, {
	_name: "InfoBox",
	_stat: 0,
	_bc: null,
	_unit: null,

	initialize: function(unit, bc, type) {
		this._unit = unit;
		this._bc = bc;
		this._type = type;
		this._style = unit._side;

		this.setBasePoint(unit.getX(), unit.getY());
	
		this.setBase();
		this.setName(unit.get("name"));
		this.setSchool(unit.get("school"));
		if (this._type == 1) {
			this.setLv(unit.get_orig("lv"));
			this.setHp(unit.get_orig('hp'), unit.get_orig('cur_hp'));
			this.setMp(unit.get_orig('mp'), unit.get_orig('cur_mp'));
			if (this._style == 0) {
				this.setExp(unit.get_orig('exp'), unit.get_orig('cur_exp'));
			}
		} else {
			this.setLv(unit.get("lv"));
			this.setHp(unit.get('hp'), unit.get('cur_hp'));
			this.setMp(unit.get('mp'), unit.get('cur_mp'));
		}
		if (this._type == 1 && this._style == 0) {
			this.setEquipExp();
		} else if (!this._type){
			if (this._style == 0) {
				this.setExp(unit.get('exp'), unit.get('cur_exp'));
			}
			this.setTerrain(unit.get('terrain'));
		}
	},
	setBasePoint: function(x, y) {
		if (x >= CONFIG.const.system.width / 2) {
			this.setX(x - 4 * CONFIG.const.SIZE);
		} else {
			this.setX(x + CONFIG.const.SIZE);
		}
		if (y >= CONFIG.const.system.height / 2) {
			if (this._type == 1 && this._style == 0) {
				this.setY(y - 2 * CONFIG.const.SIZE);
			} else {
				this.setY(y - CONFIG.const.SIZE);
			}
		} else {
			this.setY(y);
		}
	},
	setBase: function() {
		this._base = new arc.display.Sprite(
			system.getImage(
				CONFIG.Menu.base,
				[0, 0, 48, 48]
			)
		);
		if (this._type == 1 && this._style == 0) {
			this._base.setScaleX(4);
			this._base.setScaleY(3);
		} else {
			this._base.setScaleX(4);
			this._base.setScaleY(2);
		}
		this.addChild(this._base);
	},
	setName: function(name) {
		if (name == null) {
			return;
		}
		this._nameTxt = new arc.display.TextField();
		this._nameTxt.setX(10);
		this._nameTxt.setY(5);
		//this._nameTxt.setAlign(arc.display.Align.CENTER);
		this._nameTxt.setColor(0xffffff);
		this._nameTxt.setFont("Helvetica", 16, false);
		this._nameTxt.setText(name)
		this.addChild(this._nameTxt);
	},
	setLv: function(lv) {
		if (lv == null) {
			return;
		}
		this._lvTxt = new arc.display.TextField();
		this._lvTxt.setX(60);
		this._lvTxt.setY(5);
		//this._lvTxt.setAlign(arc.display.Align.CENTER);
		this._lvTxt.setColor(0xffffff);
		this._lvTxt.setFont("Helvetica", 16, false);
		this._lvTxt.setText("等级: "+lv)
		this.addChild(this._lvTxt);
	},
	setSchool: function(school) {
		if (school == null) {
			return;
		}
		this._schoolTxt = new arc.display.TextField();
		this._schoolTxt.setX(130);
		this._schoolTxt.setY(5);
		//this._schoolTxt.setAlign(arc.display.Align.CENTER);
		this._schoolTxt.setColor(0xffffff);
		this._schoolTxt.setFont("Helvetica", 16, false);
		this._schoolTxt.setText(school)
		this.addChild(this._schoolTxt);
	},
	setHp: function(hp, cur_hp) {
		if (hp == null || cur_hp == null) {
			return;
		}

		if (cur_hp > hp) {
			cur_hp = hp;
		}

		var bl = 35;
		if (this._type == 1) {
			bl = 40;
		}

		this.hp = hp;
		this.cur_hp = cur_hp;
		this._hp_update_step = parseInt(this.hp * 0.05);

		// set hp image
		var img_hp = new arc.display.Sprite(system.getImage(CONFIG.Menu.icon.hp));
		img_hp.setX(10);
		img_hp.setY(bl - 5);
		this.addChild(img_hp);

		// set hp bar
		this.bar_hp = new arc.display.Sprite(
			system.getImage(
				CONFIG.Menu.bar.hp, 
				[0, 0, 1, 8]
			)
		);
		this.bar_hp.setX(45);
		this.bar_hp.setY(bl + 3);
		var rate = parseInt((this.cur_hp / this.hp) * 130);
		this.bar_hp.setScaleX(rate);
		this.addChild(this.bar_hp);

	
		// set hp number
		this._hpTxt = new arc.display.TextField();
		this._hpTxt.setX(100);
		this._hpTxt.setY(bl);
		this._hpTxt.setColor(0xffffff);
		this._hpTxt.setFont("Helvetica", 15, true);
		this._hpTxt.setText(" /  " + hp);
		this.addChild(this._hpTxt);	

		this._curHpTxt = new arc.display.TextField();
		this._curHpTxt.setX(75);
		this._curHpTxt.setY(bl);
		this._curHpTxt.setColor(0xffffff);
		this._curHpTxt.setFont("Helvetica", 15, true);
		this._curHpTxt.setText(cur_hp);
		this.addChild(this._curHpTxt);	

	},
	setMp: function(mp, cur_mp) {
		if (mp == null || cur_mp == null) {
			return;
		}
		if (cur_mp > mp) {
			cur_mp = mp;
		}

		var bl = 57;
		if (this._type == 1) {
			bl = 64;
		}

		this.mp = mp;
		this.cur_mp = cur_mp;
		this._mp_update_step = parseInt(this.mp * 0.05);

		// set mp image
		var img_mp = new arc.display.Sprite(system.getImage(CONFIG.Menu.icon.mp));
		img_mp.setX(10);
		img_mp.setY(bl - 5);
		this.addChild(img_mp);

		// set mp bar
		this.bar_mp = new arc.display.Sprite(
			system.getImage(
				CONFIG.Menu.bar.mp, 
				[0, 0, 1, 8]
			)
		);
		this.bar_mp.setX(45);
		this.bar_mp.setY(bl + 3);
		var rate = parseInt((this.cur_mp / this.mp) * 130);
		this.bar_mp.setScaleX(rate);
		this.addChild(this.bar_mp);

		this.cur_mp = cur_mp;

		// set mp number
		this._mpTxt = new arc.display.TextField();
		this._mpTxt.setX(100);
		this._mpTxt.setY(bl);
		this._mpTxt.setColor(0xffffff);
		this._mpTxt.setFont("Helvetica", 15, true);
		this._mpTxt.setText(" /  " + mp);
		this.addChild(this._mpTxt);	

		this._curMpTxt = new arc.display.TextField();
		this._curMpTxt.setX(75);
		this._curMpTxt.setY(bl);
		this._curMpTxt.setColor(0xffffff);
		this._curMpTxt.setFont("Helvetica", 15, true);
		this._curMpTxt.setText(cur_mp);
		this.addChild(this._curMpTxt);	

	},
	setExp: function(exp, cur_exp) {
		if (exp == null || cur_exp == null) {
			return;
		}
		console.log("type : " + this._type + " exp :" + exp + " cur_exp : " + cur_exp)
		if (this._type == 1) {
			var bl = 88;
			var img_exp = 
				new arc.display.Sprite(system.getImage(CONFIG.Menu.icon.exp));
			img_exp.setX(10);
			img_exp.setY(bl - 5);
			this.addChild(img_exp);

			this.exp = exp;
			this.cur_exp = cur_exp;

			// set exp bar
			this.bar_exp = new arc.display.Sprite(
				system.getImage(
					CONFIG.Menu.bar.exp, 
					[0, 0, 1, 8]
				)
			);
			this.bar_exp.setX(45);
			this.bar_exp.setY(bl + 3);
			var rate = parseInt((this.cur_exp / this.exp) * 130);
			this.bar_exp.setScaleX(rate);
			this.addChild(this.bar_exp);


			// set exp number
			this._expTxt = new arc.display.TextField();
			this._expTxt.setX(100);
			this._expTxt.setY(bl);
			this._expTxt.setColor(0xffffff);
			this._expTxt.setFont("Helvetica", 15, true);
			this._expTxt.setText(" /  " + exp);
			this.addChild(this._expTxt);	

			this._curExpTxt = new arc.display.TextField();
			this._curExpTxt.setX(75);
			this._curExpTxt.setY(bl);
			this._curExpTxt.setColor(0xffffff);
			this._curExpTxt.setFont("Helvetica", 15, true);
			this._curExpTxt.setText(cur_exp);
			this.addChild(this._curExpTxt);	
		} else {
			this._curExpTxt = new arc.display.TextField();
			this._curExpTxt.setX(10);
			this._curExpTxt.setY(80);
			this._curExpTxt.setColor(0xffffff);
			this._curExpTxt.setFont("Helvetica", 13, false);
			this._curExpTxt.setText("经验值：" + cur_exp);
			this.addChild(this._curExpTxt);	
		}
		this._exp_update_step = 3;
	},
	setTerrain: function(terrain) {
		//if (terrain == null) {
		//	return;
		//}
		this._terrainTxt = new arc.display.TextField();
		this._terrainTxt.setX(120);
		this._terrainTxt.setY(80);
		//this._schoolTxt.setAlign(arc.display.Align.CENTER);
		this._terrainTxt.setColor(0xffffff);
		this._terrainTxt.setFont("Helvetica", 13, false);
		this._terrainTxt.setText(
			/* TODO: implement Terrain related features
			this._bc.getTerrainInfo(
				this._unit.getX(), 
				this._unit.getY()
			)
			*/
			"平地 100%"
		);
		this.addChild(this._terrainTxt);
	},
	setEquipExp: function(atk, def) {
		if (!atk) {
			atk = 0;
		}
		if (!def) {
			def = 0;
		}

		var bl = 120;

		var img_weapon = 
			new arc.display.Sprite(system.getImage(CONFIG.Menu.icon.weapon));
		img_weapon.setX(15);
		img_weapon.setY(bl);
		this.addChild(img_weapon);

		this._atkTxt = new arc.display.TextField();
		this._atkTxt.setX(55);
		this._atkTxt.setY(bl);
		this._atkTxt.setColor(0xffffff);
		this._atkTxt.setFont("Helvetica", 13, false);
		this._atkTxt.setText(atk);
		this.addChild(this._atkTxt);

		var img_armor = 
			new arc.display.Sprite(system.getImage(CONFIG.Menu.icon.armor));
		img_armor.setX(115);
		img_armor.setY(bl);
		this.addChild(img_armor);

	  	this._defTxt = new arc.display.TextField();
		this._defTxt.setX(155);
		this._defTxt.setY(bl);
		this._defTxt.setColor(0xffffff);
		this._defTxt.setFont("Helvetica", 13, false);
		this._defTxt.setText(def);
		this.addChild(this._defTxt);
	},
	anim_hurt: function() {
		STAT = 400;
		INFOBOX = this;
	},
	anim_heal: function() {
	
	},
	anim_exp: function() {
		STAT = 500;
		INFOBOX = this;
		//this._tgtAttr = tgtAttr;
		//this._tgtNum = tgtNum < this.exp ? tgtNum : this.exp;
		//this.expTgt = this._unit.get("cur_exp") - this._exp_update_step;
		this.expTgt = this._unit.get("cur_exp");
		if (this._unit.compare("lv") == 0) {
			this.expTgt = this._unit.get("exp");
			// register levelup
			console.log("before levelUP");
			this._bc.pushEvent(
				arc.util.bind(this._unit.levelup, this._unit)
			);
		}
	},
	setStatus: function() {
	},
	show: function() {
	},
	compareBasic: function() {
//		if (this._type == 1) {
//			if (this.cur_hp  == this._unit.get("cur_hp")
//			&&  this.cur_mp  == this._unit.get("cur_mp")) {
//				return true;
//			} else {
//				return false;
//			}
//		} else if (this._type == 0) {
			if (
			(	this.cur_exp == this._unit.get("cur_exp")
			||  this.cur_exp == this.exp)
			&&  this.cur_hp  == this._unit.get("cur_hp")
			&&  this.cur_mp  == this._unit.get("cur_mp")
			) {
				console.log("compareBasic return true " + this._type);	
				return true;
			}
				console.log("compareBasic return false" + this._type);	
			return false;
//		}
	},
	update: function() {
		// hp differs
		if (STAT == 400 && this.cur_hp != this._unit.get("cur_hp")) {
			if (this.cur_hp < this._unit.get("cur_hp") - this._hp_update_step) {
				this.cur_hp += this._hp_update_step;
			} else if (this.cur_hp > this._unit.get("cur_hp") + this._hp_update_step) {
				this.cur_hp -= this._hp_update_step;
			} else {
				this.cur_hp = this._unit.get("cur_hp");
			}
			var rate = parseInt((this.cur_hp / this.hp) * 130);
			this.bar_hp.setScaleX(rate);
			this._curHpTxt.setText(this.cur_hp);
		} 
		// exp differs
		if(STAT == 500 
		&& this._type == 1 
		&& this._style == 0
		&& this.cur_exp && this.expTgt
		&& this.cur_exp != this.expTgt) {
			// 或者经验值涨到100，或者涨到目标值
			// 动画停止
			if (this.cur_exp < this.expTgt) {
				this.cur_exp += this._exp_update_step;
			} else {
				this.cur_exp = this.expTgt;
			}
			var rate = parseInt((this.cur_exp / this.exp) * 130);
			this.bar_exp.setScaleX(rate);
			this._curExpTxt.setText(this.cur_exp);
		}
		if (this.compareBasic()) {
			if (STAT == 400) {
				STAT = 401;
				this._unit.ready();
			}
			if (STAT == 500) {
				STAT = 501;
			}
			setTimeout(
				arc.util.bind(this._bc.removeInfoBox, this._bc),
				500
			);
		}
	},
});

