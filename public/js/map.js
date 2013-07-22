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

