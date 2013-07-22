enchant();

var GAME;
var CONFIG;
var CONSTS;
var BATTLE;
var MAP;
var STAT;
var DEBUG = false;
var MUTE = true;

// make functions called in assigned scope
// which means binding 'this' variable 
// when function is called
function bind(func, scope){
	return function(){
		return func.apply(scope, arguments);
	};
}
// deap copy a object
function clone(obj){
	if(obj == null || typeof(obj) != 'object')
		return obj;

	var temp = {};
	//var temp = obj.constructor(); // changed

	for(var key in obj)
		temp[key] = clone(obj[key]);
	return temp;
}

// sum up some prop in an array of objects
function sumByProp(arr, prop) {
	return arr.map(function(k) {
		return k[prop];
	}).reduce(function(a, b) {
		return a + b;
	});
}

// sum up some prop in an array of objects
function sumByFunc(arr, func) {
	return arr.map(function(k) {
		return func(k);
	}).reduce(function(a, b) {
		return a + b;
	});
}

// sort an object array by it's property
function sortByProp(arr, prop, order) {
	return arr.sort(function(a, b) {
		return order * (a[prop] - b[prop]);
	});
}

//Schwartzian transform
function sortByFunc(arr, func, order) {
	return arr.map(function (x) {
		return [x, func(x)];
	}).sort(function (a, b) {
		return order * (a[1] - b[1]);
	}).map(function (x) {
		return x[0];
	});
}

function lot(arr, func, total_prob) {
	if (totla_prop == null) {
		total_prob = sumByFunc(arr, func);
	}
	var r = rand(1, total_prob); // 1 ~ total_prob
	for (var i = 0; i < arr.length; i++) {
		rand -= func(arr);
		if (rand < 0) {
			return arr[i];
		}	
	}
}

// return random integers in [min, max];
function rand(min, max) {
	return Math.floor((Math.random() * (max - min + 1)) + min);
}

// get url parameter
function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
}

function isSmartPhone () {
	return (navigator.userAgent.indexOf('iPhone') != -1 ||
			navigator.userAgent.indexOf('Android') != -1);
}


var Consts = enchant.Class.create({
	classname: "Consts",
	initialize: function() {
		this.INFINITE = 999999;
		this.direction = {
			DOWN: 0,
			RIGHT: 1,
			UP: 2,
			LEFT: 3,
		};
		this.side = {
			PLAYER: 0,
			ALLIES: 1,
			ENEMY: 2,
			ENEMY_ALLIES: 3,
			NUTRUAL: 4,
		};
		this.unit_status = {
			// common status
			NORMAL: 0,
			MOVED: 1,		// not recommend to use
			ACTIONED: 2,

			// extra
			POISON: 11,

			// special status
			HIDE: 20,
				
			// dead
			DEAD: -1,
		};
		this.battle_status = {
			INIT: 0,
			SCENARIO: 1,
			NORMAL: 100,
			MOVE_RNG: 101,
			MOVE: 102,
			ACTION_SELECT: 103,
			ACTION_RNG: 104,
			ACTION: 105,

			INFO: 200,

			WIN: 900,
			LOSE: 901,
			DRAW: 902
		};
		this.attack_type = {
			NONE: 0,

			RANGE_1: 1,
			RANGE_2: 2,
			RANGE_3: 3,
			RANGE_4: 4,
			RANGE_5: 5,
			
			ARCHER_1: 11,
			ARCHER_2: 12,
			ARCHER_3: 13,

			LANCER_1: 21,
			LANCER_2: 22,
			LANCER_3: 23,

			CATAPULT_1: 31,
			CATAPULT_2: 32,
			CATAPULT_3: 33,

			MAGIC_1: 91,
			MAGIC_2: 92,
			MAGIC_3: 93,
		
			FULL_SCREEN: 99,
		};
		this.terrain = {
			BARRIER: -5,
			MOUNTAIN: -4,
			WALL: -3,
			SHIP: -2,
			FIRE: -1,
			GROUND: 0,
			ROAD: 1,
			GRASSLAND: 2,
			WASTELAND: 3,
			MARSH: 4,
			SNOW: 5,
			HILL: 6,
			RIVER: 7,
			BRIDGE: 8,
			HOUSE: 11,
			VILLAGE: 12,
			CAMP: 13,
			CASTLE: 14,
		};
		this.unit_type = {
			swordman: 1,
			lancer: 2,
			warrior: 3,
			soldier: 4,

			horseman: 11,
			lighthorseman: 12,
			heavyhorseman: 13,

			archer: 21,
			horsearcher: 22,
			crossbowman: 23,

			cartroit: 31,
			lighthcartroit: 32,
			heavyhcartroit: 33,

			wizard: 41,
			
			// debug
			"群雄": 90,
			"轻步兵": 91,
			"县官": 92,
		};
		this.ai = {
			DUMMY: 0,			// do nothing, just skip
			HOLD_POSITION: 1,	// do not move, but attack unit within attack range
			MOVE_POSITION: 2,	// move to position, but not attack
			ATTACK_POSITION: 3,	// move to position, attack if possible
			ATTACK_UNIT: 4,		// pursue a target unit and attack if possible
			KILL_ALL: 5,		// attack all enemy units
			FOLLOW_UNIT: 6,		// follow a friendly unit
			FOLLOW_ATTACK: 7,	// follow a friendly unit, attack if possible
			DEFEND: 8,			// attack if there is enemy, otherwise stand still	
	
			NONE: 999			// player control, not a ai		
		};
	},
	getUnitTypeName: function(t) {
		for (var ut in this.unit_type) {
			if (this.unit_type[ut] == t) {
				return ut;
			}
		}
		return "NO_NAME";
	},
	_noop: function(){}
});
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

var Grid = enchant.Class.create({
	classname: "Grid",
	initialize: function(i, j, d, r, route) {
		this.i = i;
		this.j = j;
		this.d = d;
		this.r = r;
		this.route = [];
		if (route !== undefined) {
			this.route = this.route.concat(route);
		}
	},
	equal: function(that) {
		return this.i == that.i && this.j == that.j;
	},
	isValid: function() {
		if (!MAP.isInMap(this.i, this.j)) {
			return false;
		}
		if (this.r && this.r < 0) {
			return false;
		}
		return true;
	},
	_noop: function() {
	}
});


var xyzMap = enchant.Class.create(enchant.Map, {
	classname: "xyzMap",
	initialize: function(conf) {
		enchant.Map.call(this, conf.tileWidth, conf.tileHeight);

		this.image = GAME.assets[conf.image];

		// for an assigned map
		// use data matrix
		if (conf.data.length > 0) {
			this.loadData(conf.data);
		} 
		// if map not assigned by data matrix
		// then generate a default one
		else {
			var matrix = [];
			for (var i = 0; i < conf.width; i++) {
				matrix[i] = [];
				for (var j = 0; j < conf.height; j++) {
					matrix[i][j] = i * conf.width + j;
				}
			}
			this.loadData(matrix);
		}

		// load terrain_data
		if (conf.terrain_data.length > 0) {
			this.terrain_data = conf.terrain_data;
		}

		// movement matrix
		this._movement_matrix = [];
		for (var t in CONSTS.terrain) {
			if (this.isPassible(CONSTS.terrain[t])) {
				this._movement_matrix[CONSTS.terrain[t]] = [];
				for (var ut in CONSTS.unit_type) {
					// TODO: this should be changed later
					this._movement_matrix[CONSTS.terrain[t]][CONSTS.unit_type[ut]] = 1;
				}
			}
		}
	},
	getCols: function() {
		return this.width * this.tileWidth;
	},
	getRows: function() {
		return this.height * this.tileHeight;
	},

	/*
	 *	global_x = local_x + offset_x
	 *	local_x  = i * width
	 */

	// convert global coordinate to index
	x2i: function(x) {
		return Math.floor((x - this._offsetX) / this.tileWidth);
	},
	y2j: function(y) {
		return Math.floor((y - this._offsetY) / this.tileHeight);
	},
	// convert index to local coordinate
	// where map.x map.y is always 0
	i2x: function(i) {
		return i * this.tileWidth;
	},
	j2y: function(j) {
		return j * this.tileHeight;
	},
	getTerrain: function(i, j) {
		return this.terrain_data[j][i];
	},
	isInMap: function(i, j) {
		if (j >= 0 && j <= this.height &&
			i >= 0 && i <= this.width) {
			return true;
		}
		return false;
	},
	isPassible: function(terrain, school) {
		// there may be terrains 
		// that only allow units in some schools to pass
		return terrain >= 0;
	},
	getReqMovement: function(terrain, school) {
		if (this.isPassible(terrain)) {
			return this._movement_matrix[terrain][school];
		} else {
			return -1;
		}
	},
	// make some grid at the center of the screen
	focus: function(i, j) {
		// global x/y
		var x = ~~(CONFIG.get(["system", "width"]) / 2) 
			- this.i2x(i) - this._offsetX - CONFIG.get(["map", "tileWidth"]);
		var y = ~~(CONFIG.get(["system", "height"]) / 2) 
			- this.j2y(j) - this._offsetY - CONFIG.get(["map", "tileHeight"]);

		if (x < BATTLE.min_x) {
			BATTLE.x = BATTLE.min_x;
		} else if (x > BATTLE.max_x) {
			BATTLE.x = BATTLE.max_x;
		} else {
			BATTLE.x = x;
		}

		if (y < BATTLE.min_y) {
			BATTLE.y = BATTLE.min_y;
		} else if (y > BATTLE.max_y) {
			BATTLE.y = BATTLE.max_y;
		} else {
			BATTLE.y = y;
		}
	},
	// BFS get available grids 
	// according to unit position and range
	getAvailGrids: function(unit, rng) {
		var src = {
			i: unit.i,
			j: unit.j,
			r: rng,
			route: [],
		};
		var src = new Grid(unit.i, unit.j, unit.d, rng);
		var queue = [];
		var avail_grids = [];
		var self = this;

		// function within getAvailGrids
		// it can 'see' variables defined in getAvailGrids
		var isValid = function (cur) {
			if (!self.isInMap(cur.i, cur.j)) {
				return false;
			}
			//if (cur.i == src.i && cur.j == src.j) {
			//	return false;
			//}
			if (cur.r < 0) {
				return false;
			}
			var terrain = self.getTerrain(cur.i, cur.j);
			// impassible
			if (!self.isPassible(terrain, unit.attr.current.school)) {
				return false;
			}
			// remain movement > 0
			// but movement is not enough for this grid
			if (cur.r + 1 < self.getReqMovement(terrain, unit.attr.current.school)) {
				return false;
			}

			// TODO: make an abstract function of this block
			if (unit.side == CONSTS.side.PLAYER && 
				BATTLE.hitUnit(cur.i, cur.j, CONSTS.side.ENEMY)) {
				return false;
			}
			if (unit.side == CONSTS.side.ENEMY && 
				BATTLE.hitUnit(cur.i, cur.j, CONSTS.side.PLAYER)) {
				return false;
			}

			for (var i = 0; i < avail_grids.length; i++) {
				if (avail_grids[i].i == cur.i && avail_grids[i].j == cur.j) {
					return false;
				}
			}
			return true;
		};

		queue.push(src);
		while(queue.length > 0) {
			var cur = queue.shift();
			if (isValid(cur)) {
				cur.route.push({i: ~~(cur.i), j: ~~(cur.j), d: cur.d});
				avail_grids.push(cur);
			}
			var up    = new Grid(cur.i, cur.j - 1, CONSTS.direction.UP,    cur.r - 1, cur.route.slice());
			var down  = new Grid(cur.i, cur.j + 1, CONSTS.direction.DOWN,  cur.r - 1, cur.route.slice());
			var left  = new Grid(cur.i - 1, cur.j, CONSTS.direction.LEFT,  cur.r - 1, cur.route.slice());
			var right = new Grid(cur.i + 1, cur.j, CONSTS.direction.RIGHT, cur.r - 1, cur.route.slice());

			if (isValid(down)) {
				queue.push(down);
			}
			if (isValid(right)) {
				queue.push(right);
			}
			if (isValid(up)) {
				queue.push(up);
			}
			if (isValid(left)) {
				queue.push(left);
			}
		}
		return avail_grids;
	},
	getAvailAtkGrids: function(grid, type) {
		var grids = [];
		if (type === CONSTS.attack_type.NONE) {
			return [];
		}
		else if (type === CONSTS.attack_type.RANGE_1) {
			grids = this.getNeighbor4(grid);
		}
		else if (type === CONSTS.attack_type.RANGE_2) {
			grids = this.getNeighbor8(grid);
		}
		var isValid = function(elem, index, arr) {
			return MAP.isInMap(elem.i, elem.j);
		};
		return grids.filter(isValid);
	},
	getNeighbor4: function(grid) {
		var up    = new Grid(grid.i, grid.j - 1);
		var down  = new Grid(grid.i, grid.j + 1);
		var left  = new Grid(grid.i - 1, grid.j);
		var right = new Grid(grid.i + 1, grid.j);
		return [up, down, left, right];
	},
	getNeighbor4x: function(grid) {
		var up_left		= new Grid(grid.i - 1, grid.j - 1);
		var up_right	= new Grid(grid.i + 1, grid.j - 1);
		var down_left	= new Grid(grid.i - 1, grid.j + 1);
		var down_right	= new Grid(grid.i + 1, grid.j + 1);
		return [up_left, up_right, down_left, down_right];
	},
	getJumped4: function() {
		var up    = new Grid(grid.i, grid.j - 2);
		var down  = new Grid(grid.i, grid.j + 2);
		var left  = new Grid(grid.i - 2, grid.j);
		var right = new Grid(grid.i + 2, grid.j);
		return [up, down, left, right];
	},
	getNeighbor8: function(grid) {
		return this.getNeighbor4(grid).concat(this.getNeighbor4x(grid));
	},
	getNeighbor12: function(grid) {
		return this.getNeighbor4(grid).concat(this.getNeighbor4x(grid)).concat(this.getJumped4(grid));
	},
	_noop: function() {}
});

var Attr = enchant.Class.create({
	classname: "Attr",
	name: null,
	chara_id : 0,
	level: 0,
	school: null,
	rank: null,
	hp: 0,
	mp: 0,
	atk: 0,
	def: 0,
	intl: 0,
	dex: 0,
	mor: 0,
	mov: 0,
	rng: 0,
	exp: 0,
	
	initialize: function(master_attr, cur_attr, unit) {
		if (master_attr == null) {
			throw new Error('master_attr undefined');	
		}
		if (unit == null) {
			throw new Error('unit undefined');	
		}
		this.unit = unit;

		this.master = {};
		this.current = {};
		this.last = {};

		this.master.chara_id = master_attr.chara_id;
		this.master.name = master_attr.name;
		this.master.level = master_attr.level;
		this.master.school = master_attr.school;
		this.master.rank = master_attr.rank;
		this.master.hp = master_attr.hp;
		this.master.mp = master_attr.mp;
		this.master.atk = master_attr.atk;
		this.master.def = master_attr.def;
		this.master.intl = master_attr.intl;
		this.master.dex = master_attr.dex;
		this.master.mor = master_attr.mor;
		this.master.mov = master_attr.mov;
		this.master.rng = master_attr.rng;
		this.master.exp = master_attr.exp;

		// init current & last
		for (var prop in this.master) {
			var value = cur_attr && cur_attr[prop] ? cur_attr[prop] : this.master[prop];
			this.current[prop] = value;
			this.last[prop] = value;
		}
	},
	master: {
		get: function() {
			return this._master;
		},
		set: function(m) {
			this._master = m;
		}
	},
	current: {
		get: function() {
			return this._current;
		},
		set: function(c) {
			this._current = c;
		}
	},
	last: {
		get: function() {
			return this._last;
		},
		set: function(l) {
			this._last = l;
		}
	},
	backup: function() {
		this._last = {};
		for (var prop in this._current) {
			this._last[prop] = this._current[prop];
		}
		this._last.x = this.unit.x;
		this._last.y = this.unit.y;
		this._last.i = this.unit.i;
		this._last.j = this.unit.j;
		this._last.d = this.unit.d;
	},
	resume: function() {
		this._current = {};
		for (var prop in this._last) {
			this._current[prop] = this._last[prop];
		}
	},
	changed: function() {
		for (var prop in this._last) {
			if(this._current[prop] != this._last[prop]) {
				return true;
			}
		}
		return false;
	},
	levelup: function() {
		var diff_level = this.current.level - this.master.level;
		this.master.level = this.current.level;
		for (var i = 0; i < diff_level; i++) {
			this.master.hp += rand(5, 10);
			this.master.mp += rand(3, 5);
			this.master.atk += rand(1, 5);
			this.master.def += rand(1, 5);
			this.master.intl += rand(1, 5);
			this.master.dex += rand(1, 5);
			this.master.mor += rand(1, 5);
		}

		// recover hp/mp and all status
		for (var prop in this.master) {
			if (prop != "exp") {
				var value = this.master[prop];
				this.current[prop] = value;
				this.last[prop] = value;
			}
		}

	},
	_noop: function() {}
});

var Ai = enchant.Class.create(enchant.EventTarget, {
	classname: "Ai",

	initialize: function(conf, unit){
		enchant.EventTarget.call(this);
		this.type = CONSTS.ai[conf];
		this.unit = unit;
		if (this.type == null || this.unit == null) {
			throw new Error('Undefined ai parameter ' + conf + " : " + unit);
		}
		this.possible_actions = [];
	},
	// 0, determine round strategy at round start
	updateRoundStrategy: function() {

	},
	// 1, find all possible actions
	// 2, score all actions according to some specific rules
	getAvailActions: function() {
		// call getAvailGrids and move based on grids
		var origin = {
			i: ~~(this.unit.i),
			j: ~~(this.unit.j),
			r: ~~(this.unit.mov),
			d: ~~(this.unit.d),
			route: [],
		};
		var action = {};
		this.genIdle(origin);
		// Strategy that dont't allow moving
		if (this.type == CONSTS.ai.DUMMY) {
			// do nothing
		} 
		else if (this.type == CONSTS.ai.HOLD_POSITION) {
			this.genAttack(origin);
			this.genMagicAttack(origin);
			this.genHeal(origin);
		}
		// attack if there is unit available in range
		// otherwise defend its position
		else if (this.type == CONSTS.ai.DEFEND) {
			this.genAttack(origin);
			this.genMagicAttack(origin);
			this.genHeal(origin);

			var grids = MAP.getAvailGrids(this.unit, this.unit.attr.current.mov);
			for (var i = 0; i < grids.length; i++) {
				var g = grids[i];
				var u = BATTLE.getUnitByIndex(g.i, g.j);
				if (u == null) {
					this.genAttack(g);
					this.genMagicAttack(g);
					this.genHeal(g);
				}
			}
		}
		// Strategy that allow moving 
		else {
			var grids = MAP.getAvailGrids(this.unit, this.unit.attr.current.mov);
			for (var i = 0; i < grids.length; i++) {
				var g = grids[i];
				var u = BATTLE.getUnitByIndex(g.i, g.j);
				if (u == null) {
					this.genIdle(g);
					this.genAttack(g);
					this.genMagicAttack(g);
					this.genHeal(g);
				}
			}
		}
	},
	genIdle: function(grid) {
		var action = {};
		if (grid.i == this.unit.i && grid.j == this.unit.j) {
			action.type = "none";
		} else {
			action.type = "move";
		}
		action.move = grid;
		action.score = this.scoreMove(action.move);
		this.possible_actions.push(action);
	},
	genAttack: function(grid) {
		var grids = MAP.getAvailAtkGrids(grid, this.unit.attr.current.rng);

		for (var j = 0; j < grids.length; j++) {
			var unit = BATTLE.getUnitByIndex(
				grids[j].i, grids[j].j, CONSTS.side.PLAYER
			);
			if (unit !== null && unit.isOnBattleField()) {
				var action = {};
				action.type = "attack";
				action.move = grid;
				action.target = unit;
				action.presult = this.predictAttack(unit);
				action.score = 0;
				// score
				action.score += this.scoreMove(action.move);
				action.score += this.scoreAttack(action.presult);

				this.possible_actions.push(action);
			}
		}
	},
	genMagicAttack: function() {
	},
	genHeal: function() {
	},

	predictAttack: function(unit) {
		var attacker = this.unit;
		var defender = unit;
		var atk_dmg = BATTLE.calcAtkDamage(attacker, defender, "ATTACK");
		var rtl_dmg = 0;
		//var rtl_dmg = this.calcAtkDamage(defender, attacker, "RETALIATE");
		var presult = {
			attacker: {
				damage: rtl_dmg,
				status: attacker._status,
			},
			defender: {
				damage: atk_dmg,
				status: defender._status,
			}
		};
		if (attacker.attr.current.hp - rtl_dmg <= 0) {
			presult.defender.status = CONSTS.unit_status.DEAD;
		}
		if (defender.attr.current.hp - atk_dmg <= 0) {
			presult.defender.status = CONSTS.unit_status.DEAD;
		}

		return presult;
	},
	predictMagicAttack: function() {
	},
	predictHeal: function() {
	},

	// get move scores according to strategy
	scoreMove: function(grid) {
		if (grid == null) {
			return 0;
		}
		return 10;
	},
	// get action scores according to strategy
	scoreAttack: function(presult) {
		var score = 0;
		if (presult.defender) {
			score += presult.defender.damage;
			if (presult.defender.status == CONSTS.unit_status.DEAD) {
				score += CONSTS.INFINITE;
			}
		}
		if (presult.attacker) {
			score -= Math.round(presult.attacker.damage / 2);
			if (presult.attacker.status == CONSTS.unit_status.DEAD) {
				score -= CONSTS.INFINITE;
			}
		}
		// maybe useful in the future
		if (presult.other) {

		}
		return score;
	},
	// 3, sort all actions according to score
	// 4, fetch randomly one action above the line
	determineAction: function() {
		this.possible_actions = [];
		this.getAvailActions();
		sortByProp(this.possible_actions, "score", -1);
		this.possible_actions.filter(this.isAboveLine);
		//var index = rand(0, this.possible_actions.length - 1);
		var index = 0;
		return this.possible_actions[index];
	},
	isAboveLine: function(action) {
		return true;
	},
	_noop: function() {
	}
});

/*

	// action
	{
		type: 'none',
		move: [grid_obj],
		action: {
			type: 'attack',
			target: [target_obj]
			presult: {
				defender: {
					damage:
					status: 
				},
				attacker: {
					damage:
					status:
				},
			},
		},
		score: 100, 
	}
*/

// include chara and chara effect
var Unit = enchant.Class.create(enchant.Group, {
	classname: "Unit",
	initialize: function(conf) {
		enchant.Group.call(this);
		this.width = CONFIG.get(["map", "tileWidth"]);
		this.height = CONFIG.get(["map", "tileHeight"]);
		
		this.i = conf.position.i;
		this.j = conf.position.j;

		this.attr = new Attr(conf.master_attr, conf.cur_attr, this);

		// TODO:
		// clone se on each unit 
		// may eat up too much memory
		// may be we should make it a singleton
		this.se = {};
		var se_list = CONFIG.get(["SE", "unit"]);
		for (var type in se_list) {
			this.se[type] = GAME.assets[se_list[type]].clone();
			if (MUTE) {
				this.se[type].volumn = 0;
			}
		}

		this.action_end = false;
		this.weak_rate = 0.3;

		this._status = CONSTS.unit_status.NORMAL;
		this.ai = new Ai(conf.ai, this);

		this.chara = new Chara(conf);
		this.label = new Label("");
		this.label.color = '#ffffff';
		this.addChild(this.chara);
		this.addChild(this.label);
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
	d: {
		get: function() {
			return this.chara.d;
		},
		set: function(td) {
			this.chara.d = td;
		}
	},
	animMove: function(route, onMoveComplete) {
		// for each waypoint
		var tl = this.tl;
		var d = this._cur_direction;
		var c = 0;
		for (var i = 0; i < route.length; i++) {
			d = route[i].d;
			// 后边d值变化了，覆盖了前面的值
			// 导致之前放入回调函数里的d值也变化了
			tl = tl.action({
				time: 0,
				onactionstart: function() {
					this.move(route[c].d);
					++c;
				},
			}).moveTo(
				route[i].i * CONFIG.get(["map", "tileWidth"]), 
				route[i].j * CONFIG.get(["map", "tileHeight"]), 
				20
			);
		}
		var self = this;
		tl = tl.then(function() {
			//this.moveTo(Math.round(this.x), Math.round(this.y));
		});
		tl = tl.then(function() {
			onMoveComplete.call(this, self);
		});
	},
	isOnBattleField: function() {
		if (this._status == CONSTS.unit_status.HIDE || 
			this._status == CONSTS.unit_status.DEAD) {
			return false;
		}
		return true;
	},
	canMove: function() {
		if (this._status != CONSTS.unit_status.MOVED && 
			this._status != CONSTS.unit_status.ACTIONED && 
			this._status != CONSTS.unit_status.HIDE && 
			this._status != CONSTS.unit_status.DEAD) {
			return true;
		}
		return false;
	},
	canLevelUp: function() {
		return this.side == CONSTS.side.PLAYER && 
			this.attr.current.exp >= this.attr.master.exp;
	},
	attack: function(d, onComplete) {
		// demo
		if (this.side == CONSTS.side.PLAYER) {
			this.se['atk_2'].play();
		} else {
			this.se['atk'].play();
		}
		this.chara.setAnim("ATTACK", d, onComplete);
	},
	criticalAttack: function(d) {
		this.se['atk_crit'].play();
		this.chara.setAnim("ATTACK", d);
	},

	move: function(d) {
		// demo
		if (this.side == CONSTS.side.PLAYER) {
			this.se['horse_move'].play();
		} else {
			this.se['foot_move'].play();
		}
		this.chara.setAnim("MOVE", d);
	},
	resume: function(d) {
		if (d) {
			this.d = d;
		}
		this.label.text = "";
		// sync cur attr 
		if (this.attr.current.hp <= this.attr.master.hp * this.weak_rate) {
			this.chara.setAnim("WEAK", this.d);
		} else {
			if (this._status == CONSTS.unit_status.ACTIONED) {
				this.chara.setAnim("STAND", this.d);
			} else {
				this.chara.setAnim("MOVE", this.d);
			}
		}
	},
	stand: function() {
		if (this._status == CONSTS.unit_status.ACTIONED) {
			this.chara.setAnim("STAND", this.d);
		}
	},
	defend: function(critical) {
		if (critical) {
			this.se['def_crit'].play();
		} else {
			this.se['def'].play();
		}
		this.chara.setAnim("DEFEND", this.d);
	},
	hurt: function(damage, critical, onComplete) {
		if (critical) {
			this.se['hit_crit'].play();
		} else {
			this.se['hit'].play();
		}
		this.chara.setAnim("HURT", this.d, onComplete);
		this.label.text = damage;
	},
	levelUp: function() {
		this.chara.setAnim("LEVEL_UP", this.d, function() {
			this.se['level_up'].play();
		});
		console.log("level up to " + this.attr.current.level);
		this.attr.levelup();
	},
	die: function() {
		this.se['die'].play();
		this.chara.setAnim("WEAK", this.d);
		this.chara.blink = true;
		this._status = CONSTS.unit_status.DEAD;
	},
	_noop: function() {

	}
});

var Chara = enchant.Class.create(enchant.Sprite, {
	classname: "Chara",
	initialize: function(conf) {
		enchant.Sprite.call(
			this, 
			conf.position.i * CONFIG.get(["map", "tileWidth"]),
			conf.position.j * CONFIG.get(["map", "tileHeight"])
		);

		this.blink = false;

		// should be initialized
		this.width = CONFIG.get(["map", "tileWidth"]);
		this.height = CONFIG.get(["map", "tileHeight"]);
		//console.log("Chara.initialized:  x: " + this.x + " y: " + this.y + " width: " + this.width + " height: " + this.height);
		this._status = CONSTS.unit_status.NORMAL;
		this._onAnimEnd = null;
	
	
		this._anims = {
			"ATTACK" : {
				"asset" : conf.resource.img_atk,
				"frames" : [0, 0, 0, 1, 2, 3, 3, 3],
				// df stand for direction factor
				"df" : 4,
				"fps" : 10,
				"loop" : false,
				"width" : 64,
				"height" : 64
			},
			"MOVE" : {
				"asset" : conf.resource.img_mov,
				"frames" : [0, 1],
				"df" : 2,
				"fps" : 2,
				"loop" : true,
				"width" : 48,
				"height" : 48
			},
			"WEAK" : {
				"asset" : conf.resource.img_mov,
				"frames" : [8, 9],
				"df" : 0,
				"fps" : 2,
				"loop" : true,
				"width" : 48,
				"height" : 48
			},
			"STAND" : {
				"asset" : conf.resource.img_spc,
				"frames" : [0],
				"df" : 1,
				"fps" : 0,
				"loop" : false,
				"width" : 48,
				"height" : 48
			},
			"DEFEND" : {
				"asset" : conf.resource.img_spc,
				"frames" : [4],
				"df" : 1,
				"fps" : 0,
				"loop" : false,
				"width" : 48,
				"height" : 48
			},
			"HURT" : {
				"asset" : conf.resource.img_spc,
				"frames" : [8, 8, 8, 8],
				"df" : 0,
				"fps" : 16,
				"loop" : false,
				"width" : 48,
				"height" : 48
			},
			"WIN" : {
				"asset" : conf.resource.img_spc,
				"frames" : [9],
				"df" : 0,
				"fps" : 0,
				"loop" : false,
				"width" : 48,
				"height" : 48
			},
			"LEVEL_UP" : {
				"asset" : conf.resource.img_spc,
				"frames" : [4, 5, 6, 7, 4, 5, 6, 7, 9, 9, 9, 9],
				"df" : 0,
				"fps" : 10,
				"loop" : false,
				"width" : 48,
				"height" : 48
			}

		};

		//this.setAnim("MOVE", conf.position.d);
		this.setAnim("MOVE", conf.position.d);
		
		this.addEventListener("enterframe", function(){
			if (this.shouldPlayNextFrame()) {
				this.setCurAnimNextFrame();
			}
			if (this.blink == true) {
				if (this.age % 15 > 7) {
					this.opacity = 1;
				} else {
					this.opacity = 0;
				}
			}
		});
	},
	d: {
		get: function() {
			return this._cur_direction;
		},
		set: function(td) {
			this._cur_direction = td;
		}
	},
	// change only direction but not animation
	setDirection: function(direction) {
		if (direction == this.d) {
			return;
		}

		var frames = [];
		// change direction for each frame
		for (var i = 0; i < this._cur_anim.frames.length; i++) {
			frames[i] = this._cur_anim.frames[i] + this._cur_anim.df * direction;
		}
		// set first frame
		this.frame = frames[this._cur_frame];

		this.d = direction;
		this._last_frame_update = this.age; 
	},
	// called when sprite image size changed
	_adjustNewSize: function(newWidth, newHeight) {
		this.x += (this.width - newWidth) / 2;
		this.y += (this.height - newHeight) / 2;
		this.width = newWidth;
		this.height = newHeight;
		//console.log("Chara._adjustNewSize: " + this.x + " : " + this.y + " : " + this.width + " : " + newWidth);
	},
	// status, asset, fps, frame num should be assigned
	setAnim: function(anim, direction, onAnimEnd){
		if (anim == null || (direction == null && this.d == null)) {
			console.log("Error Chara.setAnim: " + anim + " : " + direction);
			return;
		}
		if (direction !== null) {
			this.d = direction;
		}
		if (onAnimEnd) {
			if (this._onAnimEnd) {
				this.removeEventListener('onAnimEnd', this._onAnimEnd);
			}
			this._onAnimEnd = onAnimEnd;
			this.addEventListener('onAnimEnd', this._onAnimEnd);
		}

		this.image = GAME.assets[this._anims[anim].asset];
		var frames = [];
		// change direction for each frame
		for (var i = 0; i < this._anims[anim].frames.length; i++) {
			frames[i] = this._anims[anim].frames[i] + this._anims[anim].df * this.d;
		}
		var frame_num = 0;
		/*
		if (!frame_num) {
			frame_num = 0;
		} else {
			frame_num = frame_num % frames.length;
		}*/
		// set first frame
		this.frame = frames[frame_num];
		this._adjustNewSize(this._anims[anim].width, this._anims[anim].height);

		this._cur_anim = this._anims[anim];
		this._cur_frame = frame_num;
		this._last_frame_update = this.age;
		this._cur_anim_end_fired = false;
		//console.log("Chara: setAnim: " + this._cur_frame + " : " + frames.length);
	},
	getCurAnimTotalFrameNum: function() {
		return this._cur_anim.frames.length == null ? this._cur_anim.frames.length : 0;	
	},
	setCurAnimFrameNum: function(num) {
		if (this._cur_anim.frames.length == 1 && num > 1) {
			console.log("Error Chara.setCurAnimFrameNum: No other frame to set");
			return;
		}
		if (this._cur_anim.frames.length == num + 1) {
			if (this._cur_anim.loop === false) {
				if (this._cur_anim_end_fired == false) {
					this._cur_anim_end_fired = true;
					this.dispatchEvent(new enchant.Event("onAnimEnd"));
				}
				return;
			}
		}

		num = num % this._cur_anim.frames.length;
		this._cur_frame = num;
		this._last_frame_update = this.age;
		this.frame = this._cur_anim.frames[num] + this._cur_anim.df * this.d;
		//console.log("Chara: setCurAnimFrameNum: " + this._cur_frame + " : " + this.frame + " : " + this.age);
	},
	setCurAnimNextFrame: function() {
		//console.log("Chara: setCurAnimNextFrame: " + this._cur_frame + " : " + this.age);
		this.setCurAnimFrameNum(this._cur_frame + 1);
	},
	shouldPlayNextFrame: function() {
		//console.log("Chara: shouldPlayNextFrame: " + this._cur_frame + " : " + this.age);
		var next_frame = ~~((this.age % GAME.fps) / GAME.fps * this._cur_anim.fps);
		return next_frame == this._cur_frame ? true : false;
	},
	noop: function() {}
}); 



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
var BattleScene = enchant.Class.create(enchant.Scene, {
	classname: "BattleScene",
	initialize: function() {
		enchant.Scene.call(this);
		this.round = 0;
		this.max_round = CONFIG.get(["map", "mission", "max_round"]);
		this.win_conds = [];
		this.lose_conds = [];
		// TODO: implement this later
		this.scenario_conds = [];
		this.scenario_cb = [];

		this.actor = null;

		this._status = CONSTS.battle_status.INIT;
		this._units = [];
		this._player_units = [];
		this._allies_units = [];
		this._enemy_units = [];
		this._touch_origin_x = 0;
		this._touch_origin_y = 0;

		this.map_max_x = 
			CONFIG.get(["map", "tileWidth"]) * CONFIG.get(["map", "width"]);
		this.map_max_y = 
			CONFIG.get(["map", "tileHeight"]) * CONFIG.get(["map", "height"]);
		this.map_min_x = 0;
		this.map_min_y = 0;

		this.min_x = CONFIG.get(["system", "width"]) - this.map_max_x;
		this.min_y = CONFIG.get(["system", "height"]) -  this.map_max_y;
		this.max_x = 0;
		this.max_y = 0;

		// these layers are difference from 
		// the ones defined in enchant.js
		// here are only big childs 
		// that used for determine children depth
		this.map_layer = new Group();
		this.effect_layer = new Group();
		this.unit_layer = new Group();
		this.ui_layer = new Group();

		this.addChild(this.map_layer);
		this.addChild(this.effect_layer);
		this.addChild(this.unit_layer);
		this.addChild(this.ui_layer);

		this.effect_layer.addEventListener(enchant.Event.TOUCH_START, bind(this.effect_layer_onTouchStart, this));
		this.effect_layer.addEventListener(enchant.Event.TOUCH_MOVE, bind(this.effect_layer_onTouchMove, this));
		this.effect_layer.addEventListener(enchant.Event.TOUCH_END, bind(this.effect_layer_onTouchEnd,this));

		this.addMap(CONFIG.get(["map"]));
		this.addUnits(CONFIG.get(["player_unit"]), CONSTS.side.PLAYER);
		this.addUnits(CONFIG.get(["allies_unit"]), CONSTS.side.ALLIES);
		this.addUnits(CONFIG.get(["enemy_unit"]), CONSTS.side.ENEMY);

		this.addEventListener(enchant.Event.TOUCH_START, this.onTouchStart);
		this.addEventListener(enchant.Event.TOUCH_MOVE, this.onTouchMove);
		this.addEventListener(enchant.Event.TOUCH_END, this.onTouchEnd);

		this.addEventListener(enchant.Event.ENTER, this.onEnter);
		this.addEventListener(enchant.Event.EXIT, this.onExit);
	},
	effect_layer_onTouchStart: function(evt) {
		var grid = this.getShadeByIndex(MAP.x2i(evt.x), MAP.y2j(evt.y), "MOV");
		if (grid && (!this.route_dst || 
			!(grid.i == this.route_dst.i && grid.j == this.route_dst.j))) {
			this.updateRoute(grid);
		}
		// if already have route and touch on dst
		// then move to there 
		else if (grid && this.route_dst && 
			grid.i == this.route_dst.i && grid.j == this.route_dst.j){
			this.move(this.actor, this.route_dst);
		}
	},
	effect_layer_onTouchMove: function(evt) {
		var grid = this.getShadeByIndex(MAP.x2i(evt.x), MAP.y2j(evt.y), "MOV");
		if (grid && (!this.route_dst || 
			!(grid.i == this.route_dst.i && grid.j == this.route_dst.j))) {
			this.updateRoute(grid);
		}
	},
	effect_layer_onTouchEnd: function(evt) {
		var grid = this.getShadeByIndex(MAP.x2i(evt.x), MAP.y2j(evt.y), "MOV");
		if (grid && (!this.route_dst || 
			!(grid.i == this.route_dst.i && grid.j == this.route_dst.j))) {
			this.updateRoute(grid);
		}
	},

	// scene methods
	// these do not override default ones
	onEnter: function() {
		// enter and re-enter
		// pop push will trigger this 
	},
	onExit: function() {
		// pop push will trigger this 
	},

	// method that handle click events
	onTouchStart: function(evt) {
		// status check
		if (false) {
			return; 
		}

		// if hit an valid unit
		// unit drag
		var unit = this.getUnitByLoc(evt.x, evt.y);
		if (unit && unit.side == CONSTS.side.PLAYER && 
			this._status == CONSTS.battle_status.NORMAL && unit.canMove()) {
		//	this._drag_move = true;
			//this.updateRoute(unit);
			this.onUnitSelect(unit, CONSTS.side.PLAYER);
		}
		// map drag 
		else {
			this._touch_origin_x = evt.x;
			this._touch_origin_y = evt.y;
			this._origin_x = this.x;
			this._origin_y = this.y;
		}
	},
	onTouchMove: function(evt) {
		// status check
		if (this._status >= CONSTS.battle_status.ACTION) {
			return; 
		}

		unit = this.getUnitByLoc(evt.x, evt.y);
		shade = this.getShadeByLoc(evt.x, evt.y);
		if (this._status == CONSTS.battle_status.ACTION_RNG && 
			unit == this.actor || shade != null) {
			//return;
		}

		// map drag
		if (this._status != CONSTS.battle_status.MOVE_RNG) {	
			this.x = ~~(this._origin_x + evt.x - this._touch_origin_x);
			this.y = ~~(this._origin_y + evt.y - this._touch_origin_y);
			
			// border check
			if (this.x < this.min_x){
				this.x = this.min_x;
			}
			if (this.x > this.max_x){
				this.x = this.max_x;
			}
			if (this.y < this.min_y){
				this.y = this.min_y;
			}
			if (this.y > this.max_y){
				this.y = this.max_y;
			}
		}
		// drag move
		else {
			this.effect_layer_onTouchMove(evt);
		}
	},
	onTouchEnd: function(evt) {
		// Big Status Machine
		//console.log("Battle clicked: " + evt.x + " : " + evt.y + " : " + this._status);
		var unit;
		if (this.turn != CONSTS.side.PLAYER) {
			console.log("NOT PLAYER'S TURN, IGNORE THIS EVENT");
			return;
		}

		if (this._status == CONSTS.battle_status.NORMAL) {
			this.removeInfoBox();
			unit = this.getUnitByLoc(evt.x, evt.y);
			// only map or exception
			if (unit != null) {
				if (unit.side == CONSTS.side.PLAYER) {
					this.onUnitSelect(unit, CONSTS.side.PLAYER);
				} else if (unit.side == CONSTS.side.ENEMY) {
					this.onUnitSelect(unit, CONSTS.side.ENEMY);
				}
			}
		}
		else if (this._status == CONSTS.battle_status.MOVE_RNG) {
			// if this is not a drag move
			//if (!this._drag_move) {
				unit = this.getUnitByLoc(evt.x, evt.y);
				if (unit == this.actor) {
					this.removeShades();
					this.showMenu(unit);
				}
			//}
		}
		else if (this._status == CONSTS.battle_status.MOVE) {
			// if there is a touch event at this phrase
			// it means to finish this animatin immediately
			// TODO:
			//this.finishCurMove();
		}
		else if (this._status == CONSTS.battle_status.ACTION_SELECT) {
			// cancel mov
			unit = this.getUnitByLoc(evt.x, evt.y);
			if (unit == this.actor) {
				this.removeMenu();
				this.actionCancel();
			}
		}
		else if (this._status == CONSTS.battle_status.ACTION_RNG) {
			unit = this.getUnitByLoc(evt.x, evt.y);
			shade = this.getShadeByLoc(evt.x, evt.y);
			if (unit != null && shade != null) {
				shade.dispatchEvent(evt);
			}
			// cancel action range
			if (unit != null && unit == this.actor) {
				this.removeShades();
				this.showMenu(unit);
			}
		}
		else if (this._status == CONSTS.battle_status.ACTION) {
			// do nothing
		}
		else if (this._status == CONSTS.battle_status.INFO) {
			unit = this.getUnitByLoc(evt.x, evt.y);
			// click to remove infobox
			if (unit != null) {
				if (unit == this._infobox.unit) {
					this.removeInfoBox();
					this._status = CONSTS.battle_status.NORMAL;
				} else {
					this.removeInfoBox();
					this.showInfoBox(unit);
				}
			}
		}
		// default is skip 
		else {
			console.log("Status: " + this._status + " can not handle this click, skip");
		}
		//this._drag_move = false;
	},

	// battle control framework
	// initialize
	battleStart: function() {
		this.round = 0;
		//this.turn = CONSTS.side.PLAYER;
		//this._status = CONSTS.battle_status.NORMAL;
		/*
		var lb_battle_start = new LabelScene({
			labels: [
				{
					text: "Battle Start!",
					lifetime: 60,
				}
			]
		});
		GAME.pushScene(lb_battle_start);
		*/
		//this.tl.delay(60).then(function() {
			this.roundStart();
		//});
	},
	// battle end
	battleEnd: function(result) {
		// TODO: server communication


		var text;
		if (result == CONSTS.battle_status.WIN) {
			text = "Victory!";
		} else {
			text = "Try Again...";
		}
		var lb_battle_end = new LabelScene({
			labels: [
				{
					text: text,
					lifetime: 60,
				}
			]
		});
		GAME.pushScene(lb_battle_end);
		GAME.stop();
	},
	// preprocess logic before each round
	// to set all units' _status flag etc.
	roundStart: function() {
		this.round++;
		var text = "ROUND " + this.round + " START !!!";
		console.log(text);
		var lb_round_start = new LabelScene({
			labels: [
				{
					text: text,
					lifetime: 90,
				},
				{
					text: "Player Turn",
					lifetime: 90,
				},
			]
		});
		GAME.pushScene(lb_round_start);
		for (var s in this._units) {
			var units = this._units[s];
			for (var i = 0; i < units.length; i++) {
				if (units[i].isOnBattleField()) {
					units[i]._status = CONSTS.unit_status.NORMAL;
					units[i].resume();
				}
			}
		}
		// call scenario first
		// this.scenario();

		// this should be the callback
		// as the scenario finishes
		//this.tl.delay(60).then(function() {
			this.turnStart(CONSTS.side.PLAYER);
		//});
	},
	// enemy turn finishes and round end
	// there maybe round condition check here
	roundEnd: function() {
		// round check
		// this.battleEnd("lose");
		//if (this.conditionJudge(this.win_conds)) {
		if (false) {
			this.battleEnd(CONSTS.battle_status.WIN);
		//} else if (this.conditionJudge(this.lose_conds)) {
		} else if (false) {
			this.battleEnd(CONSTS.battle_status.LOSE);
		} else {
			/*
			var ret = this.conditionJudge(this.scenario_conds)
			if (ret) {
				this.scenario_cb[ret].call();
			}*/
			this.roundStart();
		}
	},
	// what should we do before a turn ?
	turnStart: function(side) {
		// a new scene for "PLAYER TURN"/"ENEMY TURN"
		// GAME.pushScene("...");
		this.turn = side;
		if (side == CONSTS.side.ENEMY) {
			var lb_turn_start = new LabelScene({
				labels: [
					{
						text: "Enemy Turn",
						lifetime: 60,
					}
				]
			});
			GAME.pushScene(lb_turn_start);
			this.tl.delay(60).then(function() {
				// Enemy AI
				for (var i = 0; i < this._units[CONSTS.side.ENEMY].length; i++) {
					var enemy = this._units[CONSTS.side.ENEMY][i];
					if (enemy && enemy.isOnBattleField()) {
						var action_script = enemy.ai.determineAction(enemy);
						// action according the script
						this.actionStart(enemy, action_script);
						return;
					}
				}

				// if there is no enemy
				this.turnEnd();
			});
		} else if (side == CONSTS.side.ALLIES) {
			// Allies AI

			this.turnEnd();
		} else if (side == CONSTS.side.PLAYER) {
			/*
			var lb_turn_start = new LabelScene({
				labels: [
					{
						text: "Player Turn",
						lifetime: 60,
					}
				]
			});
			GAME.pushScene(lb_turn_start);
			*/
			if (this.round == 1) {
				MAP.focus(9, 5);
			}

			this._status = CONSTS.battle_status.NORMAL;
		}

	},
	// judge if it is a next turn or next round
	turnEnd: function() {
		if (this.turn == CONSTS.side.ENEMY) {
			this.roundEnd();
		} else if (this.turn == CONSTS.side.PLAYER) {
			this.turnStart(CONSTS.side.ALLIES);
		} else if (this.turn == CONSTS.side.ALLIES) {
			this.turnStart(CONSTS.side.ENEMY);
		}
	},
	actionStart: function(unit, action_script) {
		//if (!unit.isOnBattleField()) {
		//	this.actionEnd();
		//	return;
		//}

		this.actor = unit;
		this.actor.attr.backup();
		// foucs current actor
		if (unit.side == CONSTS.side.PLAYER) {
			this.showMoveRng(unit);
		} else if (unit.side == CONSTS.side.ALLIES) {
			this.actionEnd();
		} else if (unit.side == CONSTS.side.ENEMY) {
			if (action_script == null || action_script.type == "none") {
				this.actionEnd();
			} else if (action_script.action == 'move') {
				// show shade and move
				this.tl.action({
					time: 60,
					onactionstart: function() {
						this.showMove(unit, false);
					},
					onactionend: function() {
						this.move(unit, action_script.move, action_script);
					}
				});
			} else if (action_script.type == 'attack') {
				if (action_script.move.i == unit.i && 
					action_script.move.j == unit.j) { 
					this.attack(unit, action_script.target);
				} else {
					// show shade and move
					this.tl.action({
						time: 60,
						onactionstart: function() {
							this.showMoveRng(unit);
						},
						onactionend: function() {
							this.move(unit, action_script.move, action_script);
						}
					});

				}
			}
		}
	},
	// used for enemy action
	actionPhase: function() {
	},
	actionCancel: function() {
		this.actor._status = CONSTS.unit_status.NORMAL;
		this.actor.moveTo(this.actor.attr.last.x, this.actor.attr.last.y);
		this.actor.resume(this.actor.attr.last.d);
		this.actor = null;
		this._status = CONSTS.battle_status.NORMAL;
	},
	// called when action is completed
	// remove infobox/menu/shade
	// and call turn check
	actionEnd: function() {
		this._status = CONSTS.battle_status.NORMAL;
		if (this.actor.isOnBattleField()) {
			this.actor._status = CONSTS.unit_status.ACTIONED;
			this.actor.resume();
		}
		this.actor = null;

		this.removeShades();
		this.removeMenu();
		this.removeInfoBox();

		// battle condition check
		if (!this.unitsCheck(CONSTS.side.PLAYER)) {
			this.battleEnd(CONSTS.battle_status.LOSE);
			return;
		}
		if (!this.unitsCheck(CONSTS.side.ENEMY)) {
			this.battleEnd(CONSTS.battle_status.WIN);
			return;
		}

		//turn check
		var next_unit = this.turnCheck(this.turn);
		// for player only
		if (next_unit != null) {
			if (this.turn == CONSTS.side.PLAYER) {
				// do nothing
			} else {
				// ai pick next unit to move
				var action_script = next_unit.ai.determineAction();
				this.actionStart(next_unit, action_script);
			}
		}
		// switch to player/allies/enemy turn 
		else {
			if (this.turn == CONSTS.side.PLAYER) {
				// pop up to inform user of turn change
				// this.turnEnd(); //this should be callback
				this.turnEnd();
			} else {
				this.turnEnd();
			}
		}
	},
	// check whether all units are dead
	// TODO: integrate this check into condition check
	unitsCheck: function(side) {
		for (var i = 0; i < this._units[side].length; i++) {
			// TODO: hero check
			if(this._units[side][i].isOnBattleField()) {
				return true;
			}
		}
		return false;
	},

	conditionJudge: function(conds, callback) {
		for (var i = 0; i < conds.length; i++) {
			if (this.condReached(conds[i])) {
				callback.call();
				return;
			}
		}
	},
	condReached: function(cond) {
		return true;
	},

	// pre-assign units
	// no animation here 
	addUnits: function(units, side) {
		for (var i = 0; i < units.length; i++) {
			var unit = new Unit(units[i]);
			unit.side = side;
			if (!this._units[side]) {
				this._units[side] = [];
			}
			this._units[side].push(unit);
			if (!unit.hide) {
				this.unit_layer.addChild(unit);
			}
		}
	},
	// map utilities
	addMap: function(conf) {
		if (this.map) {
			this.reomveChild(this.map);
		}
		var map = new xyzMap(conf);
		this.map_layer.addChild(map);
		map.battle = this;
		this.map = map;
		MAP = map;
	},
	isMap: function(target) {
		return target === this.map;
	},
	removeShades: function() {
		if (this._atk_shade) {
			this.effect_layer.removeChild(this._atk_shade);
			this._atk_shade = null;
		}
		if (this._mov_shade) {
			this.effect_layer.removeChild(this._mov_shade);
			this._mov_shade = null;
		}
		this.removeRoute();
	},
	// same ones should not be removed
	updateRoute: function(unit) {
		var dst = this.getShadeByIndex(unit.i, unit.j, "MOV");
		// if there is not current route
		// then create
		var self = this;
		var cb_route_touch_end = function(grid) {
			//self.move(self.actor, grid);
		};
		if (this.route == null && (dst && dst.route)) {
			this.route = new Group();
			// add route
			for (var i = 0; i < dst.route.length; i++) {
				var r = dst.route[i];
				var routeShade = new Shade(
					r,
					"ROUTE",
					cb_route_touch_end
				);
				this.route.addChild(routeShade);
			}
			// add dst
			this.route_dst = new Shade(
				dst,
				"ROUTE"
			);
			this.route.addChild(this.route_dst);

			this.effect_layer.addChild(this.route);
		} else if (this.route && (dst == null || dst.route == null)) {
			this.removeRoute();
		} else if (this.route && (dst && dst.route)) {
			// 0, remove old dst
			this.route.removeChild(this.route_dst);

			// 1, remove old route
			// that are not in the new one
			var a, b;
			for (a = 0; a < this.route.childNodes.length; a++) {
				var r = this.route.childNodes[a];
				var hit = false;
				for (b = 0 ; b < dst.route.length; b++) {
					if (r.i == dst.route[b].i && r.j == dst.route[b].j) {
						hit = true;
						break;
					}
				}
				if (hit == false) {
					this.route.removeChild(r);
					a--;
				}
			}

			// 2, add new route 
			// that are not in the old one
			for (a = 0; a < dst.route.length; a++) {
				var hit = false;
				for (b = 0 ; b < this.route.childNodes.length; b++) {
					var r = this.route.childNodes[b];
					if (dst.route[a].i == r.i && dst.route[a].j == r.j) {
						hit = true;
						break;
					}
				}
				if (hit == false) {
					var routeShade = new Shade(
						dst.route[a],
						"ROUTE",
						cb_route_touch_end
					);
					this.route.addChild(routeShade);	
				}
			}

			// 3, add new dst
			this.route_dst = new Shade(
				dst,
				"ROUTE",
				cb_route_touch_end
			);
			this.route.addChild(this.route_dst);
		} else {
			// both null
		}
	},
	removeRoute: function() {
		if (this.route) {
			this.effect_layer.removeChild(this.route);
			this.route = null;
			this.route_dst = null;
		}
	},
	showMoveRng: function(unit) {
		this.removeMenu();
		this.removeShades();

		this._status = CONSTS.battle_status.MOVE_RNG;

		var self = this;
		var i = 0;
		var shade;
		this._move_grids = this.map.getAvailGrids(unit, unit.attr.current.mov);
		this._atk_grids = this.map.getAvailAtkGrids(unit, unit.attr.current.rng);
		this._atk_shade = new Group();
		this._mov_shade = new Group();
	
		// TODO: this should be rewritten
		var cb_mov_touch_end = function(grid) {
			//self.move(unit, grid);
			//self.updateRoute(grid);
		};

		for (i = 0; i < this._move_grids.length; i++) {
			shade = new Shade(
				this._move_grids[i], 
				"MOV",
				cb_mov_touch_end
			);
			this._mov_shade.addChild(shade);
		}
		this.effect_layer.addChild(this._mov_shade);
		
		var cb_atk_touch_end = function(grid) {
			return;
			for (var i = 0; i < self._move_grids.length; i++) {
				if (self._move_grids[i].i == grid.i && 
					self._move_grids[i].j == grid.j) {
					self.move(unit, self._move_grids[i]);
					return;
				}
			}
		};

		for (i = 0; i < this._atk_grids.length; i++) {
			shade = new Shade(
				this._atk_grids[i],
				"AR",
				cb_atk_touch_end
			);
			this._atk_shade.addChild(shade);
		}
		this.effect_layer.addChild(this._atk_shade);
		/*
		this.effect_layer.addEventListener('touchmove', function(evt) {
			var grid = self.getShadeByIndex(MAP.x2i(evt.x), MAP.y2j(evt.y), "MOV");
			if (grid && (!self.route_dst || 
				!(grid.i == self.route_dst.i && grid.j == self.route_dst.j))) {
				self.updateRoute(grid);
			}
		});
		*/
	},
	showAtkRng: function(unit) {
		this._status = CONSTS.battle_status.ACTION_RNG;
		//console.log("show attack range" + this._atk_grids);
		var self = this;
		this._atk_grids = this.map.getAvailAtkGrids(unit, unit.attr.current.rng);
		var cb_atk_touch_end = function(grid) {
			self.attack(unit, grid);
		};
		this._atk_shade = new Group();
		for (var i = 0; i < this._atk_grids.length; i++) {
			var shade = new Shade(
				this._atk_grids[i],
				"ATK",
				cb_atk_touch_end
			);
			this._atk_shade.addChild(shade);
		}
		this.effect_layer.addChild(this._atk_shade);
	},
	move: function(unit, shade, action_script) {
		this.removeShades();
		var target = this.getUnitByIndex(shade.i, shade.j);
		if (target != null && target != unit) {
			console.log("那里有其他单位不能移动");
			return;
		}
		var route = shade.route;
		if (route) {
			this._status = CONSTS.battle_status.MOVE;
			if (unit.side == CONSTS.side.PLAYER) {
				unit.animMove(route, bind(this.showMenu, this));
			} else {
				// ai
				if (action_script.type == 'attack') {
					var self = this;
					unit.animMove(route, function() {
						self.attack(unit, action_script.target);
					});
				} else {
					var self = this;
					unit.animMove(route, function() {
						self.actionEnd();
					});
				}
			}
		}
	},
	attack: function(unit, grid) {
		var enemy = this.getUnitByIndex(grid.i, grid.j);
		// if we don't remove shades at first time
		// when error occurs it will fall into a dead loop
		// onTouchEnd event will be passed to parentNode
		// so we should remove child nodes and re-create them again
		this.removeShades();
		if (unit == null) {
			console.log("攻击者不存在");
			this.actionCancel();
			return;
		}
		if (enemy == null) {
			console.log("没有攻击对象");
			this.showAtkRng(unit);
			return;
		}
		if (unit.side == enemy.side) {
			console.log("不能攻击友军单位");
			this.showAtkRng(unit);
			return;
		}

		this.infobox_queue = [];
		this.dead_queue = [];
		this.lvup_queue = [];

		this._status = CONSTS.battle_status.ACTION;
		var result = this.calcAttack(unit, enemy);
		this.animCharaAttack(result);
	},

	turnCheck: function(side) {
		var units = this._units[side];
		for (var i = 0; i < units.length; i++) {
			if (units[i].canMove()) {
				return units[i];
			}	
		}
		return null;
	},
	//
	isPlayerTurn: function() {
		return this.turn == CONSTS.side.PLAYER;
	},
	isAlliesTurn: function() {
		return this.turn == CONSTS.side.ALLIES;
	},
	isEnemyTurn: function() {
		return this.turn == CONSTS.side.ENEMY;
	},

	// Menu
	showMenu: function(unit) {
		if (this._menu) {
			this.removeMenu();
		}
		var self = this;
		this._menu = new Group();
		// TODO: the coordinate and menu layout should be changed
		var atk_btn = new Sprite(32, 32);
		atk_btn.image = GAME.assets["../images/menu/atk.png"]; 
		atk_btn.moveBy(- 24 - 32, 0);
		atk_btn.addEventListener(enchant.Event.TOUCH_END, function(){
			self.removeMenu();
			self.removeShades();
			self.showAtkRng(unit);
		});

		var mov_btn = new Sprite(32, 32);
		mov_btn.image = GAME.assets["../images/menu/mov.png"];
		mov_btn.moveBy(24, 0);
		mov_btn.addEventListener(enchant.Event.TOUCH_END, function(){
			self.removeMenu();
			self.removeShades();
			self.actionEnd();
		});

		var ret_btn = new Sprite(32, 32);
		ret_btn.image = GAME.assets["../images/menu/ret.png"];
		ret_btn.moveBy(-16, 48 + 24);
		ret_btn.addEventListener(enchant.Event.TOUCH_END, function(){
			self.removeMenu();
			self.removeShades();
			self.actionCancel();
		});

		this._menu.addChild(atk_btn);
		this._menu.addChild(mov_btn);
		this._menu.addChild(ret_btn);

		this._menu.moveTo(~~(unit.x + unit.width / 2), ~~(unit.y - unit.height / 2));
		this.ui_layer.addChild(this._menu);
		this._status = CONSTS.battle_status.ACTION_SELECT;
	},
	removeMenu: function() {
		if (this._menu) {
			this.ui_layer.removeChild(this._menu);
			this._menu = null;
		}
	},
	isMenu: function(target) {
		return target === this._menu;
	},

	// infobox
	showInfoBox: function(unit, type, onAnimComplete) {
		this._status = CONSTS.battle_status.INFO;
		this._infobox = new InfoBox(unit, type, onAnimComplete);
		this.ui_layer.addChild(this._infobox);
	},
	removeInfoBox: function() {
		if (this._infobox) {
			this.ui_layer.removeChild(this._infobox);
			this._infobox = null;
		}	
	},
	isInfoBox: function(target) {
		return target === this._infobox;
	},

	// Animation utilities
	animCharaAttack: function(attack_script) {
		// for each round
		if (attack_script == null) {
			this.animCharaAttackComplete();
			return;
		}
		var as = attack_script.shift();
		if (as == null) {
			this.animCharaAttackComplete();
			return;
		}
		var self = this;
		var result = as.r;
		var type = as.t; 
		var attacker = as.a;
		var defender = as.d;
		var damage = as.rd;
		var exp = as.re;
		var d = this.calcDirection(attacker, defender);
		var tl = this.tl;
		//if (type === "ATTACK") {
			attacker.attack(d, function() {
				defender.hurt(damage, false, function() {
					attacker.resume(d);
					defender.resume();
					self.animCharaAttack(attack_script);
				});
			});
		//}
	},
	animCharaAttackComplete: function() {
		this.infobox_queue = sortByProp(this.infobox_queue, 'side', -1);
		this.animCharaInfoBox();
	},
	// fetch from infobox queue
	// and play infobox animation one by one
	animCharaInfoBox: function() {
		var unit = this.infobox_queue.shift();
		if (unit != null) {
			this.tl.delay(10).then(function(){
				this.removeInfoBox();
				this.showInfoBox(unit, "ATK", bind(this.animCharaInfoBox, this));
			});
		} else {
			// no more infobox animation
			// resume to default status
			var self = this;
			this.tl.delay(10).then(function(){
				self.removeInfoBox();
				self.animCharaLevelup();
			});
		}
	},
	animCharaLevelup: function() {
		var unit = this.lvup_queue.shift();
		if (unit != null) {
			// 1, level up (done)
			// 2, weapon level up
			// 3, armor level up
			this.tl.delay(30).action({
				time: 100, // 10 frame buffer
				onactionstart: function() {
					unit.levelUp();
				},
				onactionend: function() {
					unit.resume();
					this.animCharaInfoBox();
				},
			});
		} else {
			// no more levelup animation
			this.tl.delay(30).then(function(){
				this.animCharaDie();
			});
		}
	},
	// there may be multiple units
	animCharaDie: function() {
		var unit = this.dead_queue.shift();
		if (unit != null) {
			this.tl.action({
				time: 60,
				onactionstart: function() {
					unit.die();
				},
				onactionend: function() {
					this.unit_layer.removeChild(unit);
					this.animCharaDie();
				}
			});
		} else {
			this.actionEnd();
		}
	},
	animCharaAppear: function(units) {

	},
	animCharaEscape: function(units) {
		
	},

	// numberic calculations
	calcRoute: function(unit, target) {
		var judgeDirection = function(src, dst) {
			if (src.x == dst.x && src.y > dst.y) {
				return CONSTS.direction.DOWN;
			}
			if (src.x == dst.x && src.y < dst.y) {
				return CONSTS.direction.UP;
			}
			if (src.x < dst.x && src.y == dst.y) {
				return CONSTS.direction.RIGHT;
			}
			if (src.x > dst.x && src.y == dst.y) {
				return CONSTS.direction.LEFT;
			}
		};
		var cur = {
			x: unit.x,
			y: unit.y
		};
		// return animation script	
		while (target.length > 0) {
			var next = target.shift();
			var d = judgeDirection(cur, next);
		}
	},
	calcAttack: function(attacker, defender) {
		if (attacker == null || defender == null) {
			console.log("Error Parameter" + attacker + " : " + defender);
			return;
		}

		// here we should determine attack type
		// double attack?
		// critical attack?
		// parry?


		var attack_script = [];
		var atk_dmg;
		var atk_exp;

		defender.attr.backup();

		// first strike
		if (true) {
			attack_script.push(this.calcStrike(attacker, defender, "ATTACK"));
		}

		// second strike
		if (false) {
			attack_script.push(this.calcStrike(attacker, defender, "DOUBLE"));
		}

		// retaliate
		if (defender.attr.current.hp > 0) {
			attack_script.push(this.calcStrike(defender, attacker, "RETAILATE"));
		}

		// re-retaliate
		if (false) {
			attack_script.push(this.calcStrike(attacker, defender, "RETAILATE"));
		}

		if (defender.attr.current.hp <= 0) {
			this.dead_queue.push(defender);
		}
		if (attacker.attr.current.hp <= 0) {
			this.dead_queue.push(attacker);
		}

		if (defender.attr.changed()) {
			this.infobox_queue.push(defender);
		}
		if (attacker.attr.changed()) {
			this.infobox_queue.push(attacker);
		}

		if (attacker.canLevelUp()) {
			attacker.attr.current.level += 
				~~(attacker.attr.current.level / attacker.attr.master.level);
			attacker.attr.current.exp %= attacker.attr.master.exp;
			this.lvup_queue.push(attacker);
		}
		if (defender.canLevelUp()) {
			defender.attr.current.level += 
				~~(defender.attr.current.level / defender.attr.master.level);
			defender.attr.current.exp %= defender.attr.master.exp;
			this.lvup_queue.push(defender);
		}


		return attack_script;
	},
	calcStrike: function(attacker, defender, type) {
		var ret = {};
		var atk_dmg = 0;
		var atk_exp = 0;
		// parry	
		if (false) {
			atk_exp = this.calcExp(attacker, defender, atk_dmg);
			ret = {
				r: "PARRY", 
				t: type,
				a: attacker,
				d: defender,
				rd: atk_dmg,
				re: atk_exp
			};
		} else {
			atk_dmg = this.calcAtkDamage(attacker, defender, type);
			atk_exp = this.calcExp(attacker, defender, atk_dmg);
			ret = {
				r: "HIT", 
				t: type,
				a: attacker,
				d: defender,
				rd: atk_dmg,
				re: atk_exp
			};
		}

		defender.attr.current.hp -= atk_dmg;
		if (attacker.side == CONSTS.side.PLAYER) {
			attacker.attr.current.exp += atk_exp;
		}
		return ret;
	},
	calcDirection: function(attacker, defender) {
		if (defender.i > attacker.i) {
			return CONSTS.direction.RIGHT;
		} else if (defender.i < attacker.i) {
			return CONSTS.direction.LEFT;
		} else {
			if (defender.j < attacker.j) {
				return CONSTS.direction.UP;
			} else {
				return CONSTS.direction.DOWN;
			}
		}
	},
	calcAtkDamage: function(attacker, defender, type) {
		var damage = attacker.attr.current.atk - defender.attr.current.def;
		damage *= 2;
		if (type == "ATTACK") {
			// TODO: attack bonus
		} else if (type == "DOUBLE") {
			damage = Math.round(damage * 0.8);
		} else if (type == "RETALIATE") {
			damage = Math.round(damage * 0.6);
		}
		return damage > 1 ? damage : 1;
	},
	calcExp: function(attacker, defender, damage) {
		var exp = damage < 30 ? damage : 30;
		var level_diff = attacker.attr.current.level - defender.attr.current.level;
		if (level_diff > 3) {
			exp = ~~(exp / 2);
		} else if (level_diff < -3) {
			exp *= 2;
		} else {
			// normal
		}
		return exp >= 5 ? exp : 5;
	},
	// get all objects on this point
	// including map
	getChilds: function(x, y) {
		var units = [];
		for (var i = 0; i < this.childNodes.length; i++) {
			var node = this.childNodes[i];
			if (node.x <= x && x <= node.x + node.width && 
				node.y <= y && y <= node.y + node.height) {
				units.push(node);
			}
		}
		return units;
	},
	getUnitByLoc: function(x, y) {
		var i = MAP.x2i(x);
		var j = MAP.y2j(y);
		return this.getUnitByIndex(i, j);
	},

	// get only units on this point
	getUnitByIndex: function(i, j, side) {
		for (var a = 0; a < this.unit_layer.childNodes.length; a++) {
			var node = this.unit_layer.childNodes[a];
			if (node.i == i && node.j == j && node.classname === "Unit" && 
				(side === undefined || node.side === side)) {
					return node;
			}
		}
		return null;
	},
	// is there a unit specific unit
	hitUnit: function(i, j, side) {
		var unit = this.getUnitByIndex(i, j, side);
		if (unit !== null) {
			return true;
		}
		return false;
	}, 
	getShadeByLoc: function(x, y, type) {
		var i = MAP.x2i(x);
		var j = MAP.y2j(y);
		return this.getShadeByIndex(i, j, type);
	},
	getShadeByIndex: function(i, j, type) {
		for (var a = 0; a < this.effect_layer.childNodes.length; a++) {
			var child = this.effect_layer.childNodes[a];
			for (var b = 0; b < child.childNodes.length; b++) {
				var node = child.childNodes[b];
				if (node.i == i && node.j == j && 
					(!type || node.type == type)) {
					return node;
				}
			}
		}
		return null;
	},
	onUnitSelect: function(unit) {
		if (unit.side == CONSTS.side.PLAYER) {
			if (unit.canMove()) {
				this.actionStart(unit);
			} else {
				console.log("This unit can not move!");
			}
		} else if (unit.side == CONSTS.side.ENEMY) {
			this.showInfoBox(unit);
		}
	},
	_noop: function(){
	}
});

// ---------------------
// Game Main
// ---------------------
window.onload = function(){
	CONSTS = new Consts();
	CONFIG = new Config();
	CONFIG.load(function(){
		GAME = new Core(CONFIG.get(["system", "width"]), CONFIG.get(["system", "height"]));
		GAME.fps = 60;

		if (DEBUG) {
			STAT = new Stats();
			document.getElementById("containerStats").appendChild(STAT.getDomElement());
			GAME.addEventListener('enterframe', function(){
				STAT.update();
			});
		}

		GAME.preload(CONFIG.get(["image"]));
		GAME.preload(CONFIG.get(["sound"]));
		GAME.onload = function(){
			BATTLE = new BattleScene();
			GAME.pushScene(BATTLE);
			BATTLE.battleStart();
		};
		GAME.start();
	});
};
