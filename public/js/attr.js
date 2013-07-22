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

