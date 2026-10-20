const GAME_CONFIG_DEFAULTS = Object.freeze({
  captureDistance: 100,
  maxMice: 15,
  spawnIntervalMs: 1500,
  snakeSpeed: 4.5,
  snakeSize: 13,
  minSpacing: 17,
  maxSpacing: 42,
  spacingSensitivity: 0.7,
  spacingReturnSpeed: 0.08,
  snakeMaxForce: 0.25,
  snakeColor: '#61d98e',
  snakeShape: 'circle',
  initialSegments: 10,
  paletteColors: ['#61d98e', '#f26b6b', '#61b9e8', '#f0bd6a', '#bd86ef', '#f28fce'],
  mouseFleeRadius: 250,
  flockRadius: 100,
  separationWeight: 1.3,
  cohesionWeight: 0.35,
  alignmentWeight: 0.45,
  fleeWeight: 1.5,
  obstacleWeight: 2.2,
  obstacleCount: 12,
  raptorBaseCount: 1,
  raptorWaveIntervalMs: 30000,
  raptorLoseDistance: 650,
  dashMultiplier: 2.2,
  dashEnergyCost: 0.65,
  energyRecharge: 0.24,
  iceDurationMs: 3000,
  magnetDurationMs: 5000,
  shieldDurationMs: 3000,
  comboWindowMs: 8000,
  comboShieldCount: 5,
  comboMaxMultiplier: 5,
  particlePoolSize: 180,
  spatialCellSize: 140,
  goldenChance: 0.035,
  icyChance: 0.09,
  toxicBaseChance: 0.08,
  magnetChance: 0.025,
  screenShake: 5,
  // Paramètres du monde Slither.io (coordonnées monde, pas pixels écran).
  worldWidth: 6000,
  worldHeight: 6000,
  borderWidth: 22,
  collisionRadius: 38,
  worldGridSpacing: 92,
  // Densité et comportement de nourriture/proies.
  foodCount: 1400,
  foodColors: ['#ffdc69', '#76f7dc', '#ff8dc8', '#9ba5ff', '#a8ff72', '#ff9b61'],
  foodAttractionRadius: 145,
  foodPickupRadius: 25,
  pointsPerSegment: 5,
  specialPreyGrowth: 4,
  // Population, perception et décisions des bots.
  botCount: 20,
  botRespawnMs: 2200,
  botNames: ['Nova', 'Pixel', 'Miso', 'Comet', 'Noodle', 'Echo', 'Kiwi', 'Orbit', 'Mochi', 'Ziggy', 'Luma', 'Basil'],
  botColors: ['#ff6b71', '#ffb34f', '#bd7bff', '#58c9ff', '#ff75c8', '#e5eb66', '#70e6b4'],
  botFoodRadius: 700,
  botThreatRadius: 800,
  botPreyRadius: 900,
  botThreatLengthRatio: 1.25,
  botPreyLengthRatio: 1.2,
  botTargetMinMs: 700,
  botTargetMaxMs: 1500,
  botWanderRadius: 600,
  botCutLeadFrames: 18,
  // Contrôle, caméra et boost.
  turnRate: 0.055,
  turnLookAhead: 180,
  slitherSpacing: 23,
  boostLengthIntervalMs: 650,
  boostMinimumLength: 5,
  cameraEase: 0.085,
  cameraMinZoom: 0.52,
  cameraDeathEase: 0.08,
  cameraDeathZoom: 0.82,
  cameraDeathZoomEase: 0.05,
  // Durées et intensités des transitions/effets.
  introDurationMs: 3600,
  introInvulnerabilityMs: 4200,
  introCountdownStepMs: 800,
  introZoomDurationMs: 1600,
  introStartZoom: 2.15,
  introFadeMs: 600,
  introShockwaveMs: 650,
  introFlashMs: 180,
  introParticleCount: 36,
  spawnCascadeMs: 32,
  deathSlowMotionMs: 1200,
  deathSegmentDelayMs: 22,
  deathShake: 22,
  deathFlashMs: 180,
  deathGlitchMs: 360,
  deathTimeScaleDivisor: 5,
  deathVignetteBands: 10,
  deathScanlines: 7,
  startingShakeDecay: 0.88,
  deathShakeDecay: 0.94,
  leaderboardIntervalMs: 350,
  introSpawnBurstCount: 36,
  introShockwaveSpeed: 30,
  // Presets matériels : les effets restent présents, mais leur coût suit la machine.
  QUALITY: Object.freeze({
    low: Object.freeze({
      bots: 6, orbs: 800, particles: 150, glow: false, additive: false,
      trail: false, chromatic: false, vignette: false, shake: 0.25,
      pixelDensity: 1, frameRate: 30, renderScale: 0.75, effectScale: 0.25,
      deathStride: 3, botDecisionFrames: 4, minimapInterval: 6
    }),
    medium: Object.freeze({
      bots: 12, orbs: 1500, particles: 400, glow: true, additive: true,
      trail: true, chromatic: false, vignette: true, shake: 0.6,
      pixelDensity: 1, frameRate: 45, renderScale: 0.9, effectScale: 0.6,
      deathStride: 2, botDecisionFrames: 4, minimapInterval: 5
    }),
    high: Object.freeze({
      bots: 20, orbs: 3000, particles: 1000, glow: true, additive: true,
      trail: true, chromatic: true, vignette: true, shake: 1,
      pixelDensity: 'device', frameRate: 60, renderScale: 1, effectScale: 1,
      deathStride: 1, botDecisionFrames: 3, minimapInterval: 4
    }),
    auto: Object.freeze({
      fpsWindowFrames: 60, sampleDurationMs: 3000,
      initialLowFps: 35, initialHighFps: 52,
      lowerFps: 40, lowerHoldMs: 2000,
      raiseFps: 58, raiseHoldMs: 10000,
      changeCooldownMs: 6000
    })
  })
});
const GAME_CONFIG = { ...GAME_CONFIG_DEFAULTS };
const FIXED_STEP_MS = 1000 / 60;

let font;
let qualityMode = 'medium';
let activeQuality = GAME_CONFIG.QUALITY.medium;
let lowFpsSince = 0;
let highFpsSince = 0;
let lastQualityChangeAt = 0;
let autoSamplingStartedAt = 0;
let autoInitialSamples = 0;
let autoInitialFpsSum = 0;
const FPS_SAMPLE_COUNT = GAME_CONFIG.QUALITY.auto.fpsWindowFrames;
const fpsSamples = new Float32Array(FPS_SAMPLE_COUNT);
let fpsSampleIndex = 0;
let fpsSampleTotal = 0;
let fpsAverage = 0;
let updateTimeMs = 0;
let drawTimeMs = 0;
let simulationAccumulator = 0;
let simulationTime = 0;
let lastMeasuredFrameAt = 0;
let renderFrameLimit30 = false;
let visibilityPausedGame = false;
let canvasScale = 1;
let minimapFrame = 0;
let glowSprites = new Map();
let backgroundTexture;
let backgroundPattern = null;
let eyeSprite = null;
let gameState = 'menu';
let snake = null;
let mice = [];
let foodOrbs = [];
let bots = [];
let caughtMice = 0;
let score = 0;
let nextMouseSpawnAt = 0;
let targetPosition;
let selectedSnakeColor = GAME_CONFIG_DEFAULTS.snakeColor;
let selectedSnakeShape = GAME_CONFIG_DEFAULTS.snakeShape;
let menuColorPicker;
let settingsColorPicker;
let gameSliders = {};
let gameButtons = {};
let spatialGrid;
let obstacles = [];
let raptors = [];
let effects;
let soundManager;
let stars = [];
let menuSnake;
let floatingMessages = [];
let floatingMessagePool = [];
let energy = 1;
let dashActive = false;
let slowUntil = 0;
let magnetUntil = 0;
let shieldUntil = 0;
let captureTimes = [];
let comboMultiplier = 1;
let comboUntil = 0;
let wave = 1;
let nextWaveAt = 0;
let bestScore = 0;
let bestScoreAtStart = 0;
let debugMode = false;
let screenShake = 0;
let shieldFlash = 0;
let dashSoundCooldown = 0;
let foodGrid;
let collisionGrid;
let cameraPosition;
let cameraZoom = 1;
let cameraTargetZoom = 1;
let spaceBoost = false;
let playerName = 'Joueur';
let playerKills = 0;
let gameStartedAt = 0;
let introStartedAt = 0;
let invulnerableUntil = 0;
let nextBoostLossAt = 0;
let foodProgress = 0;
let lastLeaderboardAt = 0;
let leaderboardRows = [];
const leaderboardEntries = [];
let leaderboardHeading = null;
let leaderboardList = null;
let deathStartedAt = 0;
let deathNextSegmentAt = 0;
let deathSegmentIndex = 0;
let deathSegments = [];
let deathOrbs = [];
let shockwaves = [];
let deathLength = 0;
let deathWasRecord = false;
let deathPosition;
let killMessageUntil = 0;
let lastFrameAt = 0;
let screenShockStartedAt = 0;
let screenFlashUntil = 0;
let worldCullingEnabled = false;
const VISIBLE_ORB_BUFFER = [];
const COLLISION_BUFFER = [];

function preload() {
  font = loadFont('./assets/inconsolata.otf');
}

function resizeCanvasToDisplay() {
  resizeCanvas(Math.max(1, Math.round(windowWidth * canvasScale)), Math.max(1, Math.round(windowHeight * canvasScale)));
  const canvas = document.querySelector('#game-canvas canvas');
  if (canvas) {
    canvas.style.width = `${windowWidth}px`;
    canvas.style.height = `${windowHeight}px`;
  }
}

function createRenderAssets() {
  backgroundTexture = createGraphics(256, 256);
  backgroundTexture.pixelDensity(1);
  backgroundTexture.background(8, 20, 25);
  backgroundTexture.stroke(100, 160, 177, 18);
  backgroundTexture.strokeWeight(1);
  for (let y = 0; y < 256; y += GAME_CONFIG.worldGridSpacing) {
    for (let x = 0; x < 256; x += GAME_CONFIG.worldGridSpacing) {
      backgroundTexture.point(x + (Math.floor(y / GAME_CONFIG.worldGridSpacing) % 2) * GAME_CONFIG.worldGridSpacing / 2, y);
    }
  }
  const glowColors = new Set([
    ...GAME_CONFIG.foodColors,
    ...GAME_CONFIG.paletteColors,
    ...GAME_CONFIG.botColors,
    '#202a59', '#8df5ff'
  ]);
  for (const tint of glowColors) {
    const sprite = createGraphics(64, 64);
    sprite.pixelDensity(1);
    const gradient = sprite.drawingContext.createRadialGradient(32, 32, 1, 32, 32, 32);
    gradient.addColorStop(0, tint);
    gradient.addColorStop(0.18, `${tint}bb`);
    gradient.addColorStop(1, `${tint}00`);
    sprite.drawingContext.fillStyle = gradient;
    sprite.drawingContext.fillRect(0, 0, 64, 64);
    glowSprites.set(tint, sprite);
  }
  backgroundPattern = drawingContext.createPattern(backgroundTexture.canvas, 'repeat');
  eyeSprite = createGraphics(36, 76);
  eyeSprite.pixelDensity(1);
  eyeSprite.noStroke();
  eyeSprite.fill('#f4f6e8');
  eyeSprite.ellipse(18, 18, 22, 24);
  eyeSprite.ellipse(18, 58, 22, 24);
  eyeSprite.fill('#183b2b');
  eyeSprite.ellipse(21, 18, 9, 10);
  eyeSprite.ellipse(21, 58, 9, 10);
}

function ensureGlowSprite(tint) {
  if (glowSprites.has(tint) || typeof createGraphics !== 'function') return;
  const sprite = createGraphics(64, 64);
  sprite.pixelDensity(1);
  const gradient = sprite.drawingContext.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, tint);
  gradient.addColorStop(0.18, `${tint}bb`);
  gradient.addColorStop(1, `${tint}00`);
  sprite.drawingContext.fillStyle = gradient;
  sprite.drawingContext.fillRect(0, 0, 64, 64);
  glowSprites.set(tint, sprite);
}

function qualityPresetName(mode) {
  if (mode === 'low' || mode === 'medium' || mode === 'high') return mode;
  return 'medium';
}

function setQualityMode(mode, now = millis()) {
  if (mode !== 'auto' && !GAME_CONFIG.QUALITY[mode]) return;
  qualityMode = mode;
  document.body.dataset.quality = qualityPresetName(mode);
  localStorage.setItem('snakeMiceQuality', mode);
  document.getElementById('menu-quality').value = mode;
  document.getElementById('settings-quality').value = mode;
  const presetName = qualityPresetName(mode);
  applyQualityPreset(presetName, now);
  if (mode === 'auto') {
    autoSamplingStartedAt = 0;
    autoInitialSamples = 0;
    autoInitialFpsSum = 0;
  }
}

function applyQualityPreset(presetName, now = millis()) {
  const nextPreset = GAME_CONFIG.QUALITY[presetName];
  const density = nextPreset.pixelDensity === 'device' ? displayDensity() : nextPreset.pixelDensity;
  const scaleChanged = canvasScale !== nextPreset.renderScale || pixelDensity() !== density;
  activeQuality = nextPreset;
  document.body.dataset.quality = presetName;
  GAME_CONFIG.botCount = nextPreset.bots;
  GAME_CONFIG.foodCount = nextPreset.orbs;
  if (effects) effects.resizePool(nextPreset.particles);
  if (scaleChanged && typeof resizeCanvas === 'function') {
    pixelDensity(density);
    canvasScale = nextPreset.renderScale;
    resizeCanvasToDisplay();
  }
  frameRate(renderFrameLimit30 ? 30 : nextPreset.frameRate);
  while (bots.length > nextPreset.bots) bots.pop();
  while (bots.length < nextPreset.bots && snake) bots.push(createBot(bots.length));
  trimFoodToQuality();
  lowFpsSince = 0;
  highFpsSince = 0;
  lastQualityChangeAt = now;
}

function measurePerformance(now, drawStartAt) {
  const currentFps = frameRate();
  lastMeasuredFrameAt = performance.now();
  fpsSampleTotal -= fpsSamples[fpsSampleIndex];
  fpsSamples[fpsSampleIndex] = currentFps || 0;
  fpsSampleTotal += fpsSamples[fpsSampleIndex];
  fpsSampleIndex = (fpsSampleIndex + 1) % FPS_SAMPLE_COUNT;
  fpsAverage = fpsSampleTotal / FPS_SAMPLE_COUNT;
  drawTimeMs = performance.now() - drawStartAt;
  if (qualityMode !== 'auto') return;
  if (gameState !== 'playing') return;
  if (!autoSamplingStartedAt) {
    autoSamplingStartedAt = now;
    autoInitialSamples = 0;
    autoInitialFpsSum = 0;
  }
  const auto = GAME_CONFIG.QUALITY.auto;
  if (now - autoSamplingStartedAt < auto.sampleDurationMs) {
    autoInitialFpsSum += currentFps || 0;
    autoInitialSamples++;
    return;
  }
  if (autoInitialSamples > 0) {
    const average = autoInitialFpsSum / autoInitialSamples;
    applyQualityPreset(
      average < auto.initialLowFps ? 'low' : average < auto.initialHighFps ? 'medium' : 'high',
      now
    );
    autoInitialSamples = 0;
    autoInitialFpsSum = 0;
    return;
  }
  const currentIndex = activeQuality === GAME_CONFIG.QUALITY.low ? 0
    : activeQuality === GAME_CONFIG.QUALITY.medium ? 1 : 2;
  if (now - lastQualityChangeAt < auto.changeCooldownMs) return;
  if (fpsAverage < auto.lowerFps) {
    highFpsSince = 0;
    if (!lowFpsSince) lowFpsSince = now;
    if (now - lowFpsSince >= auto.lowerHoldMs && currentIndex > 0) {
      applyQualityPreset(currentIndex === 2 ? 'medium' : 'low', now);
    }
  } else {
    lowFpsSince = 0;
  }
  if (fpsAverage > auto.raiseFps) {
    if (!highFpsSince) highFpsSince = now;
    if (now - highFpsSince >= auto.raiseHoldMs && currentIndex < 2) {
      applyQualityPreset(currentIndex === 0 ? 'medium' : 'high', now);
    }
  } else {
    highFpsSince = 0;
  }
}

function trimFoodToQuality() {
  while (foodOrbs.length > GAME_CONFIG.foodCount) {
    let farthestIndex = foodOrbs.length - 1;
    let farthestDistance = -1;
    for (let index = 0; index < foodOrbs.length; index++) {
      const orb = foodOrbs[index];
      const dx = orb.pos.x - cameraPosition.x;
      const dy = orb.pos.y - cameraPosition.y;
      const distance = dx * dx + dy * dy;
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }
    removeFoodOrbAt(farthestIndex);
  }
}

function removeFoodOrbAt(index) {
  const lastIndex = foodOrbs.length - 1;
  if (index < 0 || index > lastIndex) return;
  const removed = foodOrbs[index];
  foodOrbs[index] = foodOrbs[lastIndex];
  foodOrbs.pop();
  releaseFoodOrb(removed);
}

function handleVisibilityChange() {
  if (document.hidden && gameState === 'playing') {
    visibilityPausedGame = true;
    pauseGame();
  } else if (!document.hidden && visibilityPausedGame) {
    visibilityPausedGame = false;
    resumeGame();
  }
}

function handleWindowBlur() {
  frameRate(10);
}

function handleWindowFocus() {
  frameRate(renderFrameLimit30 ? 30 : activeQuality.frameRate);
}

function setup() {
  qualityMode = localStorage.getItem('snakeMiceQuality') || 'medium';
  if (qualityMode !== 'auto' && !GAME_CONFIG.QUALITY[qualityMode]) qualityMode = 'medium';
  activeQuality = GAME_CONFIG.QUALITY[qualityMode === 'auto' ? 'medium' : qualityMode];
  document.body.dataset.quality = qualityMode === 'auto' ? 'medium' : qualityMode;
  GAME_CONFIG.botCount = activeQuality.bots;
  GAME_CONFIG.foodCount = activeQuality.orbs;
  pixelDensity(activeQuality.pixelDensity === 'device' ? displayDensity() : activeQuality.pixelDensity);
  canvasScale = activeQuality.renderScale;
  createCanvas(Math.max(1, Math.round(windowWidth * canvasScale)), Math.max(1, Math.round(windowHeight * canvasScale)))
    .parent('game-canvas');
  resizeCanvasToDisplay();
  frameRate(activeQuality.frameRate);
  simulationTime = millis();
  autoSamplingStartedAt = simulationTime;
  lastMeasuredFrameAt = performance.now();
  textFont(font);
  targetPosition = createVector(width / 2, height / 2);
  cameraPosition = createVector(GAME_CONFIG.worldWidth / 2, GAME_CONFIG.worldHeight / 2);
  deathPosition = createVector(cameraPosition.x, cameraPosition.y);
  bestScore = Number(localStorage.getItem('snakeMiceBestScore') || 0);
  bestScoreAtStart = bestScore;
  spatialGrid = new SpatialGrid(GAME_CONFIG.spatialCellSize);
  foodGrid = new SpatialGrid(GAME_CONFIG.spatialCellSize);
  collisionGrid = new SpatialGrid(GAME_CONFIG.spatialCellSize);
  effects = new ParticleSystem(activeQuality.particles);
  floatingMessagePool = Array.from({ length: 24 }, () => {
    const message = new FloatingMessage(0, 0, '', '#ffffff');
    message.active = false;
    return message;
  });
  soundManager = new GameSoundManager();
  document.getElementById('mute-setting').checked = soundManager.enabled;
  document.getElementById('menu-quality').value = qualityMode;
  document.getElementById('settings-quality').value = qualityMode;
  document.getElementById('limit-30-fps').checked = false;
  obstacles = createObstacles(GAME_CONFIG.obstacleCount);
  indexObstacles(obstacles);
  stars = createBackgroundStars(60);
  createRenderAssets();
  menuSnake = new Snake(width * 0.5, height * 0.78);
  menuSnake.segments = menuSnake.segments.slice(0, 5);

  createColorControls();
  createSettingsSliders();
  createColorPalettes();
  createShapeSelectors();
  document.getElementById('menu-skin').addEventListener('change', event => {
    if (snake) snake.skin = event.target.value;
  });
  syncSnakeAppearance();
  bindInterfaceEvents();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  hideSettingsControls();
  updateBestScore();
}

function createColorControls() {
  menuColorPicker = createColorPicker(selectedSnakeColor);
  menuColorPicker.parent('menu-color-picker');
  menuColorPicker.attribute('aria-label', 'Choisir une couleur personnalisée');
  menuColorPicker.input(() => setSnakeColor(menuColorPicker.value()));

  settingsColorPicker = createColorPicker(selectedSnakeColor);
  settingsColorPicker.parent('settings-color-picker');
  settingsColorPicker.attribute('aria-label', 'Choisir une couleur personnalisée');
  settingsColorPicker.input(() => setSnakeColor(settingsColorPicker.value()));
}

function createSettingsSliders() {
  const definitions = [
    ['snakeSpeed', 'Vitesse de la tête', 1, 10, 0.5],
    ['snakeSize', 'Taille des cercles', 6, 24, 1],
    ['minSpacing', 'Espacement minimal', 6, 40, 1],
    ['maxSpacing', 'Espacement maximal', 12, 80, 1],
    ['captureDistance', 'Distance de capture', 30, 200, 5],
    ['maxMice', 'Nombre maximal de souris', 1, 30, 1],
    ['spawnIntervalMs', 'Intervalle d’apparition (ms)', 500, 5000, 100],
    ['fleeWeight', 'Poids de la fuite', 0, 3, 0.1],
    ['cohesionWeight', 'Poids de la cohésion', 0, 2, 0.05],
    ['separationWeight', 'Poids de la séparation', 0, 3, 0.1],
    ['obstacleWeight', 'Poids de l’évitement', 0, 4, 0.1]
  ];

  for (const [key, label, min, max, step] of definitions) {
    const row = document.createElement('label');
    row.className = 'setting-row';
    row.innerHTML = `<span>${label}</span><output id="${key}-value"></output><div id="${key}-slider"></div>`;
    document.getElementById('settings-sliders').appendChild(row);

    const slider = createSlider(min, max, GAME_CONFIG[key], step);
    slider.parent(`${key}-slider`);
    slider.attribute('aria-label', label);
    slider.input(() => {
      GAME_CONFIG[key] = Number(slider.value());
      synchronizeRelatedSettings(key);
      updateSettingOutputs();
      applyConfigToEntities();
    });
    gameSliders[key] = slider;
  }
  updateSettingOutputs();
}

function createColorPalettes() {
  for (const paletteId of ['menu-color-palette', 'settings-color-palette']) {
    const palette = document.getElementById(paletteId);
    for (const colorValue of GAME_CONFIG.paletteColors) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = colorValue;
      swatch.setAttribute('aria-label', `Couleur ${colorValue}`);
      swatch.addEventListener('click', () => setSnakeColor(colorValue));
      palette.appendChild(swatch);
    }
  }
}

function createShapeSelectors() {
  for (const selectorId of ['menu-shape', 'settings-shape']) {
    const selector = document.getElementById(selectorId);
    selector.addEventListener('change', () => {
      selectedSnakeShape = selector.value;
      GAME_CONFIG.snakeShape = selectedSnakeShape;
      document.getElementById('menu-shape').value = selectedSnakeShape;
      document.getElementById('settings-shape').value = selectedSnakeShape;
      updateSnakePreview();
      if (snake) snake.shape = selectedSnakeShape;
    });
  }
}

function bindInterfaceEvents() {
  document.getElementById('play-button').addEventListener('click', startGame);
  document.getElementById('settings-button').addEventListener('click', openSettings);
  document.getElementById('settings-close').addEventListener('click', closeSettings);
  document.getElementById('settings-close-bottom').addEventListener('click', closeSettings);
  document.getElementById('settings-reset').addEventListener('click', resetSettings);
  document.getElementById('resume-button').addEventListener('click', resumeGame);
  document.getElementById('replay-button').addEventListener('click', startGame);
  document.getElementById('menu-button').addEventListener('click', returnToMenu);
  document.getElementById('mute-button').addEventListener('click', toggleMute);
  document.getElementById('mute-setting').addEventListener('change', event => setSoundEnabled(event.target.checked));
  document.getElementById('menu-quality').addEventListener('change', event => setQualityMode(event.target.value));
  document.getElementById('settings-quality').addEventListener('change', event => setQualityMode(event.target.value));
  document.getElementById('limit-30-fps').addEventListener('change', event => {
    renderFrameLimit30 = event.target.checked;
    frameRate(renderFrameLimit30 ? 30 : activeQuality.frameRate);
  });
}

function startGame() {
  if (GAME_CONFIG.minSpacing > GAME_CONFIG.maxSpacing) {
    GAME_CONFIG.maxSpacing = GAME_CONFIG.minSpacing;
    gameSliders.maxSpacing.value(GAME_CONFIG.maxSpacing);
    updateSettingOutputs();
  }

  soundManager.start();
  effects.clear();
  shockwaves.length = 0;
  deathOrbs.length = 0;
  clearFloatingMessages();
  for (let index = 0; index < foodOrbs.length; index++) releaseFoodOrb(foodOrbs[index]);
  foodOrbs.length = 0;
  bestScoreAtStart = bestScore;
  gameState = 'starting';
  playerName = document.getElementById('player-name').value.trim().slice(0, 16) || 'Joueur';
  snake = new Snake(GAME_CONFIG.worldWidth / 2, GAME_CONFIG.worldHeight / 2);
  snake.color = selectedSnakeColor;
  snake.shape = selectedSnakeShape;
  snake.skin = document.getElementById('menu-skin').value;
  snake.name = playerName;
  snake.isBot = false;
  snake.kills = 0;
  snake.dead = false;
  snake.vel.set(1, 0).mult(GAME_CONFIG.snakeSpeed * 0.4);
  for (let index = 0; index < snake.segments.length; index++) {
    snake.segments[index].visible = false;
    snake.segments[index].spawnTime = millis() + (index + 1) * GAME_CONFIG.spawnCascadeMs;
  }
  mice = [];
  raptors = [];
  obstacles = createObstacles(GAME_CONFIG.obstacleCount);
  indexObstacles(obstacles);
  createFoodField(GAME_CONFIG.foodCount, foodOrbs);
  foodGrid.clear();
  for (const orb of foodOrbs) foodGrid.insert(orb);
  bots = [];
  for (let index = 0; index < GAME_CONFIG.botCount; index++) bots.push(createBot(index));
  caughtMice = 0;
  playerKills = 0;
  score = 0;
  foodProgress = 0;
  wave = 1;
  energy = 1;
  captureTimes.length = 0;
  comboMultiplier = 1;
  comboUntil = 0;
  slowUntil = 0;
  magnetUntil = 0;
  shieldUntil = 0;
  screenShake = 0;
  gameStartedAt = millis();
  introStartedAt = gameStartedAt;
  if (qualityMode === 'auto') {
    autoSamplingStartedAt = 0;
    autoInitialSamples = 0;
    autoInitialFpsSum = 0;
  }
  simulationTime = gameStartedAt;
  simulationAccumulator = 0;
  invulnerableUntil = gameStartedAt + GAME_CONFIG.introInvulnerabilityMs;
  nextBoostLossAt = gameStartedAt + GAME_CONFIG.boostLengthIntervalMs;
  cameraPosition.set(snake.pos);
  cameraZoom = GAME_CONFIG.introStartZoom;
  cameraTargetZoom = 1;
  screenShockStartedAt = gameStartedAt;
  screenFlashUntil = gameStartedAt + GAME_CONFIG.introFlashMs;
  screenShake = 8;
  screenShake *= activeQuality.shake;
  soundManager.playEntry();
  effects.burst(snake.pos.x, snake.pos.y, selectedSnakeColor, GAME_CONFIG.introParticleCount, 9, 48);
  shockwaves.push(new Shockwave(
    snake.pos.x,
    snake.pos.y,
    '#a1fff4',
    GAME_CONFIG.introShockwaveMs / 16,
    GAME_CONFIG.introShockwaveSpeed
  ));
  for (let index = 0; index < GAME_CONFIG.introSpawnBurstCount; index++) {
    const angle = TWO_PI * index / GAME_CONFIG.introSpawnBurstCount;
    const distance = random(80, 250);
    effects.burst(
      snake.pos.x + cos(angle) * distance,
      snake.pos.y + sin(angle) * distance,
      GAME_CONFIG.foodColors[index % GAME_CONFIG.foodColors.length],
      1,
      8,
      48
    );
  }
  nextMouseSpawnAt = millis() + random(GAME_CONFIG.spawnIntervalMs * 0.8, GAME_CONFIG.spawnIntervalMs * 1.2);
  document.getElementById('start-menu').hidden = false;
  document.getElementById('start-menu').classList.remove('exiting');
  document.getElementById('start-menu').classList.add('exiting');
  menuColorPicker.hide();
  document.getElementById('game-hud').hidden = false;
  document.getElementById('leaderboard').hidden = false;
  document.getElementById('minimap').hidden = false;
  document.getElementById('settings-button').hidden = false;
  document.getElementById('gameover-menu').hidden = true;
  document.getElementById('pause-menu').hidden = true;
  document.getElementById('settings-panel').hidden = true;
  document.getElementById('countdown').hidden = false;
  document.getElementById('new-record').hidden = true;
  document.getElementById('kill-message').classList.remove('visible');
  updateScore();
  document.getElementById('caught-count').textContent = '0';
}

function createBot(index) {
  let x = random(220, GAME_CONFIG.worldWidth - 220);
  let y = random(220, GAME_CONFIG.worldHeight - 220);
  if (snake && dist(x, y, snake.pos.x, snake.pos.y) < 800) {
    x = constrain(x + 1100, 220, GAME_CONFIG.worldWidth - 220);
    y = constrain(y + 900, 220, GAME_CONFIG.worldHeight - 220);
  }
  const bot = new SnakeBot(x, y, index);
  bot.owner = bot;
  return bot;
}

function draw() {
  const drawStartedAt = performance.now();
  const now = millis();
  drawAnimatedBackground();
  if (gameState === 'menu') {
    worldCullingEnabled = false;
    menuSnake.color = selectedSnakeColor;
    menuSnake.shape = selectedSnakeShape;
    targetPosition.set(constrain(mouseX, 0, width), constrain(mouseY, 0, height));
    menuSnake.update(targetPosition);
    menuSnake.show();
    updateTimeMs = 0;
    if (debugMode) drawPerformanceOverlay(now);
    measurePerformance(now, drawStartedAt);
    return;
  }
  if (!snake) {
    measurePerformance(now, drawStartedAt);
    return;
  }

  soundManager.update(now);
  const updateStartedAt = performance.now();
  if (gameState === 'starting' || gameState === 'playing') {
    simulationAccumulator = Math.min(simulationAccumulator + Math.min(deltaTime, 50), 50);
    while (simulationAccumulator >= FIXED_STEP_MS) {
      simulationTime += FIXED_STEP_MS;
      updateSlitherWorld(simulationTime);
      simulationAccumulator -= FIXED_STEP_MS;
    }
  } else if (gameState === 'dying') {
    updateDeathSequence(now);
  }
  updateCamera(now);
  updateTimeMs = performance.now() - updateStartedAt;

  push();
  if (screenShake > 0) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
    const shakeScale = gameState === 'dying' ? GAME_CONFIG.deathShakeDecay : GAME_CONFIG.startingShakeDecay;
    screenShake *= 1 - (1 - shakeScale) * activeQuality.shake;
    if (screenShake < 0.2) screenShake = 0;
  }
  translate(width / 2, height / 2);
  scale(cameraZoom);
  translate(-cameraPosition.x, -cameraPosition.y);
  worldCullingEnabled = true;
  drawWorldGrid();
  drawWorldBoundary();
  for (const obstacle of obstacles) {
    if (isWorldPointVisible(obstacle.pos.x, obstacle.pos.y, obstacle.r * 2)) obstacle.show();
  }
  foodGrid.queryInto(cameraPosition, viewRadius(), VISIBLE_ORB_BUFFER);
  for (const orb of VISIBLE_ORB_BUFFER) {
    if (!orb.consumed && isWorldPointVisible(orb.pos.x, orb.pos.y, orb.r)) orb.show();
  }
  for (const mouse of mice) {
    if (isWorldPointVisible(mouse.pos.x, mouse.pos.y, mouse.r)) mouse.show();
  }
  for (const bot of bots) {
    if (bot.dead || !isWorldPointVisible(bot.pos.x, bot.pos.y, 400)) continue;
    bot.show();
  }
  if (gameState !== 'dying') snake.show();
  else drawDyingSnake();
  effects.show();
  for (let index = 0; index < shockwaves.length; index++) shockwaves[index].show();
  if (debugMode) drawDebugOverlay();
  pop();
  worldCullingEnabled = false;
  if (gameState !== 'dying' || frameCount % GAME_CONFIG.deathTimeScaleDivisor === 0) effects.update();
  for (let index = shockwaves.length - 1; index >= 0; index--) {
    shockwaves[index].update();
    if (shockwaves[index].life <= 0) {
      shockwaves[index] = shockwaves[shockwaves.length - 1];
      shockwaves.pop();
    }
  }
  updateFloatingMessages();
  drawShieldFlash();
  drawEntryTransition(now);
  if (gameState === 'dying') drawDeathOverlay(now);
  if (frameCount % 5 === 0) {
    drawHudOverlay(now);
    updateHud();
  }
  drawMinimap();
  if ((gameState === 'starting' || gameState === 'playing') && now - lastLeaderboardAt > GAME_CONFIG.leaderboardIntervalMs) {
    updateLeaderboard();
    lastLeaderboardAt = now;
  }
  if (debugMode) drawPerformanceOverlay(now);
  measurePerformance(now, drawStartedAt);
}

const ALIVE_SNAKES_BUFFER = [];

function compactFoodOrbs() {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < foodOrbs.length; readIndex++) {
    const orb = foodOrbs[readIndex];
    if (!orb.consumed && orb.life > 0) {
      foodOrbs[writeIndex++] = orb;
    } else {
      releaseFoodOrb(orb);
    }
  }
  foodOrbs.length = writeIndex;
}

function updateSlitherWorld(now) {
  updateSpawnCascade(now);
  const elapsed = now - introStartedAt;
  if (gameState === 'starting' && elapsed < GAME_CONFIG.introDurationMs) {
    targetPosition.set(snake.pos);
    return;
  }
  if (gameState === 'starting') {
    gameState = 'playing';
    document.getElementById('countdown').hidden = true;
  }

  const worldMouseX = cameraPosition.x + (mouseX - width / 2) / cameraZoom;
  const worldMouseY = cameraPosition.y + (mouseY - height / 2) / cameraZoom;
  targetPosition.set(
    constrain(worldMouseX, 0, GAME_CONFIG.worldWidth),
    constrain(worldMouseY, 0, GAME_CONFIG.worldHeight)
  );
  updateSlitherBoost(now);
  snake.applyForce(obstacleAvoidance(snake, obstacles, 150).mult(GAME_CONFIG.obstacleWeight));
  snake.update(targetPosition);

  for (let index = 0; index < foodOrbs.length; index++) {
    const orb = foodOrbs[index];
    const dx = orb.pos.x - snake.pos.x;
    const dy = orb.pos.y - snake.pos.y;
    const nearPlayer = dx * dx + dy * dy <= GAME_CONFIG.foodAttractionRadius * GAME_CONFIG.foodAttractionRadius;
    if (orb.scattered) {
      if (isWorldPointVisible(orb.pos.x, orb.pos.y, 100)) orb.update(null, now);
    } else if (nearPlayer) {
      orb.update(snake, now);
    }
  }
  compactFoodOrbs();
  if (foodOrbs.length < GAME_CONFIG.foodCount) {
    const replenishCount = Math.min(8, GAME_CONFIG.foodCount - foodOrbs.length);
    for (let index = 0; index < replenishCount; index++) {
      foodOrbs.push(createFoodOrb(
        constrain(snake.pos.x + random(-1400, 1400), 80, GAME_CONFIG.worldWidth - 80),
        constrain(snake.pos.y + random(-1400, 1400), 80, GAME_CONFIG.worldHeight - 80)
      ));
    }
  }
  foodGrid.clear();
  for (const orb of foodOrbs) foodGrid.insert(orb);
  collectFood(now);
  compactFoodOrbs();

  spatialGrid.clear();
  for (const mouse of mice) spatialGrid.insert(mouse);
  for (const mouse of mice) mouse.update(snake, spatialGrid, obstacles, now);
  updateCaptures(now);
  if (mice.length < GAME_CONFIG.maxMice) spawnMouseWhenDue();

  const aliveSnakes = ALIVE_SNAKES_BUFFER;
  aliveSnakes.length = 0;
  aliveSnakes.push(snake);
  for (const bot of bots) if (!bot.dead) aliveSnakes.push(bot);
  for (const bot of bots) {
    if (bot.dead) {
      if (now >= bot.respawnAt) respawnBot(bot);
      continue;
    }
    bot.updateBot(now, foodOrbs, aliveSnakes, foodGrid, frameCount);
    if (
      bot.pos.x <= GAME_CONFIG.borderWidth ||
      bot.pos.y <= GAME_CONFIG.borderWidth ||
      bot.pos.x >= GAME_CONFIG.worldWidth - GAME_CONFIG.borderWidth ||
      bot.pos.y >= GAME_CONFIG.worldHeight - GAME_CONFIG.borderWidth
    ) {
      killSnake(bot, 'bot');
      continue;
    }

    collectFoodForSnake(bot);
  }
  rebuildCollisionGrid(aliveSnakes);
  resolveSnakeCollisions(aliveSnakes);
  if (snake.dead) return;
  if (
    snake.pos.x <= GAME_CONFIG.borderWidth ||
    snake.pos.y <= GAME_CONFIG.borderWidth ||
    snake.pos.x >= GAME_CONFIG.worldWidth - GAME_CONFIG.borderWidth ||
    snake.pos.y >= GAME_CONFIG.worldHeight - GAME_CONFIG.borderWidth
  ) {
    if (now >= invulnerableUntil) startPlayerDeath('bordure');
  }
  score = snake.length;
  updateScore();
  updateBestScore();
}

function updateSpawnCascade(now) {
  let visibleCount = 0;
  for (const segment of snake.segments) {
      if (!segment.visible && now >= segment.spawnTime) {
      segment.visible = true;
      effects.burst(segment.pos.x, segment.pos.y, snake.color, 7, 4, 28);
    }
    if (segment.visible) visibleCount++;
  }
  if (gameState === 'starting') {
    const elapsed = Math.max(0, now - introStartedAt);
    const step = GAME_CONFIG.introCountdownStepMs;
    const label = elapsed < step ? '3' : elapsed < step * 2 ? '2' : elapsed < step * 3 ? '1' : elapsed < GAME_CONFIG.introDurationMs ? 'GO !' : '';
    const countdown = document.getElementById('countdown');
    countdown.textContent = label;
    countdown.hidden = !label;
  }
}

function updateSlitherBoost(now) {
  const wasBoosting = dashActive;
  dashActive = (mouseIsPressed || spaceBoost) &&
    snake.length > GAME_CONFIG.boostMinimumLength &&
    now >= slowUntil;
  snake.boosting = dashActive;
  if (!dashActive) {
    energy = Math.min(1, energy + GAME_CONFIG.energyRecharge / 60);
    return;
  }
  if (!wasBoosting) nextBoostLossAt = now + GAME_CONFIG.boostLengthIntervalMs;
  energy = Math.max(0, energy - GAME_CONFIG.dashEnergyCost / 60);
  if (now >= nextBoostLossAt) {
    if (snake.segments.length > GAME_CONFIG.boostMinimumLength - 1) {
      const tail = snake.segments.pop();
      addScatteredOrb(tail.pos.x, tail.pos.y, snake.color);
      effects.burst(tail.pos.x, tail.pos.y, snake.color, 5, 3, 25);
      score = snake.length;
    }
    nextBoostLossAt = now + GAME_CONFIG.boostLengthIntervalMs;
  }
  if (now > dashSoundCooldown) {
    soundManager.play(430, 0.07, 0.05);
    dashSoundCooldown = now + 350;
  }
  if (frameCount % 4 === 0) effects.burst(snake.pos.x, snake.pos.y, '#98e9ff', 2, 3, 25);
}

function collectFood(now) {
  collectFoodForSnake(snake, true);
  compactFoodOrbs();
}

function collectFoodForSnake(targetSnake, isPlayer = false) {
  foodGrid.queryInto(targetSnake.pos, GAME_CONFIG.foodPickupRadius + GAME_CONFIG.foodAttractionRadius, VISIBLE_ORB_BUFFER);
  for (const orb of VISIBLE_ORB_BUFFER) {
    const dx = targetSnake.pos.x - orb.pos.x;
    const dy = targetSnake.pos.y - orb.pos.y;
    const pickupRadius = GAME_CONFIG.foodPickupRadius + orb.r;
    if (dx * dx + dy * dy > pickupRadius * pickupRadius || orb.consumed) continue;
    orb.consumed = true;
    if (isPlayer) {
      foodProgress += orb.value;
      while (foodProgress >= GAME_CONFIG.pointsPerSegment) {
        foodProgress -= GAME_CONFIG.pointsPerSegment;
        targetSnake.addSegment();
      }
    } else {
      targetSnake.foodProgress = (targetSnake.foodProgress || 0) + orb.value;
      while (targetSnake.foodProgress >= GAME_CONFIG.pointsPerSegment) {
        targetSnake.foodProgress -= GAME_CONFIG.pointsPerSegment;
        targetSnake.addSegment();
      }
    }
    effects.burst(orb.pos.x, orb.pos.y, orb.tint, 4, 2.5, 22);
    if (isPlayer) {
      score = snake.length;
      updateScore();
    }
  }
}

function rebuildCollisionGrid(aliveSnakes) {
  collisionGrid.clear();
  for (const owner of aliveSnakes) {
    if (owner.dead) continue;
    owner.owner = owner;
    owner.isHead = true;
    collisionGrid.insert(owner);
    for (const segment of owner.segments) {
      segment.owner = owner;
      segment.isHead = false;
      collisionGrid.insert(segment);
    }
  }
}

function resolveSnakeCollisions(aliveSnakes) {
  if (millis() < invulnerableUntil) return;
  for (const owner of aliveSnakes) {
    if (owner.dead) continue;
    collisionGrid.queryInto(owner.pos, GAME_CONFIG.collisionRadius, COLLISION_BUFFER);
    for (const part of COLLISION_BUFFER) {
      const other = part.owner;
      if (!other || other === owner || other.dead) continue;
      const collisionDistance = owner.r + part.r;
      const dx = owner.pos.x - part.pos.x;
      const dy = owner.pos.y - part.pos.y;
      if (dx * dx + dy * dy > collisionDistance * collisionDistance) continue;
      if (part.isHead) {
        if (owner.length <= other.length) {
          killSnake(owner, owner === snake ? 'collision' : other === snake ? 'player' : 'bot');
        } else {
          killSnake(other, other === snake ? 'collision' : owner === snake ? 'player' : 'bot');
        }
      } else {
        killSnake(owner, owner === snake ? 'collision' : other === snake ? 'player' : 'bot');
      }
      break;
    }
  }
}

function killSnake(victim, cause) {
  if (victim.dead) return;
  if (victim === snake) {
    startPlayerDeath(cause);
    return;
  }
  victim.dead = true;
  victim.respawnAt = millis() + GAME_CONFIG.botRespawnMs;
  disperseSnake(victim);
  if (cause === 'player') {
    playerKills++;
    snake.kills = playerKills;
    killMessageUntil = millis() + 2400;
    const message = document.getElementById('kill-message');
    message.textContent = `Tu as éliminé ${victim.name} !`;
    message.classList.add('visible');
    soundManager.play(920, 0.22, 0.12);
  }
}

function respawnBot(bot) {
  const replacement = createBot(bot.botId);
  replacement.respawnAt = Infinity;
  bots[bot.botId] = replacement;
}

function addScatteredOrb(x, y, tint) {
  if (foodOrbs.length >= GAME_CONFIG.foodCount) {
    let farthestIndex = -1;
    let farthestDistance = -1;
    for (let index = 0; index < foodOrbs.length; index++) {
      const orb = foodOrbs[index];
      if (orb.scattered) continue;
      const dx = orb.pos.x - x;
      const dy = orb.pos.y - y;
      const distance = dx * dx + dy * dy;
      if (distance > farthestDistance) {
        farthestIndex = index;
        farthestDistance = distance;
      }
    }
    if (farthestIndex < 0) {
      for (let index = 0; index < foodOrbs.length; index++) {
        const orb = foodOrbs[index];
        const dx = orb.pos.x - x;
        const dy = orb.pos.y - y;
        const distance = dx * dx + dy * dy;
        if (distance > farthestDistance) {
          farthestIndex = index;
          farthestDistance = distance;
        }
      }
    }
    if (farthestIndex >= 0) {
      foodOrbs[farthestIndex].consumed = true;
      removeFoodOrbAt(farthestIndex);
    }
  }
  const orb = createFoodOrb(x, y, 2, tint, true);
  foodOrbs.push(orb);
  return orb;
}

function disperseSnake(targetSnake) {
  const parts = [targetSnake, ...targetSnake.segments];
  for (const part of parts) {
    addScatteredOrb(part.pos.x, part.pos.y, targetSnake.color);
    effects.burst(part.pos.x, part.pos.y, targetSnake.color, 9, 7, 42);
  }
}

function updateCamera(now) {
  if (gameState !== 'dying') {
    cameraPosition.lerp(snake.pos, GAME_CONFIG.cameraEase);
    cameraTargetZoom = constrain(
      1 / Math.sqrt(Math.max(1, snake.length / GAME_CONFIG.initialSegments)),
      GAME_CONFIG.cameraMinZoom,
      1
    );
    if (gameState === 'starting') {
      const progress = constrain((now - introStartedAt) / GAME_CONFIG.introZoomDurationMs, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      cameraZoom = lerp(GAME_CONFIG.introStartZoom, cameraTargetZoom, eased);
    } else {
      cameraZoom = lerp(cameraZoom, cameraTargetZoom, GAME_CONFIG.cameraEase);
    }
  } else {
    cameraPosition.lerp(deathPosition, GAME_CONFIG.cameraDeathEase);
    cameraZoom = lerp(cameraZoom, Math.max(GAME_CONFIG.cameraMinZoom, GAME_CONFIG.cameraDeathZoom), GAME_CONFIG.cameraDeathZoomEase);
  }
}

function viewRadius() {
  return Math.hypot(width, height) / Math.max(cameraZoom, 0.1) * 0.55;
}

function isWorldPointVisible(x, y, padding = 0) {
  const halfWidth = width / (2 * cameraZoom) + padding;
  const halfHeight = height / (2 * cameraZoom) + padding;
  return Math.abs(x - cameraPosition.x) <= halfWidth &&
    Math.abs(y - cameraPosition.y) <= halfHeight;
}

function drawWorldGrid() {
  if (!backgroundPattern) return;
  const context = drawingContext;
  context.fillStyle = backgroundPattern;
  const halfWidth = width / (2 * cameraZoom) + GAME_CONFIG.worldGridSpacing;
  const halfHeight = height / (2 * cameraZoom) + GAME_CONFIG.worldGridSpacing;
  context.fillRect(cameraPosition.x - halfWidth, cameraPosition.y - halfHeight, halfWidth * 2, halfHeight * 2);
}

function drawWorldBoundary() {
  push();
  noFill();
  stroke('#ff3154');
  strokeWeight(10 / cameraZoom);
  rect(0, 0, GAME_CONFIG.worldWidth, GAME_CONFIG.worldHeight);
  pop();
}

function worldBoundaryForce(agent, margin) {
  const desired = agent.worldBoundaryDesired || (agent.worldBoundaryDesired = createVector(0, 0));
  const result = agent.worldBoundaryResult || (agent.worldBoundaryResult = createVector(0, 0));
  desired.set(0, 0);
  if (agent.pos.x < margin) desired.x = agent.maxSpeed;
  else if (agent.pos.x > GAME_CONFIG.worldWidth - margin) desired.x = -agent.maxSpeed;
  if (agent.pos.y < margin) desired.y = agent.maxSpeed;
  else if (agent.pos.y > GAME_CONFIG.worldHeight - margin) desired.y = -agent.maxSpeed;
  if (desired.magSq() === 0) return result.set(0, 0);
  desired.setMag(agent.maxSpeed);
  return result.set(desired).sub(agent.vel).limit(agent.maxForce);
}

function spawnMouseWhenDue() {
  if (mice.length >= GAME_CONFIG.maxMice || millis() < nextMouseSpawnAt) return;

  let x = random(80, GAME_CONFIG.worldWidth - 80);
  let y = random(80, GAME_CONFIG.worldHeight - 80);
  if (obstacles.length && random() < 0.65) {
    for (let attempt = 0; attempt < 8; attempt++) {
      x = random(80, GAME_CONFIG.worldWidth - 80);
      y = random(80, GAME_CONFIG.worldHeight - 80);
      if (obstacles.every(obstacle => dist(x, y, obstacle.pos.x, obstacle.pos.y) > obstacle.r + 30)) break;
    }
  }
  const mouse = createMouse(x, y, wave);
  mouse.spawnScale = 0;
  mouse.slitherReward = mouse.captureGrowth > 0
    ? GAME_CONFIG.specialPreyGrowth
    : mouse.captureGrowth;
  mice.push(mouse);
  nextMouseSpawnAt = millis() + random(GAME_CONFIG.spawnIntervalMs * 0.8, GAME_CONFIG.spawnIntervalMs * 1.2);
}

function updateCaptures(now) {
  const captureCandidates = spatialGrid.queryInto(snake.pos, GAME_CONFIG.captureDistance, CAPTURE_BUFFER);
  for (const mouse of captureCandidates) {
    const dx = snake.pos.x - mouse.pos.x;
    const dy = snake.pos.y - mouse.pos.y;
    const captureDistanceSq = GAME_CONFIG.captureDistance * GAME_CONFIG.captureDistance;
    if (!mouse.captured && dx * dx + dy * dy < captureDistanceSq) {
      mouse.captured = true;
      onMouseCaptured(mouse, now);
    }
  }
  compactMice();
}

function onMouseCaptured(mouse, now) {
  caughtMice++;
  captureTimes.push(now);
  while (captureTimes.length && now - captureTimes[0] > GAME_CONFIG.comboWindowMs) captureTimes.shift();
  comboMultiplier = Math.min(GAME_CONFIG.comboMaxMultiplier, Math.max(1, captureTimes.length));
  comboUntil = now + GAME_CONFIG.comboWindowMs;

  const points = mouse.scoreBonus * comboMultiplier;
  const captureGrowth = mouse.slitherReward ?? mouse.captureGrowth;
  score += points;
  if (captureGrowth > 0) {
    for (let index = 0; index < captureGrowth; index++) snake.addSegment();
    effects.burst(mouse.pos.x, mouse.pos.y, mouse.tint, 18, 5, 42);
    soundManager.play(mouse.kind === 'golden' ? 880 : 620);
    addFloatingMessage(mouse.pos.x, mouse.pos.y, `+${captureGrowth}  +${points} x${comboMultiplier}`, mouse.tint);
  } else if (mouse.kind === 'toxic') {
    cutSnake(snake.segments.length - 2, mouse.pos.x, mouse.pos.y);
    effects.burst(mouse.pos.x, mouse.pos.y, mouse.tint, 24, 6, 45);
    addFloatingMessage(mouse.pos.x, mouse.pos.y, 'TOXIQUE !', mouse.tint);
  } else {
    effects.burst(mouse.pos.x, mouse.pos.y, mouse.tint, 20, 5, 42);
  }

  if (mouse.kind === 'icy') {
    slowUntil = now + GAME_CONFIG.iceDurationMs;
    addFloatingMessage(mouse.pos.x, mouse.pos.y - 18, 'RALENTI', '#91e4ff');
  } else if (mouse.kind === 'magnet') {
    magnetUntil = now + GAME_CONFIG.magnetDurationMs;
    addFloatingMessage(mouse.pos.x, mouse.pos.y - 18, 'AIMANT !', '#d69bff');
  }

  if (captureTimes.length >= GAME_CONFIG.comboShieldCount) {
    shieldUntil = now + GAME_CONFIG.shieldDurationMs;
    shieldFlash = 1;
    captureTimes.length = 0;
    soundManager.play(1040, 0.3, 0.17);
    addFloatingMessage(snake.pos.x, snake.pos.y - 40, `BOUCLIER x${comboMultiplier}`, '#8df5ff');
  }
  if (mouse.slitherReward !== undefined) score = snake.length;
  updateScore();
  updateBestScore();
  if (snake.segments.length + 1 <= 1) startPlayerDeath('collision');
}

const CAPTURE_BUFFER = [];

function compactMice() {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < mice.length; readIndex++) {
    if (!mice[readIndex].captured) mice[writeIndex++] = mice[readIndex];
  }
  mice.length = writeIndex;
}

function cutSnake(segmentIndex, x, y) {
  const start = Math.max(0, Math.min(segmentIndex, snake.segments.length));
  if (start >= snake.segments.length) {
    startPlayerDeath('collision');
    return;
  }
  snake.segments.length = start;
  effects.burst(x, y, '#ffb25e', 22, 7, 38);
  screenShake = GAME_CONFIG.screenShake;
  soundManager.play(180, 0.25, 0.16);
  if (snake.segments.length + 1 <= 1) startPlayerDeath('collision');
}

function updateRaptors(now) {
  for (const raptor of raptors) {
    raptor.update(snake, obstacles, now);
    if (now < shieldUntil) continue;
    const headDx = raptor.pos.x - snake.pos.x;
    const headDy = raptor.pos.y - snake.pos.y;
    const headRadius = raptor.r + snake.r;
    if (headDx * headDx + headDy * headDy < headRadius * headRadius) {
      cutSnake(snake.segments.length - 2, raptor.pos.x, raptor.pos.y);
      continue;
    }
    for (let index = 0; index < snake.segments.length; index++) {
      const segment = snake.segments[index];
      const dx = raptor.pos.x - segment.pos.x;
      const dy = raptor.pos.y - segment.pos.y;
      const radius = raptor.r + segment.r;
      if (dx * dx + dy * dy < radius * radius) {
        cutSnake(index, segment.pos.x, segment.pos.y);
        break;
      }
    }
  }
}

function updateWave(now) {
  if (now < nextWaveAt) return;
  wave++;
  const count = GAME_CONFIG.raptorBaseCount + Math.floor((wave - 1) / 2);
  spawnRaptors(count);
  nextWaveAt = now + GAME_CONFIG.raptorWaveIntervalMs;
  document.getElementById('wave').textContent = String(wave);
  addFloatingMessage(width / 2, height * 0.25, `VAGUE ${wave}`, '#a9d8ff');
}

function spawnRaptors(count) {
  for (let index = 0; index < count; index++) {
    const side = Math.floor(random(4));
    const x = side === 0 ? -30 : side === 1 ? width + 30 : random(width);
    const y = side === 2 ? -30 : side === 3 ? height + 30 : random(height);
    raptors.push(new Raptor(x, y, wave));
  }
}

function updateDash(now) {
  dashActive = mouseIsPressed && energy > 0 && now >= slowUntil;
  if (dashActive) {
    energy = Math.max(0, energy - GAME_CONFIG.dashEnergyCost / 60);
    if (now > dashSoundCooldown) {
      soundManager.play(430, 0.07, 0.05);
      dashSoundCooldown = now + 350;
    }
    if (frameCount % 4 === 0) effects.burst(snake.pos.x, snake.pos.y, '#98e9ff', 2, 3, 25);
  } else {
    energy = Math.min(1, energy + GAME_CONFIG.energyRecharge / 60);
  }
}

function updateCombo(now) {
  if (comboUntil && now >= comboUntil) {
    comboMultiplier = 1;
    captureTimes.length = 0;
    comboUntil = 0;
  }
}

function startPlayerDeath(cause) {
  if (gameState === 'dying' || gameState === 'gameover') return;
  gameState = 'dying';
  snake.dead = true;
  deathStartedAt = millis();
  deathNextSegmentAt = deathStartedAt;
  deathSegmentIndex = 0;
  deathSegments = [snake, ...snake.segments];
  deathOrbs.length = 0;
  shockwaves.length = 0;
  deathLength = snake.length;
  if (!deathPosition) deathPosition = snake.pos.copy();
  else deathPosition.set(snake.pos);
  shockwaves.push(new Shockwave(snake.pos.x, snake.pos.y, '#ff3658', 55, 16));
  screenShake = GAME_CONFIG.deathShake * activeQuality.shake;
  screenFlashUntil = deathStartedAt + GAME_CONFIG.deathFlashMs;
  deathWasRecord = deathLength > bestScoreAtStart;
  score = deathLength;
  updateBestScore();
  soundManager.playDeath();
  const overlay = document.getElementById('death-vignette');
  if (overlay) overlay.hidden = false;
  snake.deathCause = cause;
}

function updateDeathSequence(now) {
  const perSegmentDelay = Math.min(
    GAME_CONFIG.deathSegmentDelayMs,
    GAME_CONFIG.deathSlowMotionMs / Math.max(deathSegments.length, 1)
  );
  while (deathSegmentIndex < deathSegments.length && now >= deathNextSegmentAt) {
    const currentIndex = deathSegmentIndex;
    const part = deathSegments[deathSegmentIndex++];
    part.visible = false;
    if (part === snake) snake.headVisible = false;
    const orb = addScatteredOrb(part.pos.x, part.pos.y, snake.color);
    orb.vel.set(cos(deathSegmentIndex * 2.4) * 6, sin(deathSegmentIndex * 2.4) * 6);
    deathOrbs.push(orb);
    if (currentIndex % activeQuality.deathStride === 0) {
      effects.burst(part.pos.x, part.pos.y, snake.color, 16, 9, 52);
      shockwaves.push(new Shockwave(part.pos.x, part.pos.y, snake.color, 34, 12));
    }
    deathNextSegmentAt += perSegmentDelay / activeQuality.deathStride;
    screenShake = Math.max(screenShake, GAME_CONFIG.deathShake * activeQuality.shake * (1 - deathSegmentIndex / deathSegments.length));
  }
  if (frameCount % GAME_CONFIG.deathTimeScaleDivisor === 0) {
    for (const orb of deathOrbs) orb.update(null, now);
  }
  if (now - deathStartedAt >= GAME_CONFIG.deathSlowMotionMs &&
      deathSegmentIndex >= deathSegments.length) finishGame(now);
}

function finishGame(now = millis()) {
  if (gameState === 'gameover') return;
  gameState = 'gameover';
  updateBestScore();
  document.getElementById('final-score').textContent = String(deathLength || score);
  document.getElementById('final-kills').textContent = String(playerKills);
  document.getElementById('final-survival').textContent = `${Math.max(0, ((now - gameStartedAt) / 1000) | 0)} s`;
  document.getElementById('final-best').textContent = String(bestScore);
  document.getElementById('new-record').hidden = !deathWasRecord;
  document.getElementById('gameover-menu').hidden = false;
  document.getElementById('settings-button').hidden = true;
  document.getElementById('countdown').hidden = true;
  hideSettingsControls();
  const overlay = document.getElementById('death-vignette');
  if (overlay) overlay.hidden = true;
}

function returnToMenu() {
  gameState = 'menu';
  snake = null;
  mice.length = 0;
  raptors.length = 0;
  bots.length = 0;
  for (let index = 0; index < foodOrbs.length; index++) releaseFoodOrb(foodOrbs[index]);
  foodOrbs.length = 0;
  effects.clear();
  shockwaves.length = 0;
  deathOrbs.length = 0;
  clearFloatingMessages();
  document.getElementById('gameover-menu').hidden = true;
  document.getElementById('pause-menu').hidden = true;
  document.getElementById('game-hud').hidden = true;
  document.getElementById('leaderboard').hidden = true;
  document.getElementById('minimap').hidden = true;
  document.getElementById('settings-button').hidden = true;
  document.getElementById('start-menu').hidden = false;
  document.getElementById('start-menu').classList.remove('exiting');
  menuColorPicker.show();
  const overlay = document.getElementById('death-vignette');
  if (overlay) overlay.hidden = true;
  soundManager.stop();
}

function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  document.getElementById('pause-menu').hidden = false;
}

function resumeGame() {
  if (gameState !== 'paused') return;
  gameState = 'playing';
  if (qualityMode === 'auto') {
    autoSamplingStartedAt = 0;
    autoInitialSamples = 0;
    autoInitialFpsSum = 0;
  }
  document.getElementById('pause-menu').hidden = true;
}

function openSettings() {
  if (gameState !== 'playing') return;
  gameState = 'settings';
  document.getElementById('settings-panel').hidden = false;
  showSettingsControls();
}

function closeSettings() {
  if (gameState !== 'settings') return;
  hideSettingsControls();
  document.getElementById('settings-panel').hidden = true;
  gameState = 'playing';
}

function resetSettings() {
  Object.assign(GAME_CONFIG, GAME_CONFIG_DEFAULTS);
  selectedSnakeColor = GAME_CONFIG_DEFAULTS.snakeColor;
  selectedSnakeShape = GAME_CONFIG_DEFAULTS.snakeShape;

  for (const [key, slider] of Object.entries(gameSliders)) {
    slider.value(GAME_CONFIG[key]);
  }
  menuColorPicker.value(selectedSnakeColor);
  settingsColorPicker.value(selectedSnakeColor);
  document.getElementById('menu-shape').value = selectedSnakeShape;
  document.getElementById('settings-shape').value = selectedSnakeShape;
  updateSettingOutputs();
  syncSnakeAppearance();
  renderFrameLimit30 = false;
  document.getElementById('limit-30-fps').checked = false;
  setQualityMode('medium');
  obstacles = createObstacles(GAME_CONFIG.obstacleCount);
  indexObstacles(obstacles);
  applyConfigToEntities();
}

function setSnakeColor(value) {
  selectedSnakeColor = value;
  GAME_CONFIG.snakeColor = value;
  if (activeQuality.glow) ensureGlowSprite(value);
  menuColorPicker.value(value);
  settingsColorPicker.value(value);
  syncSnakeAppearance();
}

function syncSnakeAppearance() {
  if (snake) {
    snake.color = selectedSnakeColor;
    snake.shape = selectedSnakeShape;
    snake.refreshSegmentColors();
  }
  updateSnakePreview();
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.toggle('selected', swatch.getAttribute('aria-label') === `Couleur ${selectedSnakeColor}`);
  });
}

function updateSnakePreview() {
  const preview = document.getElementById('snake-preview');
  preview.dataset.shape = selectedSnakeShape;
  preview.style.setProperty('--snake-color', selectedSnakeColor);
}

function synchronizeRelatedSettings(changedKey) {
  if (changedKey === 'minSpacing' && GAME_CONFIG.minSpacing > GAME_CONFIG.maxSpacing) {
    GAME_CONFIG.maxSpacing = GAME_CONFIG.minSpacing;
    gameSliders.maxSpacing.value(GAME_CONFIG.maxSpacing);
  } else if (changedKey === 'maxSpacing' && GAME_CONFIG.maxSpacing < GAME_CONFIG.minSpacing) {
    GAME_CONFIG.minSpacing = GAME_CONFIG.maxSpacing;
    gameSliders.minSpacing.value(GAME_CONFIG.minSpacing);
  }
}

function updateSettingOutputs() {
  for (const [key, slider] of Object.entries(gameSliders)) {
    const value = slider.value();
    const unit = key === 'captureDistance' ? ' px' : key === 'spawnIntervalMs' ? ' ms' : '';
    document.getElementById(`${key}-value`).value = `${value}${unit}`;
  }
}

function applyConfigToEntities() {
  if (!snake) return;
  snake.maxSpeed = GAME_CONFIG.snakeSpeed;
  snake.r = GAME_CONFIG.snakeSize;
  mice.length = Math.min(mice.length, GAME_CONFIG.maxMice);
  for (const segment of snake.segments) {
    segment.maxSpeed = GAME_CONFIG.snakeSpeed;
    segment.r = GAME_CONFIG.snakeSize;
  }
}

function showSettingsControls() {
  Object.values(gameSliders).forEach(slider => slider.show());
  settingsColorPicker.show();
}

function hideSettingsControls() {
  Object.values(gameSliders).forEach(slider => slider.hide());
  if (settingsColorPicker) settingsColorPicker.hide();
}

function updateScore() {
  document.getElementById('score').textContent = String(score);
  document.getElementById('caught-count').textContent = String(caughtMice);
}

function updateFloatingMessages() {
  for (let index = floatingMessages.length - 1; index >= 0; index--) {
    const message = floatingMessages[index];
    message.update();
    message.show();
    if (message.life <= 0) {
      message.active = false;
      floatingMessages[index] = floatingMessages[floatingMessages.length - 1];
      floatingMessages.pop();
    }
  }
}

function addFloatingMessage(x, y, text, tint) {
  for (const message of floatingMessagePool) {
    if (message.active) continue;
    message.activate(x, y, text, tint);
    floatingMessages.push(message);
    return message;
  }
  return null;
}

function clearFloatingMessages() {
  for (const message of floatingMessages) message.active = false;
  floatingMessages.length = 0;
}

function updateHud() {
  document.getElementById('energy-meter').style.width = `${energy * 100}%`;
  document.getElementById('combo').textContent = String(comboMultiplier);
  const comboRemaining = comboUntil ? Math.max(0, comboUntil - millis()) / GAME_CONFIG.comboWindowMs : 0;
  document.getElementById('combo-meter').style.width = `${comboRemaining * 100}%`;
  document.getElementById('game-hud').classList.toggle('shield-active', millis() < shieldUntil);
  document.getElementById('game-hud').classList.toggle('magnet-active', millis() < magnetUntil);
}

function drawHudOverlay(now) {
  if (!snake || gameState === 'menu') return;
  document.getElementById('score').textContent = String(snake.length);
  document.getElementById('caught-count').textContent = String(playerKills);
  document.getElementById('world-coordinates').textContent =
    `${Math.round(snake.pos.x)}, ${Math.round(snake.pos.y)}`;
  document.getElementById('kill-message').classList.toggle('visible', now < killMessageUntil);
  if (gameState === 'starting' && now - introStartedAt >= GAME_CONFIG.introFadeMs) {
    document.getElementById('start-menu').hidden = true;
  }
}

function updateLeaderboard() {
  const panel = document.getElementById('leaderboard');
  if (!panel || !snake) return;
  let entryCount = 0;
  for (const bot of bots) {
    if (bot.dead) continue;
    let entry = leaderboardEntries[entryCount];
    if (!entry) {
      entry = leaderboardEntries[entryCount] = { name: '', length: 0, player: false };
    }
    entry.name = bot.name;
    entry.length = bot.length;
    entry.player = false;
    entryCount++;
  }
  let playerEntry = leaderboardEntries[entryCount];
  if (!playerEntry) {
    playerEntry = leaderboardEntries[entryCount] = { name: '', length: 0, player: true };
  }
  playerEntry.name = playerName;
  playerEntry.length = snake.length;
  playerEntry.player = true;
  entryCount++;
  leaderboardEntries.length = entryCount;
  const entries = leaderboardEntries;
  entries.sort((left, right) => right.length - left.length);
  let playerRank = 1;
  for (let index = 0; index < entries.length; index++) {
    if (entries[index].player) {
      playerRank = index + 1;
      break;
    }
  }
  if (!leaderboardHeading) {
    leaderboardHeading = document.createElement('h2');
    leaderboardHeading.textContent = 'Classement';
    leaderboardList = document.createElement('ol');
    panel.append(leaderboardHeading, leaderboardList);
    leaderboardRows = Array.from({ length: 11 }, () => {
      const item = document.createElement('li');
      leaderboardList.appendChild(item);
      return item;
    });
  }
  for (let index = 0; index < leaderboardRows.length; index++) {
    const item = leaderboardRows[index];
    const entry = index < 10 ? entries[index] : playerRank > 10 ? entries[playerRank - 1] : null;
    item.hidden = !entry;
    item.className = entry && entry.player ? 'player-rank' : '';
    if (entry) {
      item.textContent = `${entry.player ? `#${playerRank} ` : ''}${entry.name} · ${entry.length}`;
    }
  }
}

function drawMinimap() {
  if (!snake || document.getElementById('minimap').hidden) return;
  minimapFrame++;
  if (minimapFrame % activeQuality.minimapInterval !== 0) return;
  const canvas = document.getElementById('minimap-canvas');
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = 'rgba(4, 14, 19, 0.88)';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(255, 55, 83, .9)';
  context.lineWidth = 2;
  context.strokeRect(1, 1, width - 2, height - 2);
  for (const bot of bots) {
    if (bot.dead) continue;
    context.fillStyle = bot.color;
    context.beginPath();
    context.arc(bot.pos.x / GAME_CONFIG.worldWidth * width, bot.pos.y / GAME_CONFIG.worldHeight * height, 2.4, 0, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(snake.pos.x / GAME_CONFIG.worldWidth * width, snake.pos.y / GAME_CONFIG.worldHeight * height, 4, 0, Math.PI * 2);
  context.fill();
}

function drawEntryTransition(now) {
  const elapsed = now - screenShockStartedAt;
  if (gameState !== 'starting' && elapsed > GAME_CONFIG.introShockwaveMs) return;
  push();
  resetMatrix();
  noFill();
  const progress = constrain(elapsed / GAME_CONFIG.introShockwaveMs, 0, 1);
  const radius = progress * Math.hypot(width, height) * 0.72;
  stroke(105, 255, 236, (1 - progress) * 230);
  strokeWeight(Math.max(1, 12 * (1 - progress)));
  circle(width / 2, height / 2, radius * 2);
  if (now < screenFlashUntil) {
    noStroke();
    fill(255, 255, 255, map(screenFlashUntil - now, 0, GAME_CONFIG.introFlashMs, 0, 165));
    rect(0, 0, width, height);
  }
  pop();
}

function drawDyingSnake() {
  if (deathSegmentIndex < deathSegments.length) snake.show();
}

function drawDeathOverlay(now) {
  const elapsed = now - deathStartedAt;
  const progress = constrain(elapsed / GAME_CONFIG.deathSlowMotionMs, 0, 1);
  push();
  resetMatrix();
  noStroke();
  fill(150, 0, 18, 42 * (1 - progress));
  rect(0, 0, width, height);
  if (now < screenFlashUntil) {
    fill(255, 28, 42, map(screenFlashUntil - now, 0, GAME_CONFIG.deathFlashMs, 0, 130));
    rect(0, 0, width, height);
  }
  noFill();
  if (activeQuality.vignette) {
    for (let index = 0; index < GAME_CONFIG.deathVignetteBands; index++) {
      stroke(255, 15, 40, (GAME_CONFIG.deathVignetteBands - index) * progress * 4);
      strokeWeight(2 + index * 4);
      rect(index * 2, index * 2, width - index * 4, height - index * 4);
    }
  }
  if (activeQuality.chromatic) {
    stroke(255, 255, 255, (1 - progress) * 85);
    strokeWeight(1);
    for (let index = 0; index < GAME_CONFIG.deathScanlines; index++) {
      const y = random(height);
      line(0, y, width, y + random(-4, 4));
    }
  }
  const glitchProgress = activeQuality.chromatic ? constrain(1 - elapsed / GAME_CONFIG.deathGlitchMs, 0, 1) : 0;
  if (glitchProgress > 0) {
    stroke(255, 30, 65, 150 * glitchProgress);
    line(5 * glitchProgress, height * 0.48, width * 0.47, height * 0.48);
    stroke(35, 255, 235, 150 * glitchProgress);
    line(width * 0.53, height * 0.52, width - 5 * glitchProgress, height * 0.52);
  }
  pop();
}

function updateBestScore() {
  const currentBestCandidate = snake ? snake.length : score;
  if (currentBestCandidate > bestScore) {
    bestScore = currentBestCandidate;
    localStorage.setItem('snakeMiceBestScore', String(bestScore));
  }
  const menuScore = document.getElementById('best-score');
  if (menuScore) menuScore.textContent = String(bestScore);
}

function toggleMute() {
  const enabled = soundManager.toggle();
  document.getElementById('mute-button').textContent = enabled ? '♫' : '×';
  document.getElementById('mute-setting').checked = enabled;
}

function setSoundEnabled(enabled) {
  if (soundManager.enabled !== enabled) soundManager.toggle();
  document.getElementById('mute-button').textContent = enabled ? '♫' : '×';
}

function drawShieldFlash() {
  if (shieldFlash <= 0) return;
  push();
  noStroke();
  fill(125, 230, 255, shieldFlash * 65);
  rect(0, 0, width, height);
  pop();
  shieldFlash *= 0.88;
  if (shieldFlash < 0.015) shieldFlash = 0;
}

function drawDebugOverlay() {
  push();
  noFill();
  stroke('#ffd84d');
  circle(snake.pos.x, snake.pos.y, GAME_CONFIG.captureDistance * 2);
  drawVector(snake.pos, snake.vel, '#62d9ff', 'vitesse');
  drawVector(snake.pos, snake.debugForce, '#8aff9a', 'seek');
  for (const mouse of mice) {
    stroke('#76efff');
    circle(mouse.pos.x, mouse.pos.y, GAME_CONFIG.mouseFleeRadius * 2);
    drawVector(mouse.pos, mouse.vel, '#63d9ff', 'v');
    drawVector(mouse.pos, mouse.debugFlee, '#ff697f', 'flee');
    drawVector(mouse.pos, mouse.debugSeparation, '#fcbf56', 'sep');
    drawVector(mouse.pos, mouse.debugCohesion, '#8cfa8c', 'coh');
    drawVector(mouse.pos, mouse.debugAlignment, '#b88bff', 'align');
    drawVector(mouse.pos, mouse.debugAvoidance, '#ff994f', 'avoid');
  }
  for (const raptor of raptors) {
    drawVector(raptor.pos, raptor.vel, '#78d9ff', 'v');
    drawVector(raptor.pos, raptor.seekForce, '#ff7188', 'pursue');
    drawVector(raptor.pos, raptor.avoidForce, '#ff994f', 'avoid');
    if (raptor.targetLocked) {
      stroke('#ff7188');
      line(raptor.pos.x, raptor.pos.y, snake.pos.x + snake.vel.x * 10, snake.pos.y + snake.vel.y * 10);
      circle(snake.pos.x + snake.vel.x * 10, snake.pos.y + snake.vel.y * 10, 12);
    }
    for (const bot of bots) {
      if (bot.dead) continue;
      noFill();
      stroke('#ff7c6e');
      circle(bot.pos.x, bot.pos.y, bot.r * 2);
      drawVector(bot.pos, bot.vel, '#ff7c6e', 'bot v');
      drawVector(bot.pos, bot.debugForce, '#ffe06a', 'seek');
      for (const segment of bot.segments) {
        stroke('#ff9b72');
        circle(segment.pos.x, segment.pos.y, segment.r * 2);
      }
    }
  }
  pop();
}

function drawPerformanceOverlay(now) {
  push();
  resetMatrix();
  noStroke();
  fill(3, 10, 15, 205);
  rect(8, 8, 310, 112, 8);
  fill('#e7f4f0');
  textAlign(LEFT, TOP);
  textSize(12);
  let activeParticles = 0;
  if (effects) {
    for (const particle of effects.pool) if (particle.active) activeParticles++;
  }
  const memoryMb = performance.memory
    ? `${(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB`
    : 'indisponible';
  const presetName = activeQuality === GAME_CONFIG.QUALITY.low ? 'Low'
    : activeQuality === GAME_CONFIG.QUALITY.medium ? 'Medium' : 'High';
  text(
    `FPS ${Math.round(frameRate())} (moy. ${fpsAverage.toFixed(1)}) · preset ${qualityMode === 'auto' ? `Auto/${presetName}` : presetName}\n` +
    `update ${updateTimeMs.toFixed(2)} ms · draw ${drawTimeMs.toFixed(2)} ms\n` +
    `bots ${bots.length} · orbes ${VISIBLE_ORB_BUFFER.length}/${foodOrbs.length} · particules ${activeParticles}\n` +
    `mémoire JS ${memoryMb} · ${Math.round(now)} ms`,
    18,
    16
  );
  pop();
}

function drawVector(origin, vector, tint, label) {
  stroke(tint);
  strokeWeight(1.5);
  line(origin.x, origin.y, origin.x + vector.x * 18, origin.y + vector.y * 18);
  noStroke();
  fill(tint);
  textSize(9);
  text(label, origin.x + vector.x * 18, origin.y + vector.y * 18);
}

function keyPressed() {
  if (key === 'F3' || keyCode === 114) {
    debugMode = !debugMode;
    return false;
  }
  if (key === '1' || key === '2' || key === '3') {
    setQualityMode(key === '1' ? 'low' : key === '2' ? 'medium' : 'high');
    return false;
  }
  if (key === 'd' || key === 'D') {
    debugMode = !debugMode;
    return false;
  }
  if (key === 'Escape' || keyCode === ESCAPE) {
    if (gameState === 'settings') {
      closeSettings();
      pauseGame();
    } else if (gameState === 'playing') {
      pauseGame();
    } else if (gameState === 'paused') {
      resumeGame();
    }
    return false;
  }
  if ((key === 'p' || key === 'P') && gameState !== 'menu' && gameState !== 'gameover') {
    if (gameState === 'settings') closeSettings();
    else if (gameState === 'paused') resumeGame();
    else openSettings();
  }
  if (key === ' ' || keyCode === 32) {
    spaceBoost = true;
    return false;
  }
}

function keyReleased() {
  if (key === ' ' || keyCode === 32) spaceBoost = false;
}

function windowResized() {
  resizeCanvasToDisplay();
  stars = createBackgroundStars(60);
}
