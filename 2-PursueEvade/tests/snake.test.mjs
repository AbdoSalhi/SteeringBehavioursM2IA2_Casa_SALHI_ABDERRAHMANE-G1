import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) { this.x = x; this.y = y; return this; }
  copy() { return new Vector(this.x, this.y); }
  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  div(value) { this.x /= value; this.y /= value; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  normalize() { return this.mag() ? this.setMag(1) : this; }
  setMag(value) { const magnitude = this.mag(); return magnitude ? this.mult(value / magnitude) : this; }
  limit(value) { return this.mag() > value ? this.setMag(value) : this; }
  heading() { return Math.atan2(this.y, this.x); }

  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static fromAngle(angle) { return new Vector(Math.cos(angle), Math.sin(angle)); }
}

function createScene() {
  const calls = [];
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    map: (value, start1, stop1, start2, stop2) =>
      start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    random: (min = 1, max) => max === undefined ? min * 0.5 : (min + max) * 0.5,
    constrain: (value, min, max) => Math.min(Math.max(value, min), max),
    width: 800,
    height: 600,
    frameCount: 20,
    debug: false,
    PI: Math.PI,
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI / 2,
    sin: Math.sin,
    asin: Math.asin,
    color: value => value,
    lerpColor: (first, second, amount) => ({ first, second, amount }),
    push() { calls.push('push'); },
    pop() { calls.push('pop'); },
    stroke() { calls.push('stroke'); },
    strokeWeight() { calls.push('strokeWeight'); },
    fill() { calls.push('fill'); },
    noStroke() { calls.push('noStroke'); },
    noFill() { calls.push('noFill'); },
    circle() { calls.push('circle'); },
    ellipse() { calls.push('ellipse'); },
    line() { calls.push('line'); },
    translate() { calls.push('translate'); },
    rotate() { calls.push('rotate'); },
    triangle() { calls.push('triangle'); },
    vertex() { calls.push('vertex'); },
    bezierVertex() { calls.push('bezierVertex'); },
    beginShape() { calls.push('beginShape'); },
    endShape() { calls.push('endShape'); },
    textSize() { calls.push('textSize'); },
    text() { calls.push('text'); },
    CLOSE: 'close',
    drawArrow() { calls.push('drawArrow'); },
    calls
  });
  vm.runInContext(readFileSync(new URL('../vehicle.js', import.meta.url), 'utf8'), context);
  vm.runInContext(readFileSync(new URL('../snake.js', import.meta.url), 'utf8'), context);
  return context;
}

test('Snake crée une tête Vehicle et vingt segments régulièrement espacés', () => {
  const result = vm.runInContext(`
    const snake = new Snake(200, 150);
    ({
      headIsVehicle: snake.head instanceof Vehicle,
      headRadius: snake.head.r,
      speed: snake.head.maxSpeed,
      force: snake.head.maxForce,
      spacing: snake.segmentSpacing,
      count: snake.segments.length,
      firstDistance: p5.Vector.dist(snake.head.pos, snake.segments[0]),
      lastDistance: p5.Vector.dist(snake.segments[18], snake.segments[19])
    });
  `, createScene());
  assert.equal(result.headIsVehicle, true);
  assert.equal(result.headRadius, 12);
  assert.equal(result.speed, 4.5);
  assert.equal(result.force, 0.3);
  assert.equal(result.spacing, 9);
  assert.equal(result.count, 20);
  assert.equal(result.firstDistance, 9);
  assert.equal(result.lastDistance, 9);
});

test('la tête accélère progressivement vers la souris et le corps suit sans se casser', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    snake.update(new p5.Vector(300, 100), []);
    const firstStep = p5.Vector.dist(snake.head.pos, new p5.Vector(100, 100));
    for (let frame = 0; frame < 40; frame++) {
      frameCount++;
      snake.update(new p5.Vector(300, 100), []);
    }
    const lengths = snake.segments.map((segment, index) => {
      const leader = index === 0 ? snake.head.pos : snake.segments[index - 1];
      return p5.Vector.dist(leader, segment);
    });
    ({
      firstStep,
      laterX: snake.head.pos.x,
      minSpacing: Math.min(...lengths),
      maxSpacing: Math.max(...lengths),
      speed: snake.head.vel.mag()
    });
  `, createScene());
  assert.ok(result.firstStep < 1, 'la tête ne doit pas se téléporter');
  assert.ok(result.laterX > 100);
  assert.ok(result.minSpacing > 6 && result.maxSpacing < 12);
  assert.ok(result.speed <= 4.5);
});

test('les segments du corps sont repoussés hors du cercle des obstacles', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    const obstacle = { pos: new p5.Vector(100, 100), r: 30 };
    snake.segments[0].set(101, 100);
    snake.segments[1].set(102, 100);
    snake.resolveBodyObstacles([obstacle]);
    snake.segments.slice(0, 2).map((segment, index) => ({
      distance: p5.Vector.dist(segment, obstacle.pos),
      clearance: obstacle.r + snake.segmentRadius(index)
    }));
  `, createScene());
  for (const segment of result) {
    assert.ok(segment.distance >= segment.clearance - 1e-8);
  }
});

test('la cible souris dans un obstacle est décalée sans produire de valeur invalide', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    const obstacle = { pos: new p5.Vector(100, 100), r: 30 };
    snake.update(new p5.Vector(100, 100), [obstacle]);
    ({
      targetX: snake._safeTarget.x,
      targetY: snake._safeTarget.y,
      arriveX: snake.lastForces.arrive.x,
      arriveY: snake.lastForces.arrive.y,
      avoidX: snake.lastForces.avoid.x,
      avoidY: snake.lastForces.avoid.y
    });
  `, createScene());
  assert.ok(Number.isFinite(result.targetX));
  assert.ok(Number.isFinite(result.targetY));
  assert.ok(Math.hypot(result.targetX - 100, result.targetY - 100) >= 50 - 1e-8);
  assert.ok(Number.isFinite(result.arriveX));
  assert.ok(Number.isFinite(result.arriveY));
  assert.ok(Number.isFinite(result.avoidX));
  assert.ok(Number.isFinite(result.avoidY));
});

test('manger une poule retire sa cible, incrémente le score et ajoute trois segments', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    const hen = { pos: new p5.Vector(120, 100), r: 12 };
    const farHen = { pos: new p5.Vector(500, 500), r: 12 };
    const hens = [hen, farHen];
    const eaten = snake.eat(hens);
    ({
      eaten,
      remaining: hens.length,
      score: snake.score,
      segments: snake.segments.length,
      biteCount: snake.bites.length,
      waveCount: snake.waves.length
    });
  `, createScene());
  assert.equal(result.eaten, 1);
  assert.equal(result.remaining, 1);
  assert.equal(result.score, 1);
  assert.equal(result.segments, 23);
  assert.equal(result.biteCount, 1);
  assert.equal(result.waveCount, 1);
});

test('l’énergie baisse avec le temps, remonte en mangeant et protège après une attaque', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    snake.energy = 60;
    snake.updateEnergy(10);
    const energyAfterTime = snake.energy;
    const hen = { pos: new p5.Vector(120, 100), r: 12 };
    snake.eat([hen]);
    const energyAfterMeal = snake.energy;
    const firstHit = snake.takeDamage(30, 4, 1000);
    const energyAfterHit = snake.energy;
    const segmentsAfterHit = snake.segments.length;
    const blockedHit = snake.takeDamage(30, 4, 2000);
    const vulnerableAgain = !snake.isInvulnerable(2500);
    JSON.stringify({
      energyAfterTime,
      energyAfterMeal,
      firstHit,
      energyAfterHit,
      segmentsAfterHit,
      blockedHit,
      vulnerableAgain
    });
  `, createScene());
  assert.deepEqual(JSON.parse(result), {
    energyAfterTime: 40,
    energyAfterMeal: 65,
    firstHit: true,
    energyAfterHit: 35,
    segmentsAfterHit: 19,
    blockedHit: false,
    vulnerableAgain: true
  });
});

test('manger un garde donne de l’énergie sans score ni croissance, et capturer la reine compte une fois', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    snake.energy = 40;
    const queen = { pos: new p5.Vector(100, 100), r: 20, captured: false };
    const guards = [
      { pos: new p5.Vector(110, 100), r: 12, leader: queen },
      { pos: new p5.Vector(500, 500), r: 12, leader: queen }
    ];
    const segmentsBefore = snake.segments.length;
    const guardsEaten = snake.eatGuards(guards);
    const guardResult = {
      energy: snake.energy,
      score: snake.score,
      segmentDelta: snake.segments.length - segmentsBefore,
      remaining: guards.length
    };
    const captured = snake.captureQueen(queen);
    const repeated = snake.captureQueen(queen);
    JSON.stringify({ guardsEaten, guardResult, captured, repeated, score: snake.score });
  `, createScene());
  assert.deepEqual(JSON.parse(result), {
    guardsEaten: 1,
    guardResult: { energy: 50, score: 0, segmentDelta: 0, remaining: 1 },
    captured: true,
    repeated: false,
    score: 1
  });
});

test('le serpent détourne sa poursuite vers un mulot proche et le mange sans grandir', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    const mouse = {
      type: 'mouse',
      pos: new p5.Vector(150, 100),
      vel: new p5.Vector(1, 0),
      r: 9
    };
    snake.head.pursuePerfect = () => new p5.Vector(0.1, 0);
    snake.update(new p5.Vector(500, 100), [], [mouse], [
      { pos: new p5.Vector(400, 100) }
    ]);
    const diverted = snake.pursuedDecoy === mouse;
    const arrivedAtMouse = snake.lastForces.arrive === null;
    const originalLength = snake.segments.length;
    mouse.pos.set(snake.head.pos.x, snake.head.pos.y);
    const eaten = snake.eatDecoys([mouse]);
    ({
      diverted,
      arrivedAtMouse,
      eaten,
      score: snake.score,
      length: snake.segments.length,
      originalLength
    });
  `, createScene());

  assert.equal(result.diverted, true);
  assert.equal(result.arrivedAtMouse, true);
  assert.equal(result.eaten, 1);
  assert.equal(result.score, 1);
  assert.equal(result.length, result.originalLength);
});

test('le serpent sait empêcher le placement d’un obstacle sur sa tête ou son corps', () => {
  const result = vm.runInContext(`
    const snake = new Snake(100, 100);
    ({
      head: snake.containsPoint(100, 100, 20),
      body: snake.containsPoint(100 - 9, 100, 10),
      clear: snake.containsPoint(500, 500, 20)
    });
  `, createScene());
  assert.equal(result.head, true);
  assert.equal(result.body, true);
  assert.equal(result.clear, false);
});

test('show dessine le corps, la tête et le debug facultatif', () => {
  const context = createScene();
  vm.runInContext(`
    (() => {
      const snake = new Snake(100, 100);
      snake.update(new p5.Vector(200, 100), []);
      snake.show();
    })();
  `, context);
  assert.ok(context.calls.includes('ellipse'));
  assert.ok(context.calls.includes('bezierVertex'));

  context.calls.length = 0;
  vm.runInContext(`
    (() => {
      debug = true;
      const snake = new Snake(100, 100);
      snake.update(new p5.Vector(200, 100), []);
      snake.show();
    })();
  `, context);
  assert.ok(context.calls.includes('line'));
  assert.ok(context.calls.includes('circle'));
});
