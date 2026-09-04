export interface GameConfig {
  gameType: "platformer" | "catcher" | "dodger" | "painter" | "custom";
  customSceneCode?: string;
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
  gameType: "platformer",
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

const THEME_STYLES: Record<string, { bg: string; ground: string }> = {
  space:   { bg: "0x0a0a2e", ground: "0x6c3baa" },
  ocean:   { bg: "0x0d2137", ground: "0x1a6b8a" },
  lava:    { bg: "0x1a0500", ground: "0xcc3300" },
  forest:  { bg: "0x0a1a00", ground: "0x3d6b21" },
  dungeon: { bg: "0x0d0d0d", ground: "0x555566" },
};

function themeBackgroundJS(theme: string): string {
  switch (theme) {
    case "space": return `
      var g = this.add.graphics();
      for (var i = 0; i < 60; i++) {
        var sx = Math.random() * W, sy = Math.random() * H;
        var sr = Math.random() < 0.15 ? 2 : 1;
        g.fillStyle(0xffffff, 0.5 + Math.random() * 0.5);
        g.fillRect(sx, sy, sr, sr);
      }
      g.setDepth(-1);
      for (var j = 0; j < 8; j++) {
        var star = this.add.rectangle(Math.random()*W, Math.random()*H, 2, 2, 0xffffff);
        star.setDepth(-1);
        this.tweens.add({ targets: star, alpha: 0.1, duration: 800 + Math.random()*800, yoyo: true, repeat: -1, delay: Math.random()*1000 });
      }
    `;
    case "ocean": return `
      for (var w = 0; w < 6; w++) {
        var wy = H * 0.65 + w * 28;
        var wave = this.add.rectangle(W/2, wy, W, 3, 0x44aadd, 0.25 + w * 0.04);
        wave.setDepth(-1);
        this.tweens.add({ targets: wave, x: W/2 + 18, duration: 2200 + w * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: w * 200 });
      }
      for (var b = 0; b < 10; b++) {
        var bub = this.add.circle(Math.random()*W, H - Math.random()*H*0.4, 3 + Math.random()*4, 0x88ccff, 0.3);
        bub.setDepth(-1);
        this.tweens.add({ targets: bub, y: bub.y - 80, alpha: 0, duration: 2000 + Math.random()*2000, repeat: -1, delay: Math.random()*3000 });
      }
    `;
    case "lava": return `
      var glow = this.add.rectangle(W/2, H - 8, W, 20, 0xff4400, 0.5);
      glow.setDepth(-1);
      this.tweens.add({ targets: glow, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
      for (var e = 0; e < 15; e++) {
        var ember = this.add.circle(Math.random()*W, H - Math.random()*60, 2 + Math.random()*3, Math.random() < 0.5 ? 0xff6600 : 0xff2200, 0.7);
        ember.setDepth(-1);
        this.tweens.add({ targets: ember, y: ember.y - 120, alpha: 0, duration: 1500 + Math.random()*1500, repeat: -1, delay: Math.random()*2000 });
      }
      for (var h2 = 0; h2 < 4; h2++) {
        var hline = this.add.rectangle(Math.random()*W, H*0.5 + Math.random()*H*0.3, 1, 40 + Math.random()*40, 0xff8800, 0.08);
        hline.setDepth(-1);
        this.tweens.add({ targets: hline, y: hline.y - 30, alpha: 0, duration: 1000 + Math.random()*800, repeat: -1, delay: Math.random()*1500 });
      }
    `;
    case "forest": return `
      var tg = this.add.graphics();
      var treeCount = Math.ceil(W / 60) + 1;
      for (var t = 0; t < treeCount; t++) {
        var tx = t * 60 + 30;
        tg.fillStyle(0x1a4d00, 0.7); tg.fillTriangle(tx, H*0.55, tx-22, H*0.78, tx+22, H*0.78);
        tg.fillStyle(0x145200, 0.7); tg.fillTriangle(tx, H*0.42, tx-16, H*0.62, tx+16, H*0.62);
        tg.fillStyle(0x5c3d1e, 0.6); tg.fillRect(tx-5, H*0.78, 10, H*0.22);
      }
      tg.setDepth(-2);
      for (var lf = 0; lf < 12; lf++) {
        var leaf = this.add.rectangle(Math.random()*W, Math.random()*H*0.6, 5, 5, 0x44aa00, 0.6);
        leaf.setDepth(-1);
        this.tweens.add({ targets: leaf, y: leaf.y + 120, x: leaf.x + (Math.random()*40-20), alpha: 0, duration: 2000 + Math.random()*2000, repeat: -1, delay: Math.random()*3000 });
      }
    `;
    case "dungeon": return `
      var dg = this.add.graphics();
      var brickW = 40, brickH = 20;
      for (var bx = 0; bx * brickW < W + brickW; bx++) {
        for (var by2 = 0; by2 * brickH < H + brickH; by2++) {
          var offX = (by2 % 2) * (brickW / 2);
          dg.lineStyle(1, 0x333344, 0.5);
          dg.strokeRect(bx * brickW - offX, by2 * brickH, brickW - 1, brickH - 1);
        }
      }
      dg.setDepth(-2);
      var torchPositions = [W*0.15, W*0.5, W*0.85];
      torchPositions.forEach(function(tx2) {
        var torch = this.add.circle(tx2, H * 0.25, 8, 0xff8800, 0.8);
        torch.setDepth(-1);
        this.tweens.add({ targets: torch, alpha: 0.3, scaleX: 1.3, scaleY: 1.3, duration: 200 + Math.random()*200, yoyo: true, repeat: -1 });
        var glow2 = this.add.circle(tx2, H * 0.25, 20, 0xff6600, 0.15);
        glow2.setDepth(-1);
        this.tweens.add({ targets: glow2, alpha: 0.05, duration: 200 + Math.random()*200, yoyo: true, repeat: -1 });
      }, this);
    `;
    default: return "";
  }
}

function platformerScene(themeJS: string): string {
  return `
let player, platforms, coinGroup, enemyGroup, scoreText, score;

function preload() {}

function create() {
  score = 0;
  const W = this.scale.width;
  const H = this.scale.height;
  ${themeJS}
  platforms = this.physics.add.staticGroup();
  const ground = this.add.rectangle(W/2, H - 16, W, 32, parseInt(cfg.groundColor));
  this.physics.add.existing(ground, true);
  platforms.add(ground);
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
  player = this.add.rectangle(60, H - 80, 16, 24, parseInt(cfg.playerColor));
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);
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
      coin.destroy(); score += 10; scoreText.setText('★ ' + score);
    });
  }
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
      score = Math.max(0, score - 5); scoreText.setText('★ ' + score);
    });
  }
  scoreText = this.add.text(8, 8, '★ 0', { fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 4 });
  scoreText.setDepth(10);
}

function update() {
  if (!player || !player.body) return;
  const speed = cfg.speed;
  if (keys.LEFT)       { player.body.setVelocityX(-speed); }
  else if (keys.RIGHT) { player.body.setVelocityX(speed); }
  else                 { player.body.setVelocityX(0); }
  if (keys.UP && player.body.blocked.down) { player.body.setVelocityY(-cfg.jumpForce); }
}
`;
}

function catcherScene(themeJS: string): string {
  return `
let player, coinGroup, enemyGroup, scoreText, score, sc;

function preload() {}

function create() {
  sc = this;
  score = 0;
  const W = this.scale.width;
  const H = this.scale.height;
  ${themeJS}
  // Ground line
  const ground = this.add.rectangle(W/2, H - 4, W, 8, parseInt(cfg.groundColor));
  this.physics.add.existing(ground, true);
  // Paddle player
  player = this.add.rectangle(W/2, H - 28, 72, 16, parseInt(cfg.playerColor));
  this.physics.add.existing(player);
  player.body.setImmovable(true);
  player.body.setAllowGravity(false);
  player.body.setCollideWorldBounds(true);
  coinGroup = this.physics.add.group();
  enemyGroup = this.physics.add.group();
  scoreText = this.add.text(8, 8, '★ 0', { fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 4 });
  scoreText.setDepth(10);
  this.add.text(W/2, 8, 'CATCHER', { fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa' }).setOrigin(0.5, 0).setDepth(10);
  this.time.addEvent({ delay: 1000, callback: spawnCoin, callbackScope: this, loop: true });
  if (cfg.enemies) {
    this.time.addEvent({ delay: 1800, callback: spawnEnemy, callbackScope: this, loop: true });
  }
  this.physics.add.overlap(player, coinGroup, (_, coin) => {
    coin.destroy(); score += 10; scoreText.setText('★ ' + score);
  });
  this.physics.add.overlap(player, enemyGroup, (_, enemy) => {
    enemy.destroy(); score = Math.max(0, score - 5); scoreText.setText('★ ' + score);
  });
}

function spawnCoin() {
  const W = sc.scale.width;
  const x = 20 + Math.random() * (W - 40);
  const coin = sc.add.circle(x, -10, 8, 0xFFD700);
  sc.physics.add.existing(coin);
  coin.body.setAllowGravity(false);
  coin.body.setVelocityY(110 + Math.random() * 70);
  coinGroup.add(coin);
}

function spawnEnemy() {
  const W = sc.scale.width;
  const x = 20 + Math.random() * (W - 40);
  const enemy = sc.add.rectangle(x, -10, 16, 16, 0xff4444);
  sc.physics.add.existing(enemy);
  enemy.body.setAllowGravity(false);
  enemy.body.setVelocityY(130 + Math.random() * 80);
  enemyGroup.add(enemy);
}

function update() {
  if (!player || !player.body) return;
  const speed = cfg.speed;
  if (keys.LEFT)       { player.body.setVelocityX(-speed); }
  else if (keys.RIGHT) { player.body.setVelocityX(speed); }
  else                 { player.body.setVelocityX(0); }
  const H = this.scale.height;
  coinGroup.children.entries.slice().forEach(c => { if (c.y > H + 20) c.destroy(); });
  enemyGroup.children.entries.slice().forEach(e => { if (e.y > H + 20) e.destroy(); });
}
`;
}

function dodgerScene(themeJS: string): string {
  return `
let player, platforms, enemyGroup, scoreText, score, sc;

function preload() {}

function create() {
  sc = this;
  score = 0;
  const W = this.scale.width;
  const H = this.scale.height;
  ${themeJS}
  platforms = this.physics.add.staticGroup();
  const ground = this.add.rectangle(W/2, H - 16, W, 32, parseInt(cfg.groundColor));
  this.physics.add.existing(ground, true);
  platforms.add(ground);
  player = this.add.rectangle(W/2, H - 60, 16, 24, parseInt(cfg.playerColor));
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);
  enemyGroup = this.physics.add.group();
  scoreText = this.add.text(8, 8, '⏱ 0', { fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: '#ffffff', stroke: '#000000', strokeThickness: 4 });
  scoreText.setDepth(10);
  this.add.text(W/2, 8, 'DODGER', { fontSize: '7px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa' }).setOrigin(0.5, 0).setDepth(10);
  const baseDelay = cfg.enemies ? 700 : 1000;
  this.time.addEvent({ delay: baseDelay, callback: spawnObstacle, callbackScope: this, loop: true });
  this.time.addEvent({ delay: 500, callback: () => { score += 1; scoreText.setText('⏱ ' + score); }, loop: true });
  this.physics.add.overlap(player, enemyGroup, (_, enemy) => {
    enemy.destroy(); score = Math.max(0, score - 10); scoreText.setText('⏱ ' + score);
  });
}

function spawnObstacle() {
  const W = sc.scale.width;
  const x = 20 + Math.random() * (W - 40);
  const size = 10 + Math.random() * 10;
  const obstacle = sc.add.rectangle(x, -10, size, size, 0xff4444);
  sc.physics.add.existing(obstacle);
  obstacle.body.setAllowGravity(false);
  obstacle.body.setVelocityY(160 + Math.random() * 120);
  enemyGroup.add(obstacle);
}

function update() {
  if (!player || !player.body) return;
  const speed = cfg.speed;
  if (keys.LEFT)       { player.body.setVelocityX(-speed); }
  else if (keys.RIGHT) { player.body.setVelocityX(speed); }
  else                 { player.body.setVelocityX(0); }
  const H = this.scale.height;
  enemyGroup.children.entries.slice().forEach(e => { if (e.y > H + 20) e.destroy(); });
}
`;
}

function painterScene(themeJS: string): string {
  return `
let scoreText, score, activeColor, swatchObjs;

function preload() {}

function create() {
  score = 0;
  const W = this.scale.width;
  const H = this.scale.height;
  ${themeJS}

  const PALETTE = [
    parseInt(cfg.playerColor),
    0xff6b6b, 0xfdcb6e, 0xa29bfe, 0x74b9ff, 0x55efc4, 0xfd79a8, 0xe17055,
  ];
  activeColor = PALETTE[0];

  // Swatch bar height
  const SWATCH_H = 44;
  const GRID_Y = 28;
  const GRID_H = H - GRID_Y - SWATCH_H - 6;
  const COLS = 8;
  const ROWS = 6;
  const cellW = W / COLS;
  const cellH = GRID_H / ROWS;
  const TOTAL = COLS * ROWS;

  // Draw grid
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * cellW + cellW / 2;
      const y = GRID_Y + row * cellH + cellH / 2;
      const cell = this.add.rectangle(x, y, cellW - 2, cellH - 2, 0x1a1a2e);
      cell.setStrokeStyle(1, 0x444466);
      cell.setInteractive();
      cell.on('pointerdown', function() {
        cell.setFillStyle(activeColor);
        score++;
        scoreText.setText('★ ' + score + ' / ' + TOTAL);
        if (score >= TOTAL) {
          scoreText.setText('🎉 DONE!');
        }
      });
    }
  }

  // Color swatches
  swatchObjs = [];
  const swatchSize = Math.min(36, (W - 8) / PALETTE.length - 4);
  const swatchY = H - SWATCH_H / 2;
  const totalSw = PALETTE.length * (swatchSize + 4);
  const swStartX = (W - totalSw) / 2 + swatchSize / 2;

  PALETTE.forEach(function(col, i) {
    const sx = swStartX + i * (swatchSize + 4);
    const sw = this.add.rectangle(sx, swatchY, swatchSize, swatchSize, col);
    sw.setStrokeStyle(3, col === activeColor ? 0xffffff : 0x000000);
    sw.setDepth(10);
    sw.setInteractive();
    sw.on('pointerdown', function() {
      activeColor = col;
      swatchObjs.forEach(function(s, j) {
        s.setStrokeStyle(3, j === i ? 0xffffff : 0x000000);
      });
    });
    swatchObjs.push(sw);
  }, this);

  scoreText = this.add.text(8, 8, '★ 0 / ' + TOTAL, {
    fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
    color: '#ffffff', stroke: '#000000', strokeThickness: 3,
  });
  scoreText.setDepth(10);

  this.add.text(W / 2, 8, 'PAINTER', {
    fontSize: '6px', fontFamily: '"Press Start 2P", monospace', color: '#aaaaaa',
  }).setOrigin(0.5, 0).setDepth(10);
}

function update() {}
`;
}

export function buildCustomGameHTML(sceneCode: string, bitMode: "8" | "16" | "hd" = "8"): string {
  let bitModeCSS: string;
  let phaserType: number;

  if (bitMode === "hd") {
    bitModeCSS = `canvas { image-rendering: auto; }`;
    phaserType = 0; // AUTO — tries WebGL first, falls back to Canvas
  } else if (bitMode === "16") {
    bitModeCSS = `canvas { image-rendering: auto; filter: saturate(1.3) brightness(1.06); }`;
    phaserType = 1;
  } else {
    bitModeCSS = `canvas { image-rendering: pixelated; image-rendering: crisp-edges; filter: contrast(1.15) saturate(0.75); }
       body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(transparent 0px, rgba(0,0,0,0.07) 1px, transparent 2px); pointer-events: none; z-index: 999; }`;
    phaserType = 1;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#1a1a2e; overflow:hidden; }
${bitModeCSS}
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>
<script>
const keys = { LEFT:false, RIGHT:false, UP:false };
window.addEventListener('message', (e) => {
  if (e.data.type === 'KEYDOWN') keys[e.data.key] = true;
  if (e.data.type === 'KEYUP')   keys[e.data.key] = false;
});

${sceneCode}

new Phaser.Game({
  type: ${phaserType},
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1a2e',
  physics: { default:'arcade', arcade:{ gravity:{y:500}, debug:false } },
  scene: { preload, create, update }
});
</script>
</body>
</html>`;
}

export function buildGameHTML(config: GameConfig, bitMode: "8" | "16" | "hd" = "8"): string {
  const themeStyle = THEME_STYLES[config.theme] ?? THEME_STYLES.space;
  const mergedConfig = {
    ...config,
    bgColor: themeStyle.bg,
    groundColor: themeStyle.ground,
  };

  const bitModeCSS = bitMode === "hd"
    ? `canvas { image-rendering: auto; }`
    : bitMode === "16"
    ? `canvas { image-rendering: auto; filter: saturate(1.3) brightness(1.06); }`
    : `canvas { image-rendering: pixelated; image-rendering: crisp-edges; filter: contrast(1.15) saturate(0.75); }
       body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(transparent 0px, rgba(0,0,0,0.07) 1px, transparent 2px); pointer-events: none; z-index: 999; }`;

  const themeJS = themeBackgroundJS(config.theme);

  const gameType = config.gameType ?? "platformer";
  let sceneCode: string;
  if (gameType === "catcher") {
    sceneCode = catcherScene(themeJS);
  } else if (gameType === "dodger") {
    sceneCode = dodgerScene(themeJS);
  } else if (gameType === "painter") {
    sceneCode = painterScene(themeJS);
  } else {
    sceneCode = platformerScene(themeJS);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#000; overflow:hidden; }
${bitModeCSS}
</style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"></script>
<script>
const keys = { LEFT:false, RIGHT:false, UP:false };
let cfg = ${JSON.stringify(mergedConfig)};

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
    type: 1,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#' + cfg.bgColor.replace('0x',''),
    physics: { default:'arcade', arcade:{ gravity:{y: cfg.gravity}, debug:false } },
    scene: { preload, create, update }
  };
}

function startGame() { game = new Phaser.Game(makeConfig()); }
function restartGame() { if (game) { game.destroy(true); } setTimeout(startGame, 50); }

${sceneCode}

startGame();
</script>
</body>
</html>`;
}
