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
