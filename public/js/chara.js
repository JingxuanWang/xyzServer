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



