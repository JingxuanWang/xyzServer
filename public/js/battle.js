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
		atk_btn.image = GAME.assets["public/images/menu/atk.png"]; 
		atk_btn.moveBy(- 24 - 32, 0);
		atk_btn.addEventListener(enchant.Event.TOUCH_END, function(){
			self.removeMenu();
			self.removeShades();
			self.showAtkRng(unit);
		});

		var mov_btn = new Sprite(32, 32);
		mov_btn.image = GAME.assets["public/images/menu/mov.png"];
		mov_btn.moveBy(24, 0);
		mov_btn.addEventListener(enchant.Event.TOUCH_END, function(){
			self.removeMenu();
			self.removeShades();
			self.actionEnd();
		});

		var ret_btn = new Sprite(32, 32);
		ret_btn.image = GAME.assets["public/images/menu/ret.png"];
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

