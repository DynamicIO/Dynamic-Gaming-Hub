// Neon Pong – Viral Edition
// High-level structure: state, input, audio, rendering, UI, persistence, PWA

const GAME_VERSION = '1.0.1';

// ---------- Utilities ----------
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => performance.now();

// Storage helpers
const storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

// ---------- Audio (WebAudio lightweight) ----------
class SimpleAudio {
  constructor() {
    this.enabled = storage.get('audio.enabled', true);
    this.volume = storage.get('audio.volume', 0.5);
    /** @type {AudioContext | null} */
    this.ctx = null;
  }
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return this.ctx;
  }
  setEnabled(on) { this.enabled = on; storage.set('audio.enabled', on); }
  setVolume(v) { this.volume = v; storage.set('audio.volume', v); }
  blip(type = 'sine', frequency = 520, durationMs = 70) {
    if (!this.enabled) return;
    const ctx = this.ensure(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = this.volume * 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    const endTime = ctx.currentTime + durationMs / 1000;
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
    osc.stop(endTime);
  }
  tick() { this.blip('triangle', 700, 35); }
  wall() { this.blip('square', 310, 50); }
  score() { this.blip('sawtooth', 180, 240); }
}

const audio = new SimpleAudio();

// ---------- Game State ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const deviceScale = window.devicePixelRatio || 1;
function resizeCanvas() {
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = Math.floor(cssWidth * deviceScale);
  canvas.height = Math.floor(cssHeight * deviceScale);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const game = {
  running: false,
  paused: false,
  lastTime: 0,
  leftScore: 0,
  rightScore: 0,
  coins: storage.get('meta.coins', 0),
  winTarget: 7,
  difficulty: storage.get('settings.difficulty', 'normal'),
  theme: storage.get('settings.theme', 'cyan'),
  selectedTrail: storage.get('cosmetic.trail', 'cyan'),
  particles: [],
  trail: [],
  // dynamic playfield and objects set in reset()
};

function difficultyToAiSpeed(value) {
  switch (value) {
    case 'easy': return 4.5;
    case 'normal': return 6.5;
    case 'hard': return 8.5;
    case 'insane': return 12.5;
    default: return 6.5;
  }
}

// Rally acceleration per second by difficulty (fractional growth rate)
function difficultyToAccel(value) {
  switch (value) {
    case 'easy': return 0.08;   // +8%/s
    case 'normal': return 0.12; // +12%/s
    case 'hard': return 0.16;   // +16%/s
    case 'insane': return 0.22; // +22%/s
    default: return 0.12;
  }
}

function maxBallSpeed() {
  // Cap scales with canvas size; ~3.6x the base serve speed
  return Math.min(canvas.width, canvas.height) * 0.02;
}

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
  const w = canvas.width, h = canvas.height;
  game.ballX = w / 2;
  game.ballY = h / 2;
  const speed = Math.min(w, h) * 0.0055;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // slight randomness
  game.ballVX = Math.cos(angle) * speed * direction;
  game.ballVY = Math.sin(angle) * speed;
  game.trail.length = 0;
}

function reset() {
  const w = canvas.width, h = canvas.height;
  game.paddleWidth = Math.max(10, Math.floor(w * 0.012));
  game.paddleHeight = Math.max(60, Math.floor(h * 0.18));
  game.ballRadius = Math.max(6, Math.floor(Math.min(w, h) * 0.01));
  game.leftY = h / 2 - game.paddleHeight / 2;
  game.rightY = h / 2 - game.paddleHeight / 2;
  game.aiSpeed = difficultyToAiSpeed(game.difficulty) * deviceScale;
  resetBall();
}

reset();

// ---------- Input ----------
const input = { up: false, down: false, pointerY: null, usingPointer: false };
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
  if (e.code === 'Space') { if (game.running) togglePause(); }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
});

canvas.addEventListener('pointerdown', (e) => {
  input.usingPointer = true;
  input.pointerY = e.offsetY * deviceScale;
});
canvas.addEventListener('pointermove', (e) => {
  if (!input.usingPointer) return;
  input.pointerY = e.offsetY * deviceScale;
});
canvas.addEventListener('pointerup', () => { input.usingPointer = false; });

// ---------- Particles ----------
function spawnParticles(x, y, color, amount = 12) {
  for (let i = 0; i < amount; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color,
    });
  }
}

function updateParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= 0.9 * dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
}

// ---------- Game Loop ----------
function startGame() {
  document.getElementById('modalMain').close();
  document.getElementById('statusText').textContent = 'Good luck!';
  game.running = true;
  game.paused = false;
  game.leftScore = 0;
  game.rightScore = 0;
  reset();
}

function togglePause() {
  if (!game.running) return;
  game.paused = !game.paused;
  document.getElementById('statusText').textContent = game.paused ? 'Paused' : '';
}

function aiFollow(dtScale) {
  // Simple predictive AI: move towards ballY
  const targetY = game.ballY - game.paddleHeight / 2;
  const step = game.aiSpeed * dtScale;
  if (Math.abs(targetY - game.rightY) < step) {
    game.rightY = targetY;
  } else {
    game.rightY += targetY > game.rightY ? step : -step;
  }
  const maxY = canvas.height - game.paddleHeight;
  game.rightY = clamp(game.rightY, 0, maxY);
}

function step(dt) {
  if (!game.running || game.paused) return;

  // High-frequency physics substeps for smoothness and anti-tunneling
  const maxY = canvas.height - game.paddleHeight;
  const SUB_DT = 1 / 240;
  let remaining = dt;
  while (remaining > 0) {
    const d = remaining > SUB_DT ? SUB_DT : remaining;

    // Player paddle
    if (input.usingPointer && input.pointerY != null) {
      game.leftY = clamp(input.pointerY - game.paddleHeight / 2, 0, maxY);
    } else {
      const speed = 10 * deviceScale * 60 * d;
      if (input.up) game.leftY -= speed;
      if (input.down) game.leftY += speed;
      game.leftY = clamp(game.leftY, 0, maxY);
    }

    // AI
    aiFollow(60 * d);

    // Accelerate ball this rally
    {
      const speed = Math.hypot(game.ballVX, game.ballVY);
      if (speed > 0) {
        const accel = difficultyToAccel(game.difficulty);
        const target = Math.min(speed * (1 + accel * d), maxBallSpeed());
        const scale = target / speed;
        game.ballVX *= scale;
        game.ballVY *= scale;
      }
    }

    // Integrate
    game.ballX += game.ballVX * d * 60;
    game.ballY += game.ballVY * d * 60;

    // Collisions
    const br = game.ballRadius;
    if (game.ballY - br <= 0) { game.ballY = br; game.ballVY *= -1; audio.wall(); spawnParticles(game.ballX, game.ballY, '#00f0ff'); }
    if (game.ballY + br >= canvas.height) { game.ballY = canvas.height - br; game.ballVY *= -1; audio.wall(); spawnParticles(game.ballX, game.ballY, '#ff2bd9'); }

    const paddleInset = 16 * deviceScale;
    const lpX = paddleInset, lpY = game.leftY, lpW = game.paddleWidth, lpH = game.paddleHeight;
    const rpX = canvas.width - paddleInset - game.paddleWidth, rpY = game.rightY, rpW = game.paddleWidth, rpH = game.paddleHeight;
    if (game.ballX - br <= lpX + lpW && game.ballY >= lpY && game.ballY <= lpY + lpH && game.ballVX < 0) {
      game.ballX = lpX + lpW + br;
      game.ballVX *= -1.05;
      game.ballVY += (game.ballY - (lpY + lpH / 2)) * 0.02;
      audio.tick();
      spawnParticles(game.ballX, game.ballY, '#a8ff00', 16);
    }
    if (game.ballX + br >= rpX && game.ballY >= rpY && game.ballY <= rpY + rpH && game.ballVX > 0) {
      game.ballX = rpX - br;
      game.ballVX *= -1.05;
      game.ballVY += (game.ballY - (rpY + rpH / 2)) * 0.02;
      audio.tick();
      spawnParticles(game.ballX, game.ballY, '#ff2bd9', 16);
    }

    // Scoring inside substep
    if (game.ballX < -br * 2) { game.rightScore++; audio.score(); onScore(false); return; }
    if (game.ballX > canvas.width + br * 2) { game.leftScore++; audio.score(); onScore(true); return; }

    remaining -= d;
  }

  // Trail per frame
  game.trail.unshift({ x: game.ballX, y: game.ballY });
  if (game.trail.length > 20) game.trail.pop();

  updateParticles(dt);
}

function onScore(playerScored) {
  updateHudScores();
  if (playerScored) {
    game.coins += 3;
    storage.set('meta.coins', game.coins);
    if (game.leftScore >= game.winTarget) {
      endMatch(true);
      return;
    }
    resetBall(1);
  } else {
    if (game.rightScore >= game.winTarget) {
      endMatch(false);
      return;
    }
    resetBall(-1);
  }
}

function endMatch(playerWon) {
  game.running = false;
  game.paused = false;
  // Write leaderboard
  const entries = storage.get('leaderboard', []);
  entries.push({ date: Date.now(), left: game.leftScore, right: game.rightScore });
  entries.sort((a, b) => (b.left - b.right) - (a.left - a.right));
  storage.set('leaderboard', entries.slice(0, 20));
  updateLeaderboard();
  const status = playerWon ? 'You win! +20 coins' : 'Defeat. +5 coins';
  game.coins += playerWon ? 20 : 5;
  storage.set('meta.coins', game.coins);
  document.getElementById('coinCount').textContent = String(game.coins);
  const dialog = document.getElementById('modalMain');
  dialog.querySelector('p').textContent = status;
  dialog.showModal();
  updateHudScores();
}

function updateHudScores() {
  document.getElementById('scoreLeft').textContent = String(game.leftScore);
  document.getElementById('scoreRight').textContent = String(game.rightScore);
  document.getElementById('coinCount').textContent = String(game.coins);
}

// ---------- Rendering ----------
function drawCourt() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Glow grid background
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(255,255,255,0.03)');
  grad.addColorStop(1, 'rgba(255,255,255,0.06)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Center line (dashed glow)
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.setLineDash([12 * deviceScale, 16 * deviceScale]);
  ctx.lineWidth = 2 * deviceScale;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.restore();
}

function drawPaddles() {
  const inset = 16 * deviceScale;
  ctx.save();
  ctx.shadowBlur = 18 * deviceScale;
  // Left paddle glow
  ctx.fillStyle = '#a8ff00';
  ctx.shadowColor = '#a8ff00';
  ctx.fillRect(inset, game.leftY, game.paddleWidth, game.paddleHeight);
  // Right paddle glow
  ctx.fillStyle = '#ff2bd9';
  ctx.shadowColor = '#ff2bd9';
  ctx.fillRect(canvas.width - inset - game.paddleWidth, game.rightY, game.paddleWidth, game.paddleHeight);
  ctx.restore();
}

function drawBall() {
  // Trail
  ctx.save();
  for (let i = 0; i < game.trail.length; i++) {
    const t = i / game.trail.length;
    const alpha = 0.6 * (1 - t);
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha.toFixed(3)})`;
    const p = game.trail[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, game.ballRadius * (1 - t * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Ball
  ctx.save();
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20 * deviceScale;
  ctx.beginPath();
  ctx.arc(game.ballX, game.ballY, game.ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  for (const p of game.particles) {
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3 * deviceScale, 3 * deviceScale);
  }
  ctx.restore();
}

function render() {
  drawCourt();
  drawPaddles();
  drawBall();
  drawParticles();
}

function loop(t) {
  const dt = game.lastTime ? Math.min(0.033, (t - game.lastTime) / 1000) : 0;
  game.lastTime = t;
  step(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- UI Wiring ----------
const el = (id) => document.getElementById(id);

el('btnPlay').addEventListener('click', startGame);
el('btnPause').addEventListener('click', togglePause);

el('btnSettings').addEventListener('click', () => el('modalSettings').showModal());
el('btnCloseSettings').addEventListener('click', () => el('modalSettings').close());
el('btnMenuSettings').addEventListener('click', () => el('modalSettings').showModal());

el('btnShop').addEventListener('click', () => el('modalShop').showModal());
el('btnCloseShop').addEventListener('click', () => el('modalShop').close());
el('btnMenuShop').addEventListener('click', () => el('modalShop').showModal());

el('btnLeaderboard').addEventListener('click', () => {
  updateLeaderboard();
  el('modalLeaderboard').showModal();
});
el('btnCloseLeaderboard').addEventListener('click', () => el('modalLeaderboard').close());

el('btnShare').addEventListener('click', async () => {
  const shareData = { title: 'Neon Pong', text: 'Beat me in Neon Pong ⚡', url: location.href };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch {}
  } else {
    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      el('statusText').textContent = 'Link copied!';
      setTimeout(() => (el('statusText').textContent = ''), 1500);
    } catch {}
  }
});

// Settings
const selectDifficulty = el('selectDifficulty');
selectDifficulty.value = game.difficulty;
selectDifficulty.addEventListener('change', () => {
  game.difficulty = selectDifficulty.value;
  storage.set('settings.difficulty', game.difficulty);
  game.aiSpeed = difficultyToAiSpeed(game.difficulty) * deviceScale;
});

const toggleSound = el('toggleSound');
toggleSound.checked = audio.enabled;
toggleSound.addEventListener('change', () => audio.setEnabled(toggleSound.checked));

const rangeVolume = el('rangeVolume');
rangeVolume.value = String(audio.volume);
rangeVolume.addEventListener('input', () => audio.setVolume(Number(rangeVolume.value)));

// Shop
const shopItems = [
  { id: 'trail-cyan', name: 'Cyan Trail', color: '#00f0ff', price: 20 },
  { id: 'trail-pink', name: 'Pink Trail', color: '#ff2bd9', price: 20 },
  { id: 'trail-lime', name: 'Lime Trail', color: '#a8ff00', price: 35 },
  { id: 'trail-sunset', name: 'Sunset Trail', color: '#ff8a00', price: 50 },
];

function renderShop() {
  const container = document.getElementById('shopItems');
  container.innerHTML = '';
  const owned = new Set(storage.get('cosmetic.owned', []));
  for (const item of shopItems) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.color = item.color;
    swatch.style.background = item.color + '22';
    swatch.style.boxShadow = `0 0 18px ${item.color}`;
    const label = document.createElement('div');
    label.textContent = item.name;
    const price = document.createElement('div');
    price.className = 'price';
    const isOwned = owned.has(item.id);
    price.textContent = isOwned ? 'Owned' : `${item.price} ◈`;
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.textContent = isOwned ? 'Equip' : 'Buy';
    button.addEventListener('click', () => {
      const ownedNow = new Set(storage.get('cosmetic.owned', []));
      if (!ownedNow.has(item.id)) {
        if (game.coins < item.price) {
          document.getElementById('statusText').textContent = 'Not enough coins';
          setTimeout(() => (document.getElementById('statusText').textContent = ''), 1500);
          return;
        }
        game.coins -= item.price;
        storage.set('meta.coins', game.coins);
        ownedNow.add(item.id);
        storage.set('cosmetic.owned', Array.from(ownedNow));
      }
      game.selectedTrail = item.id.replace('trail-', '');
      storage.set('cosmetic.trail', game.selectedTrail);
      renderShop();
      updateHudScores();
    });
    div.appendChild(swatch);
    div.appendChild(label);
    div.appendChild(price);
    div.appendChild(button);
    container.appendChild(div);
  }
}

renderShop();

function updateLeaderboard() {
  const list = document.getElementById('leaderboardList');
  list.innerHTML = '';
  const entries = storage.get('leaderboard', []);
  entries.slice(0, 20).forEach((e, i) => {
    const li = document.createElement('li');
    const margin = e.left - e.right;
    const date = new Date(e.date).toLocaleDateString();
    li.textContent = `#${i + 1} Margin ${margin >= 0 ? '+' : ''}${margin} — ${date}`;
    list.appendChild(li);
  });
}

// ---------- PWA ----------
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('sw.js', { scope: './' });
    } catch (e) {
      // ignore
    }
  }
}
registerServiceWorker();

// Display version in console so we can prompt reload on updates later
console.log(`Neon Pong v${GAME_VERSION}`);



