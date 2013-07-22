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
