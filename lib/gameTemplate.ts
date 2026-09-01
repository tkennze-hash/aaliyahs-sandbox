export interface GameConfig {
  playerColor: string;
  bgColor: string;
  groundColor: string;
  speed: number;
  jumpForce: number;
  gravity: number;
  coins: boolean;
  enemies: boolean;
  platforms: number;
  theme: string;
}

export const defaultConfig: GameConfig = {
  playerColor: "0x00ff88",
  bgColor: "0x1a1a4e",
  groundColor: "0x5c3d1e",
  speed: 180,
  jumpForce: 380,
  gravity: 500,
  coins: true,
  enemies: false,
  platforms: 3,
  theme: "space",
};

export function buildGameHTML(config: GameConfig): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#000; overflow:hidden; }
canvas { display:block; image-rendering:pixelated; image-rendering:crisp-edges; }
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>
<script>
const keys = { LEFT:false, RIGHT:false, UP:false };
let cfg = ${JSON.stringify(config)};

window.addEventListener('message', (e) => {
  if (e.data.type === 'KEYDOWN') keys[e.data.key] = true;
  if (e.data.type === 'KEYUP')   keys[e.data.key] = false;
  if (e.data.type === 'UPDATE_CONFIG') {
    cfg = e.data.config;
    restartGame();
  }
});

let game;

function makeConfig() {
  return {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#' + cfg.bgColor.replace('0x',''),
    physics: { default:'arcade', arcade:{ gravity:{y: cfg.gravity}, debug:false } },
    scene: { preload, create, update }
  };
}

function startGame() {
  game = new Phaser.Game(makeConfig());
}

function restartGame() {
  if (game) { game.destroy(true); }
  setTimeout(startGame, 50);
}

let player, cursors, platforms, coinGroup, enemyGroup, scoreText, score;

function preload() {}

function create() {
  score = 0;
  const W = this.scale.width;
  const H = this.scale.height;

  // Ground
  platforms = this.physics.add.staticGroup();
  const ground = this.add.rectangle(W/2, H - 16, W, 32, parseInt(cfg.groundColor));
  this.physics.add.existing(ground, true);
  platforms.add(ground);

  // Extra platforms
  const platPositions = [
    {x: W*0.25, y: H*0.6, w: 80},
    {x: W*0.65, y: H*0.45, w: 80},
    {x: W*0.4,  y: H*0.3,  w: 80},
  ];
  for (let i = 0; i < Math.min(cfg.platforms, platPositions.length); i++) {
    const p = platPositions[i];
    const plat = this.add.rectangle(p.x, p.y, p.w, 12, parseInt(cfg.groundColor));
    this.physics.add.existing(plat, true);
    platforms.add(plat);
  }

  // Player (pixel block)
  player = this.add.rectangle(60, H - 80, 16, 24, parseInt(cfg.playerColor));
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // Coins
  coinGroup = this.physics.add.staticGroup();
  if (cfg.coins) {
    const coinSpots = [
      {x: W*0.25, y: H*0.6 - 20},
      {x: W*0.65, y: H*0.45 - 20},
      {x: W*0.4,  y: H*0.3 - 20},
      {x: W*0.15, y: H - 60},
      {x: W*0.85, y: H - 60},
    ];
    coinSpots.forEach(({x,y}) => {
      const coin = this.add.circle(x, y, 6, 0xFFD700);
      this.physics.add.existing(coin, true);
      coinGroup.add(coin);
    });
    this.physics.add.overlap(player, coinGroup, (_, coin) => {
      coin.destroy();
      score += 10;
      scoreText.setText('★ ' + score);
    });
  }

  // Enemies
  enemyGroup = this.physics.add.group();
  if (cfg.enemies) {
    const enemy = this.add.rectangle(W * 0.7, H - 80, 16, 16, 0xff4444);
    this.physics.add.existing(enemy);
    enemy.body.setCollideWorldBounds(true);
    enemy.body.setBounce(1, 0);
    enemy.body.setVelocityX(-80);
    enemyGroup.add(enemy);
    this.physics.add.collider(enemy, platforms);
    this.physics.add.overlap(player, enemyGroup, () => {
      player.body.setVelocityY(-300);
      score = Math.max(0, score - 5);
      scoreText.setText('★ ' + score);
    });
  }

  // Score
  scoreText = this.add.text(8, 8, '★ 0', {
    fontSize: '10px',
    fontFamily: '"Press Start 2P", monospace',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4
  });
  scoreText.setDepth(10);
}

function update() {
  if (!player || !player.body) return;
  const speed = cfg.speed;
  const jump  = cfg.jumpForce;

  if (keys.LEFT) {
    player.body.setVelocityX(-speed);
  } else if (keys.RIGHT) {
    player.body.setVelocityX(speed);
  } else {
    player.body.setVelocityX(0);
  }

  if (keys.UP && player.body.blocked.down) {
    player.body.setVelocityY(-jump);
  }
}

startGame();
</script>
</body>
</html>`;
}
