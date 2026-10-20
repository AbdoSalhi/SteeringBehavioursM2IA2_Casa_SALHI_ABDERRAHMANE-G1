import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) { this.set(x, y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  setMag(value) { const magnitude = this.mag(); return magnitude ? this.mult(value / magnitude) : this; }
  normalize() { return this.mag() ? this.setMag(1) : this; }
  heading() { return Math.atan2(this.y, this.x); }
  limit(value) { return this.mag() > value ? this.setMag(value) : this; }
  copy() { return new Vector(this.x, this.y); }
  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static add(a, b) { return new Vector(a.x + b.x, a.y + b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static random2D() { return new Vector(1, 0); }
  static fromAngle(angle) { return new Vector(Math.cos(angle), Math.sin(angle)); }
}

function scene() {
  const drawingCalls = [];
  const context = vm.createContext({
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    random: (minimum = 1, maximum) => maximum === undefined
      ? minimum * 0.5
      : (minimum + maximum) * 0.5,
    TWO_PI: Math.PI * 2,
    width: 800,
    height: 600,
    push() { drawingCalls.push('push'); },
    pop() { drawingCalls.push('pop'); },
    stroke() { drawingCalls.push('stroke'); },
    strokeWeight() { drawingCalls.push('strokeWeight'); },
    fill() { drawingCalls.push('fill'); },
    noStroke() { drawingCalls.push('noStroke'); },
    noFill() { drawingCalls.push('noFill'); },
    circle() { drawingCalls.push('circle'); },
    ellipse() { drawingCalls.push('ellipse'); },
    rect() { drawingCalls.push('rect'); },
    triangle() { drawingCalls.push('triangle'); },
    translate() { drawingCalls.push('translate'); },
    rotate() { drawingCalls.push('rotate'); },
    scale() { drawingCalls.push('scale'); },
    line() { drawingCalls.push('line'); },
    drawingCalls
  });
  for (const file of ['vehicle.js', 'fox.js', 'decoy.js', 'missileTarget.js', 'target.js']) {
    vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  }
  return {
    ...vm.runInContext('({ Vehicle, Fox, Decoy, Target, selectMissileTarget })', context),
    drawingCalls
  };
}

test('une cible détectant un missile lance une salve de dix leurres', () => {
  const { Vehicle, Decoy, Target } = scene();
  const target = new Target(100, 100);
  target.rayonDetection = 150;
  const missile = new Vehicle(200, 100);

  const salvo = target.releaseDecoysIfDetected(missile, 0);
  assert.equal(salvo.length, 10);
  assert.ok(salvo.every(decoy => decoy instanceof Decoy));
  assert.equal(new Set(salvo.map(decoy => `${decoy.pos.x},${decoy.pos.y}`)).size, 10,
    'les dix leurres doivent apparaître à des positions distinctes');
  assert.ok(new Set(salvo.map(decoy => decoy.vel.heading())).size > 1,
    'les leurres doivent se disperser dans des directions différentes');
  assert.equal(target.releaseDecoysIfDetected(missile, 9999).length, 0);
  assert.equal(target.releaseDecoysIfDetected(missile, 10000).length, 10);
});

test('chaque cible gère son propre cooldown de salve de dix secondes', () => {
  const { Vehicle, Target } = scene();
  const missile = new Vehicle(100, 100);
  const firstTarget = new Target(100, 100);
  const secondTarget = new Target(100, 100);
  assert.equal(firstTarget.releaseDecoysIfDetected(missile, 0).length, 10);
  assert.equal(secondTarget.releaseDecoysIfDetected(missile, 0).length, 10);
  assert.equal(firstTarget.releaseDecoysIfDetected(missile, 9999).length, 0);
  assert.equal(firstTarget.releaseDecoysIfDetected(missile, 10000).length, 10);
  assert.equal(secondTarget.releaseDecoysIfDetected(missile, 10000).length, 10);
});

test('les leurres vivent exactement deux secondes et se déplacent par steering', () => {
  const { Decoy } = scene();
  const decoy = new Decoy(100, 100, new Vector(2, 0), 500);
  assert.equal(decoy.expiresAtMs, 2500);
  assert.equal(decoy.updateDecoy(2499), true);
  assert.ok(decoy.pos.x > 100);
  assert.equal(decoy.acc.mag(), 0);
  assert.equal(decoy.updateDecoy(2500), false);
  assert.equal(decoy.isExpired(2500), true);
});

test('les trois types de leurre ont une durée de vie et un mouvement adaptés', () => {
  const { Decoy } = scene();
  const seed = new Decoy('seed', 40, 50);
  const fakeSnake = new Decoy('fakeSnake', 60, 70);
  const mouse = new Decoy('mouse', 80, 90);

  assert.equal(seed.type, 'seed');
  assert.equal(seed.vel.mag(), 0);
  assert.equal(fakeSnake.type, 'fakeSnake');
  assert.equal(fakeSnake.vel.mag(), 0);
  assert.equal(mouse.type, 'mouse');
  assert.ok(mouse.maxSpeed > 0);
  for (const decoy of [seed, fakeSnake, mouse]) {
    assert.ok(decoy.lifetime >= 480 && decoy.lifetime <= 900);
    decoy.age = decoy.lifetime;
    assert.equal(decoy.isExpired(), true);
  }
});

test('le missile détourne sa poursuite vers le leurre le plus proche, puis revient aux cibles', () => {
  const { Vehicle, Decoy, selectMissileTarget } = scene();
  const missile = new Vehicle(0, 0);
  const realTarget = new Vehicle(10, 0);
  const fartherDecoy = new Decoy(80, 0, new Vector(1, 0), 0);
  const nearestDecoy = new Decoy(30, 0, new Vector(1, 0), 0);

  assert.equal(
    selectMissileTarget(missile, [realTarget], [fartherDecoy, nearestDecoy]),
    nearestDecoy
  );
  assert.equal(selectMissileTarget(missile, [realTarget], []), realTarget);
  assert.equal(selectMissileTarget(missile, [], []), null);
});

test('une cible hors du rayon de détection ne libère pas de leurre', () => {
  const { Vehicle, Target } = scene();
  const target = new Target(100, 100);
  target.rayonDetection = 150;
  const missile = new Vehicle(251, 100);

  assert.equal(target.releaseDecoysIfDetected(missile, 0).length, 0);
  assert.equal(target.lastDecoySalvoAt, null);
});

test('le renard, les poules et les poussins sont dessinés comme entités Vehicle', () => {
  const { Vehicle, Fox, Decoy, Target, drawingCalls } = scene();
  const fox = new Fox(100, 100);
  assert.ok(fox instanceof Vehicle);
  fox.show();
  assert.ok(drawingCalls.filter(call => call === 'triangle').length >= 2);
  assert.ok(drawingCalls.includes('ellipse'));

  drawingCalls.length = 0;
  new Target(200, 200).show();
  assert.ok(drawingCalls.filter(call => call === 'ellipse').length >= 2);
  assert.ok(drawingCalls.includes('triangle'));

  drawingCalls.length = 0;
  new Decoy(300, 300, new Vector(1, 0), 0).show();
  assert.ok(drawingCalls.filter(call => call === 'triangle').length >= 2);
  assert.ok(drawingCalls.includes('ellipse'));
});
