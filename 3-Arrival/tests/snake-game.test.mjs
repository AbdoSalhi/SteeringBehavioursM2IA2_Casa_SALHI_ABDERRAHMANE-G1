import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) { this.set(x, y); }
  set(x, y) {
    if (typeof x === 'object') { this.x = x.x; this.y = x.y; }
    else { this.x = x; this.y = y; }
    return this;
  }
  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  div(value) { this.x /= value; this.y /= value; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  magSq() { return this.x * this.x + this.y * this.y; }
  setMag(value) { const magnitude = this.mag(); return magnitude ? this.mult(value / magnitude) : this; }
  limit(value) { return this.mag() > value ? this.setMag(value) : this; }
  copy() { return new Vector(this.x, this.y); }
  heading() { return Math.atan2(this.y, this.x); }
  lerp(vector, amount) {
    this.x += (vector.x - this.x) * amount;
    this.y += (vector.y - this.y) * amount;
    return this;
  }
  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static random2D() { return new Vector(1, 0); }
}

function createScene() {
  const elements = new Map();
  let currentTime = 0;
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      hidden: false,
      textContent: '',
      value: '',
      addEventListener() {}
    });
    return elements.get(id);
  };
  const context = vm.createContext({
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    width: 800,
    height: 600,
    windowWidth: 800,
    windowHeight: 600,
    frameCount: 0,
    mouseX: 400,
    mouseY: 300,
    random: (min, max) => {
      if (Array.isArray(min)) return min[0];
      return max === undefined ? min / 2 : min + (max - min) / 2;
    },
    cos: Math.cos,
    sin: Math.sin,
    map: (value, start1, stop1, start2, stop2) =>
      start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1)),
    constrain: (value, min, max) => Math.max(min, Math.min(max, value)),
    lerp: (start, stop, amount) => start + (stop - start) * amount,
    color: value => ({ value, toString: () => value }),
    lerpColor: (start, end, amount) => ({
      toString: () => amount < 0.5 ? start.value : end.value
    }),
    mouseIsPressed: false,
    TWO_PI: Math.PI * 2,
    PI: Math.PI,
    HALF_PI: Math.PI / 2,
    QUARTER_PI: Math.PI / 4,
    millis: () => currentTime,
    performance: { now: () => currentTime },
    frameRate: () => 45,
    document: {
      getElementById: element,
      querySelectorAll: () => []
    },
    localStorage: {
      getItem: () => '0',
      setItem() {}
    },
    push() {},
    pop() {},
    fill() {},
    circle() {},
    noFill() {},
    stroke() {},
    strokeWeight() {},
    line() {},
    text() {},
    textAlign() {},
    textSize() {},
    drawingContext: { set shadowBlur(value) {}, set shadowColor(value) {} },
    hex: value => Math.max(0, value).toString(16).padStart(2, '0').slice(-2)
  });

  for (const file of [
    'vehicle.js', 'spatialGrid.js', 'steering.js', 'obstacle.js',
    'mouse.js', 'raptor.js', 'snake.js', 'foodOrb.js', 'snakeBot.js',
    'effects.js', 'gameSound.js', 'sketch.js'
  ]) {
    vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  }
  return { context, element, setTime: value => { currentTime = value; } };
}

test('le serpent démarre avec dix véhicules et les segments suivent par steering', () => {
  const { context } = createScene();
  const { Vehicle, Snake } = vm.runInContext('({ Vehicle, Snake })', context);
  const snake = new Snake(100, 100);
  const initialPosition = snake.pos.copy();

  assert.ok(snake instanceof Vehicle);
  assert.equal(snake.segments.length + 1, 10);
  assert.ok(snake.segments.every(segment => segment instanceof Vehicle));

  snake.update(new Vector(200, 100));
  assert.ok(Vector.dist(initialPosition, snake.pos) <= snake.maxForce);
  assert.equal(snake.acc.mag(), 0);
});

test('chaque croissance ajoute un cercle exactement à la position de la queue', () => {
  const { context } = createScene();
  const { Snake } = vm.runInContext('({ Snake })', context);
  const snake = new Snake(100, 100);
  const tail = snake.segments.at(-1).pos.copy();
  const initialCount = snake.segments.length;

  snake.addSegment();
  const newSegment = snake.segments.at(-1);
  assert.equal(snake.segments.length, initialCount + 1);
  assert.deepEqual([newSegment.pos.x, newSegment.pos.y], [tail.x, tail.y]);
});

test('une capture strictement sous 100 px ajoute un seul segment et met à jour le score', () => {
  const { context, element } = createScene();
  vm.runInContext(`
    spatialGrid = new SpatialGrid(140);
    effects = { burst() {} };
    soundManager = { play() {} };
    snake = new Snake(100, 100);
    mice = [new Mouse(199, 100)];
    spatialGrid.insert(mice[0]);
    updateCaptures(0);
  `, context);

  assert.equal(vm.runInContext('mice.length', context), 0);
  assert.equal(vm.runInContext('caughtMice', context), 1);
  assert.equal(vm.runInContext('snake.segments.length', context), 10);
  assert.equal(vm.runInContext('score', context), 1);
  assert.equal(element('score').textContent, '1');
});

test('une souris à exactement 100 px n’est pas capturée', () => {
  const { context } = createScene();
  vm.runInContext(`
    spatialGrid = new SpatialGrid(140);
    effects = { burst() {} };
    soundManager = { play() {} };
    snake = new Snake(100, 100);
    mice = [new Mouse(200, 100)];
    spatialGrid.insert(mice[0]);
    updateCaptures(0);
  `, context);

  assert.equal(vm.runInContext('mice.length', context), 1);
  assert.equal(vm.runInContext('caughtMice', context), 0);
  assert.equal(vm.runInContext('snake.segments.length', context), 9);
});

test('un espacement éloigné s’étire progressivement puis revient en douceur', () => {
  const { context } = createScene();
  const { Snake } = vm.runInContext('({ Snake })', context);
  const snake = new Snake(100, 100);
  const minimum = vm.runInContext('GAME_CONFIG.minSpacing', context);
  const maximum = vm.runInContext('GAME_CONFIG.maxSpacing', context);

  snake.updateSpacing(new Vector(100, 100));
  assert.equal(snake.spacing, minimum);

  const beforeStretch = snake.spacing;
  snake.updateSpacing(new Vector(1000, 100));
  const afterOneFrame = snake.spacing;
  assert.ok(afterOneFrame > beforeStretch);
  assert.ok(afterOneFrame < maximum);

  for (let frame = 0; frame < 100; frame++) snake.updateSpacing(new Vector(1000, 100));
  const stretched = snake.spacing;
  assert.ok(stretched > afterOneFrame);

  snake.updateSpacing(new Vector(100, 100));
  assert.ok(snake.spacing < stretched);
  assert.ok(snake.spacing >= minimum && snake.spacing <= maximum);
});

test('les souris apparaissent à l’intervalle réglé sans dépasser le maximum', () => {
  const { context, setTime } = createScene();
  vm.runInContext('nextMouseSpawnAt = 1000;', context);
  setTime(999);
  vm.runInContext('spawnMouseWhenDue()', context);
  assert.equal(vm.runInContext('mice.length', context), 0);

  setTime(1000);
  vm.runInContext('spawnMouseWhenDue()', context);
  assert.equal(vm.runInContext('mice.length', context), 1);

  vm.runInContext('GAME_CONFIG.maxMice = 1; nextMouseSpawnAt = 0; spawnMouseWhenDue()', context);
  assert.equal(vm.runInContext('mice.length', context), 1);
});

test('les souris intelligentes fuient le serpent et les variantes ont leurs effets dédiés', () => {
  const { context } = createScene();
  vm.runInContext(`
    const threat = new Vehicle(200, 100);
    const prey = new Mouse(100, 100);
    prey.vel.set(0, 0);
    const escapeForce = fleeForce(prey, threat);
    const gold = new GoldenMouse(0, 0);
    const ice = new IcyMouse(0, 0);
    const toxic = new ToxicMouse(0, 0);
    const magnet = new MagnetMouse(0, 0);
    globalThis.mouseBehaviorResults = {
      escapeX: escapeForce.x,
      escapeMagnitude: escapeForce.mag(),
      golden: [gold.captureGrowth, gold.scoreBonus, gold.maxSpeed],
      icy: ice.kind,
      toxic: toxic.captureGrowth,
      magnet: magnet.kind
    };
  `, context);
  const result = context.mouseBehaviorResults;
  assert.ok(result.escapeX < 0);
  assert.ok(result.escapeMagnitude <= 0.12);
  assert.deepEqual(Array.from(result.golden), [3, 5, 4.1]);
  assert.equal(result.icy, 'icy');
  assert.equal(result.toxic, -2);
  assert.equal(result.magnet, 'magnet');
});

test('la somme des steering d’une souris reste limitée à sa force maximale', () => {
  const { context } = createScene();
  const result = vm.runInContext(`
    const prey = new Mouse(300, 300);
    prey.vel.set(0, 0);
    const threat = new Vehicle(350, 300);
    const grid = new SpatialGrid(140);
    prey.update(threat, grid, [], 0);
    [prey.vel.mag(), prey.maxForce];
  `, context);
  assert.ok(result[0] <= result[1]);
});

test('les captures dorées et toxiques appliquent leurs effets de score et de croissance', () => {
  const { context } = createScene();
  vm.runInContext(`
    spatialGrid = new SpatialGrid(140);
    effects = { burst() {} };
    soundManager = { play() {} };
    snake = new Snake(100, 100);
    mice = [new GoldenMouse(199, 100)];
    spatialGrid.insert(mice[0]);
    updateCaptures(1000);
    const goldenResult = [score, snake.segments.length];

    snake = new Snake(100, 100);
    mice = [new ToxicMouse(199, 100)];
    spatialGrid.clear();
    spatialGrid.insert(mice[0]);
    updateCaptures(2000);
    globalThis.captureVariantResults = {
      golden: goldenResult,
      toxic: [score, snake.segments.length, caughtMice]
    };
  `, context);
  assert.deepEqual(Array.from(context.captureVariantResults.golden), [5, 12]);
  assert.deepEqual(Array.from(context.captureVariantResults.toxic), [5, 7, 2]);
});

test('cinq captures dans le combo accordent un bouclier temporaire', () => {
  const { context } = createScene();
  vm.runInContext(`
    spatialGrid = new SpatialGrid(140);
    effects = { burst() {} };
    soundManager = { play() {} };
    snake = new Snake(100, 100);
    mice = Array.from({ length: 5 }, (_, index) => new Mouse(101 + index, 100));
    for (const mouse of mice) spatialGrid.insert(mouse);
    updateCaptures(2500);
  `, context);

  assert.equal(vm.runInContext('caughtMice', context), 5);
  assert.equal(vm.runInContext('comboMultiplier', context), 5);
  assert.equal(vm.runInContext('shieldUntil', context), 5500);
});

test('la perte du dernier segment déclenche le game over', () => {
  const { context, element } = createScene();
  vm.runInContext(`
    effects = { burst() {} };
    soundManager = { play() {}, playDeath() {} };
    snake = new Snake(100, 100);
    snake.segments.length = 1;
    cutSnake(1, 100, 100);
  `, context);

  assert.equal(vm.runInContext('gameState', context), 'dying');
  assert.equal(element('death-vignette').hidden, false);
});

test('la grande arène, les orbes et les bots utilisent des entités Vehicle', () => {
  const { context } = createScene();
  const result = vm.runInContext(`
    const orb = new FoodOrb(200, 220);
    const bot = new SnakeBot(300, 320, 0);
    [orb instanceof Vehicle, bot instanceof Vehicle, bot.length, GAME_CONFIG.worldWidth, GAME_CONFIG.botCount];
  `, context);
  assert.equal(result[0], true);
  assert.equal(result[1], true);
  assert.equal(result[2], 10);
  assert.equal(result[3], 6000);
  assert.equal(result[4], 20);
});

test('les orbes donnent un segment après le seuil configuré', () => {
  const { context } = createScene();
  vm.runInContext(`
    foodGrid = new SpatialGrid(140);
    foodOrbs = [new FoodOrb(100, 100, 1, '#ffd84d')];
    for (const orb of foodOrbs) foodGrid.insert(orb);
    snake = new Snake(100, 100);
    foodProgress = GAME_CONFIG.pointsPerSegment - 1;
    effects = { burst() {} };
    collectFood(0);
  `, context);
  assert.equal(vm.runInContext('snake.length', context), 11);
  assert.equal(vm.runInContext('foodOrbs.length', context), 0);
});

test('le boost consomme un segment et laisse une orbe derrière la queue', () => {
  const { context, setTime } = createScene();
  vm.runInContext(`
    snake = new Snake(100, 100);
    foodOrbs = [];
    effects = { burst() {} };
    soundManager = { play() {} };
    mouseIsPressed = true;
    nextBoostLossAt = 0;
  `, context);
  setTime(1000);
  vm.runInContext('updateSlitherBoost(1000)', context);
  setTime(1650);
  vm.runInContext('updateSlitherBoost(1650)', context);
  assert.equal(vm.runInContext('snake.length', context), 9);
  assert.equal(vm.runInContext('foodOrbs.length', context), 1);
  assert.equal(vm.runInContext('dashActive', context), true);
});

test('les orbes dispersées respectent la densité maximale du monde', () => {
  const { context } = createScene();
  vm.runInContext(`
    foodOrbs = [];
    for (let index = 0; index < GAME_CONFIG.foodCount; index++) {
      foodOrbs.push(new FoodOrb(index, 0));
    }
    const farthestOrb = foodOrbs[foodOrbs.length - 1];
    const scatteredOrb = addScatteredOrb(0, 0, '#ffffff');
    globalThis.scatteredOrbWasAdded = scatteredOrb.maxSpeed > 0;
    globalThis.farthestOrbWasReused = farthestOrb === scatteredOrb;
  `, context);
  assert.equal(vm.runInContext('foodOrbs.length', context), 1400);
  assert.equal(vm.runInContext('scatteredOrbWasAdded', context), true);
  assert.equal(vm.runInContext('farthestOrbWasReused', context), true);
});

test('une collision de tête avec le corps adverse lance la séquence de mort', () => {
  const { context } = createScene();
  vm.runInContext(`
    gameState = 'playing';
    snake = new Snake(100, 100);
    const rival = new SnakeBot(300, 300, 0);
    rival.segments[0].pos.set(snake.pos);
    bots = [rival];
    collisionGrid = new SpatialGrid(140);
    effects = { burst() {} };
    soundManager = { play() {}, playDeath() {} };
    deathPosition = createVector(0, 0);
    invulnerableUntil = -1;
    const alive = [snake, rival];
    rebuildCollisionGrid(alive);
    resolveSnakeCollisions(alive);
  `, context);
  assert.equal(vm.runInContext('gameState', context), 'dying');
  assert.equal(vm.runInContext('snake.deathCause', context), 'collision');
});

test('la séquence de mort disperse les segments en orbes avant le game over', () => {
  const { context, element, setTime } = createScene();
  vm.runInContext(`
    gameState = 'playing';
    snake = new Snake(100, 100);
    foodOrbs = [];
    effects = { burst() {} };
    soundManager = { play() {}, playDeath() {} };
    deathPosition = createVector(0, 0);
    gameStartedAt = 0;
    bestScoreAtStart = 0;
    startPlayerDeath('test');
  `, context);
  setTime(1300);
  vm.runInContext('updateDeathSequence(1300)', context);
  assert.equal(vm.runInContext('gameState', context), 'gameover');
  assert.equal(vm.runInContext('foodOrbs.length', context), 10);
  assert.equal(element('final-score').textContent, '10');
  assert.equal(element('final-kills').textContent, '0');
});

test('la grille spatiale renvoie uniquement les entités des cellules voisines', () => {
  const { context } = createScene();
  const result = vm.runInContext(`
    const grid = new SpatialGrid(100);
    const near = new Vehicle(40, 40);
    const far = new Vehicle(450, 450);
    grid.insert(near);
    grid.insert(far);
    grid.queryInto(createVector(50, 50), 80, []);
  `, context);
  assert.equal(result.length, 1);
});

test('les forces d’évitement et de bord réutilisent leurs vecteurs scratch', () => {
  const { context } = createScene();
  const results = vm.runInContext(`
    const agent = new Vehicle(10, 10);
    const obstacle = new Vehicle(190, 100);
    obstacle.r = 30;
    agent.vel.set(1, 0);
    indexObstacles([obstacle]);
    const avoidanceA = obstacleAvoidance(agent, [obstacle], 100);
    const avoidanceB = obstacleAvoidance(agent, [obstacle], 100);
    const boundaryA = boundaryForce(agent, 40);
    const boundaryB = boundaryForce(agent, 40);
    const worldBoundaryA = worldBoundaryForce(agent, 100);
    const worldBoundaryB = worldBoundaryForce(agent, 100);
    ({
      avoidanceReused: avoidanceA === avoidanceB,
      boundaryReused: boundaryA === boundaryB,
      worldBoundaryReused: worldBoundaryA === worldBoundaryB,
      forceWithinLimit: avoidanceA.mag() <= agent.maxForce + 1e-9
    });
  `, context);
  assert.equal(results.avoidanceReused, true);
  assert.equal(results.boundaryReused, true);
  assert.equal(results.worldBoundaryReused, true);
  assert.equal(results.forceWithinLimit, true);
});

test('les presets de qualité couvrent les niveaux de charge demandés', () => {
  const { context } = createScene();
  const presets = vm.runInContext('GAME_CONFIG.QUALITY', context);
  assert.deepEqual(
    ['low', 'medium', 'high'].map(name => [
      presets[name].bots,
      presets[name].orbs,
      presets[name].particles,
      presets[name].frameRate,
      presets[name].renderScale
    ]),
    [[6, 800, 150, 30, 0.75], [12, 1500, 400, 45, 0.9], [20, 3000, 1000, 60, 1]]
  );
  assert.equal(presets.low.glow, false);
  assert.equal(presets.high.glow, true);
  assert.equal(presets.auto.sampleDurationMs, 3000);
  assert.equal(presets.auto.lowerFps, 40);
  assert.equal(presets.auto.lowerHoldMs, 2000);
  assert.equal(presets.auto.raiseFps, 58);
  assert.equal(presets.auto.raiseHoldMs, 10000);
});

test('la qualité Auto mesure le FPS en jeu et ignore la transition de départ', () => {
  const { context, setTime } = createScene();
  setTime(1000);
  vm.runInContext(`
    qualityMode = 'auto';
    autoSamplingStartedAt = 0;
    autoInitialSamples = 0;
    gameState = 'starting';
    measurePerformance(1000, 0);
  `, context);
  assert.equal(vm.runInContext('autoSamplingStartedAt', context), 0);
  assert.equal(vm.runInContext('autoInitialSamples', context), 0);

  vm.runInContext(`
    gameState = 'playing';
    measurePerformance(1100, 0);
  `, context);
  assert.equal(vm.runInContext('autoSamplingStartedAt', context), 1100);
  assert.equal(vm.runInContext('autoInitialSamples', context), 1);
});

test('les orbes libérées sont réutilisées par le pool sans changer de type', () => {
  const { context } = createScene();
  const reused = vm.runInContext(`
    const originalOrb = createFoodOrb(20, 30, 2, '#ffffff', true);
    releaseFoodOrb(originalOrb);
    const nextOrb = createFoodOrb(40, 50, 1, '#ffd84d', false);
    globalThis.foodOrbWasReused = originalOrb === nextOrb;
    [nextOrb instanceof FoodOrb, nextOrb.value, nextOrb.pos.x, nextOrb.pos.y, nextOrb.scattered];
  `, context);
  assert.equal(vm.runInContext('foodOrbWasReused', context), true);
  assert.deepEqual(Array.from(reused), [true, 1, 40, 50, false]);
});

test('le rapace poursuit à portée et revient au wander au-delà de sa distance de perte', () => {
  const { context } = createScene();
  vm.runInContext(`
    const bird = new Raptor(100, 100, 1);
    const target = new Vehicle(200, 100);
    bird.update(target, [], 0);
    const nearLock = bird.targetLocked;
    target.pos.set(1000, 1000);
    bird.update(target, [], 1);
    globalThis.raptorBehaviorResults = [nearLock, bird.targetLocked];
  `, context);
  assert.deepEqual(Array.from(context.raptorBehaviorResults), [true, false]);
});

test('le panneau des paramètres suspend le jeu et le reprend en fermeture', () => {
  const { context, element } = createScene();
  vm.runInContext('settingsColorPicker = { show() {}, hide() {} }; gameState = "playing"; openSettings();', context);
  assert.equal(vm.runInContext('gameState', context), 'settings');
  assert.equal(element('settings-panel').hidden, false);

  vm.runInContext('closeSettings()', context);
  assert.equal(vm.runInContext('gameState', context), 'playing');
  assert.equal(element('settings-panel').hidden, true);
});

test('le menu contient les six formes, les choix de couleur et le bouton PLAY', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="play-button"/);
  assert.match(html, /id="menu-color-palette"/);
  assert.match(html, /id="menu-color-picker"/);
  assert.match(html, /id="menu-shape"/);
  for (const shape of ['circle', 'glow', 'diamond', 'star', 'hexagon', 'tapered']) {
    assert.match(html, new RegExp(`value="${shape}"`));
  }
  assert.match(html, /id="settings-button"/);
  assert.match(html, /id="settings-close-bottom"/);
});
