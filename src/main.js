const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const coinsEl = document.querySelector("#coins");
const startScreen = document.querySelector("#startScreen");
const gameOverScreen = document.querySelector("#gameOverScreen");
const finalStats = document.querySelector("#finalStats");
const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const pauseBtn = document.querySelector("#pauseBtn");

const state = {
  running: false,
  paused: false,
  over: false,
  width: 0,
  height: 0,
  scale: 1,
  lastTime: 0,
  speed: 420,
  distance: 0,
  score: 0,
  coins: 0,
  spawnTimer: 0,
  coinTimer: 0,
  festivalPulse: 0,
  obstacles: [],
  coinItems: [],
  player: {
    lane: 1,
    targetLane: 1,
    y: 0,
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    invincibleTimer: 0
  }
};

const lanes = [-1, 0, 1];
const laneWidthRatio = 0.18;
const groundRatio = 0.78;
const gravity = 2300;
const jumpPower = 850;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * dpr);
  canvas.height = Math.floor(state.height * dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.scale = Math.min(state.width / 390, state.height / 780);
  state.player.y = groundY();
}

function groundY() {
  return state.height * groundRatio;
}

function laneX(laneIndex, depth = 1) {
  const lane = lanes[laneIndex];
  const spread = state.width * laneWidthRatio * depth;
  return state.width / 2 + lane * spread;
}

function resetGame() {
  state.running = true;
  state.paused = false;
  state.over = false;
  state.lastTime = performance.now();
  state.speed = 420;
  state.distance = 0;
  state.score = 0;
  state.coins = 0;
  state.spawnTimer = 0.8;
  state.coinTimer = 0.4;
  state.festivalPulse = 0;
  state.obstacles = [];
  state.coinItems = [];
  Object.assign(state.player, {
    lane: 1,
    targetLane: 1,
    y: groundY(),
    vy: 0,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    invincibleTimer: 0
  });
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseBtn.textContent = "II";
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  state.over = true;
  finalStats.textContent = `Score ${state.score} | Coins ${state.coins}`;
  gameOverScreen.classList.remove("hidden");
}

function togglePause() {
  if (!state.running || state.over) return;
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? ">" : "II";
  if (!state.paused) {
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

function moveLane(delta) {
  if (!state.running || state.paused) return;
  state.player.targetLane = clamp(state.player.targetLane + delta, 0, 2);
}

function jump() {
  const player = state.player;
  if (!state.running || state.paused || player.jumping || player.sliding) return;
  player.jumping = true;
  player.vy = -jumpPower;
}

function slide() {
  const player = state.player;
  if (!state.running || state.paused || player.jumping) return;
  player.sliding = true;
  player.slideTimer = 0.55;
}

function spawnObstacle() {
  const types = ["lamp", "arch", "drum"];
  const type = types[Math.floor(Math.random() * types.length)];
  state.obstacles.push({
    type,
    lane: Math.floor(Math.random() * 3),
    z: 1.15,
    hit: false
  });
}

function spawnCoinLine() {
  const lane = Math.floor(Math.random() * 3);
  for (let i = 0; i < 4; i += 1) {
    state.coinItems.push({
      lane,
      z: 1.05 + i * 0.16,
      collected: false
    });
  }
}

function update(dt) {
  const player = state.player;
  state.distance += state.speed * dt;
  state.speed += dt * 9;
  state.festivalPulse += dt * 4;
  state.score = Math.floor(state.distance / 7);

  player.lane = lerp(player.lane, player.targetLane, Math.min(1, dt * 10));
  if (player.jumping) {
    player.y += player.vy * dt;
    player.vy += gravity * dt;
    if (player.y >= groundY()) {
      player.y = groundY();
      player.vy = 0;
      player.jumping = false;
    }
  }
  if (player.sliding) {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) {
      player.sliding = false;
    }
  }
  player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);

  state.spawnTimer -= dt;
  state.coinTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = Math.max(0.58, 1.24 - state.distance / 9000) + Math.random() * 0.35;
  }
  if (state.coinTimer <= 0) {
    spawnCoinLine();
    state.coinTimer = 1.3 + Math.random() * 0.9;
  }

  for (const obstacle of state.obstacles) {
    obstacle.z -= dt * state.speed / 900;
  }
  for (const coin of state.coinItems) {
    coin.z -= dt * state.speed / 900;
  }

  handleCollisions();
  state.obstacles = state.obstacles.filter((item) => item.z > -0.12 && !item.hit);
  state.coinItems = state.coinItems.filter((item) => item.z > -0.12 && !item.collected);
  scoreEl.textContent = state.score.toString();
  coinsEl.textContent = state.coins.toString();
}

function handleCollisions() {
  const playerLane = Math.round(state.player.lane);
  for (const coin of state.coinItems) {
    if (coin.collected) continue;
    if (coin.lane === playerLane && coin.z < 0.16 && coin.z > -0.02 && !state.player.sliding) {
      coin.collected = true;
      state.coins += 1;
      state.score += 10;
    }
  }

  for (const obstacle of state.obstacles) {
    if (obstacle.hit || obstacle.lane !== playerLane || obstacle.z > 0.13 || obstacle.z < -0.04) continue;
    const clearedByJump = obstacle.type === "drum" && state.player.jumping;
    const clearedBySlide = obstacle.type === "arch" && state.player.sliding;
    if (!clearedByJump && !clearedBySlide && state.player.invincibleTimer <= 0) {
      obstacle.hit = true;
      endGame();
      return;
    }
  }
}

function draw() {
  drawSky();
  drawTempleBackdrop();
  drawTrack();
  drawFestivalDecor();

  const sorted = [...state.coinItems, ...state.obstacles].sort((a, b) => b.z - a.z);
  for (const item of sorted) {
    if ("collected" in item) drawCoin(item);
    else drawObstacle(item);
  }

  drawPlayer();
  if (state.paused) drawPauseShade();
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, state.height);
  sky.addColorStop(0, "#08201d");
  sky.addColorStop(0.42, "#1f5f53");
  sky.addColorStop(1, "#3f2a18");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "rgba(244, 201, 93, 0.22)";
  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 97 + state.distance * 0.07) % (state.width + 80)) - 40;
    const y = 70 + (i % 5) * 36;
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTempleBackdrop() {
  const baseY = state.height * 0.44;
  drawGopuram(state.width * 0.5, baseY, Math.min(state.width * 0.34, 180), "#b84331");
  drawCoconutTrees(0.12, baseY + 35);
  drawCoconutTrees(0.88, baseY + 35);
}

function drawGopuram(x, y, w, color) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i += 1) {
    const tierW = w * (1 - i * 0.13);
    const tierH = 24 + i * 4;
    ctx.fillStyle = i % 2 ? "#d9a84f" : color;
    ctx.fillRect(-tierW / 2, -i * tierH, tierW, tierH - 3);
    ctx.fillStyle = "#fff3c4";
    for (let j = -2; j <= 2; j += 1) {
      ctx.fillRect((j * tierW) / 6 - 4, -i * tierH + 7, 8, 9);
    }
  }
  ctx.fillStyle = "#f4c95d";
  ctx.beginPath();
  ctx.moveTo(0, -154);
  ctx.lineTo(16, -122);
  ctx.lineTo(-16, -122);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCoconutTrees(ratioX, baseY) {
  const x = state.width * ratioX;
  ctx.strokeStyle = "#4d2e1e";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x + (ratioX < 0.5 ? 20 : -20), baseY - 80, x, baseY - 150);
  ctx.stroke();

  ctx.fillStyle = "#1e6e45";
  for (let i = 0; i < 7; i += 1) {
    ctx.save();
    ctx.translate(x, baseY - 154);
    ctx.rotate((Math.PI * 2 * i) / 7 + Math.sin(state.festivalPulse) * 0.05);
    ctx.beginPath();
    ctx.ellipse(36, 0, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTrack() {
  const topY = state.height * 0.45;
  const bottomY = state.height;
  const center = state.width / 2;
  const trackTop = state.width * 0.18;
  const trackBottom = state.width * 0.95;

  const path = ctx.createLinearGradient(0, topY, 0, bottomY);
  path.addColorStop(0, "#7f653b");
  path.addColorStop(1, "#2d2018");
  ctx.fillStyle = path;
  ctx.beginPath();
  ctx.moveTo(center - trackTop / 2, topY);
  ctx.lineTo(center + trackTop / 2, topY);
  ctx.lineTo(center + trackBottom / 2, bottomY);
  ctx.lineTo(center - trackBottom / 2, bottomY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 245, 196, 0.35)";
  ctx.lineWidth = 3;
  for (const lane of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(center + lane * trackTop, topY);
    ctx.lineTo(center + lane * trackBottom, bottomY);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255, 245, 196, 0.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i += 1) {
    const p = (state.distance * 0.002 + i / 16) % 1;
    const y = lerp(topY, bottomY, p);
    const w = lerp(trackTop, trackBottom, p);
    ctx.beginPath();
    ctx.moveTo(center - w / 2, y);
    ctx.lineTo(center + w / 2, y);
    ctx.stroke();
  }
}

function drawFestivalDecor() {
  const y = state.height * 0.36;
  ctx.strokeStyle = "rgba(244, 201, 93, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.quadraticCurveTo(state.width / 2, y + 30, state.width, y);
  ctx.stroke();

  for (let i = 0; i < 10; i += 1) {
    const x = (state.width / 9) * i;
    const drop = 14 + Math.sin(state.festivalPulse + i) * 4;
    ctx.fillStyle = i % 2 ? "#f4c95d" : "#c6422f";
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + 10, y + drop);
    ctx.lineTo(x - 10, y + drop);
    ctx.closePath();
    ctx.fill();
  }
}

function screenPoint(lane, z) {
  const depth = 1 - z;
  const topY = state.height * 0.45;
  const y = lerp(topY, state.height * 0.83, depth);
  const x = laneX(lane, depth);
  const scale = lerp(0.28, 1.1, depth);
  return { x, y, scale };
}

function drawObstacle(obstacle) {
  const p = screenPoint(obstacle.lane, obstacle.z);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.scale, p.scale);
  if (obstacle.type === "lamp") {
    ctx.fillStyle = "#55331d";
    ctx.fillRect(-24, -58, 48, 74);
    ctx.fillStyle = "#f4c95d";
    ctx.beginPath();
    ctx.arc(0, -62, 20 + Math.sin(state.festivalPulse) * 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (obstacle.type === "arch") {
    ctx.strokeStyle = "#c9b99a";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(0, -40, 46, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#c9b99a";
    ctx.fillRect(-55, -40, 18, 72);
    ctx.fillRect(37, -40, 18, 72);
  } else {
    ctx.fillStyle = "#8e4d2f";
    ctx.beginPath();
    ctx.ellipse(0, -22, 42, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f3dfac";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-35, -22);
    ctx.lineTo(35, -22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCoin(coin) {
  const p = screenPoint(coin.lane, coin.z);
  ctx.save();
  ctx.translate(p.x, p.y - 54 * p.scale);
  ctx.scale(p.scale, p.scale);
  ctx.fillStyle = "#f4c95d";
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 20, Math.sin(state.festivalPulse * 2) * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff4bd";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  const player = state.player;
  const x = laneX(player.lane, 1);
  const y = player.y;
  const bodyH = player.sliding ? 44 : 76;
  const bodyW = player.sliding ? 72 : 44;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff1d1";
  ctx.fillRect(-bodyW / 2, -bodyH, bodyW, bodyH);
  ctx.fillStyle = "#d1442e";
  ctx.fillRect(-bodyW / 2, -bodyH + 22, bodyW, 14);
  ctx.fillStyle = "#1f5f53";
  ctx.fillRect(-bodyW / 2, -bodyH + 38, bodyW, 16);

  ctx.fillStyle = "#5f321d";
  ctx.beginPath();
  ctx.arc(0, -bodyH - 18, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4c95d";
  ctx.fillRect(-19, -bodyH - 34, 38, 7);
  ctx.restore();
}

function drawPauseShade() {
  ctx.fillStyle = "rgba(7, 18, 17, 0.52)";
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.fillStyle = "#fffdf5";
  ctx.font = "800 38px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Paused", state.width / 2, state.height / 2);
}

function loop(time) {
  if (!state.running || state.paused) return;
  const dt = Math.min((time - state.lastTime) / 1000, 0.035);
  state.lastTime = time;
  update(dt);
  draw();
  if (state.running) requestAnimationFrame(loop);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

let touchStartX = 0;
let touchStartY = 0;

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") moveLane(-1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") moveLane(1);
  if (event.key === "ArrowUp" || event.key === " ") jump();
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") slide();
  if (event.key.toLowerCase() === "p") togglePause();
});

canvas.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true }
);

canvas.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) moveLane(dx > 0 ? 1 : -1);
    } else if (Math.abs(dy) > 30) {
      if (dy < 0) jump();
      else slide();
    }
  },
  { passive: true }
);

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);
pauseBtn.addEventListener("click", togglePause);

resize();
draw();
