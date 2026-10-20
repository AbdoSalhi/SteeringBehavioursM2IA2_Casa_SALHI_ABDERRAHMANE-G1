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
  div(value) { this.x /= value; this.y /= value; return this; }
  dot(vector) { return this.x * vector.x + this.y * vector.y; }
  copy() { return new Vector(this.x, this.y); }
  mag() { return Math.hypot(this.x, this.y); }
  setMag(value) { const magnitude = this.mag(); return magnitude ? this.mult(value / magnitude) : this; }
  limit(value) { return this.mag() > value ? this.setMag(value) : this; }
  heading() { return Math.atan2(this.y, this.x); }
  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static add(a, b) { return new Vector(a.x + b.x, a.y + b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
}

function scene() {
  const drawnStrokes = [];
  const context = vm.createContext({
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    width: 800,
    height: 600,
    random: (min, max) => max === undefined ? min * 0.5 : min + (max - min) * 0.5,
    cos: Math.cos,
    sin: Math.sin,
    constrain: (value, min, max) => Math.min(Math.max(value, min), max),
    push() {}, pop() {}, noFill() {}, noStroke() {}, strokeWeight() {},
    stroke: value => drawnStrokes.push(value),
    fill() {}, circle() {}, rect() {},
    drawnStrokes
  });
  for (const file of ['vehicle.js', 'obstacle.js', 'target.js', 'targetFuyante.js']) {
    vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  }
  return {
    ...vm.runInContext('({ Vehicle, Target, TargetFuyante })', context),
    drawnStrokes
  };
}

test('TargetFuyante est un Vehicle et détecte un prédateur dans le rayon réglable', () => {
  const { Vehicle, TargetFuyante } = scene();
  const target = new TargetFuyante(300, 300);
  const predator = new Vehicle(99, 300);

  target.updateTarget([predator], 0);
  assert.equal(target.detectionRadius, 200);
  assert.equal(target.detectedPredator, false);
  assert.equal(target.fleeing, false);

  predator.pos.x = target.pos.x - 200;
  target.updateTarget([predator], 16);
  assert.equal(target.detectedPredator, true);
  assert.equal(target.fleeing, true);
});

test('la cible fuit le vaisseau le plus proche avec force et vitesse accrues', () => {
  const { Vehicle, TargetFuyante } = scene();
  const target = new TargetFuyante(300, 300);
  const farther = new Vehicle(100, 300);
  const nearest = new Vehicle(450, 300);
  target.updateTarget([farther, nearest], 0);

  assert.equal(target.fleeing, true);
  assert.equal(target.maxSpeed, target.baseMaxSpeed * 2.5);
  assert.equal(target.maxForce, target.baseMaxForce * 3);
  assert.ok(target.pos.x < 300, 'la cible doit fuir vers la gauche, loin du prédateur le plus proche');
  assert.ok(target.vel.mag() <= target.maxSpeed);
});

test('la fuite cesse au-delà de 300 px et les paramètres normaux sont restaurés', () => {
  const { Vehicle, TargetFuyante } = scene();
  const target = new TargetFuyante(300, 300);
  const predator = new Vehicle(200, 300);
  target.updateTarget([predator], 0);
  assert.equal(target.fleeing, true);

  predator.pos.x = 601;
  target.updateTarget([predator], 100);
  assert.equal(target.fleeing, false);
  assert.equal(target.maxSpeed, target.baseMaxSpeed);
  assert.equal(target.maxForce, target.baseMaxForce);
});

test('l’endurance limite la fuite et empêche une reprise avant la sortie des 300 px', () => {
  const { Vehicle, TargetFuyante } = scene();
  const target = new TargetFuyante(300, 300);
  const predator = new Vehicle(200, 300);
  target.updateTarget([predator], 0);
  target.updateTarget([predator], 2500);

  assert.equal(target.fleeing, false);
  assert.equal(target.staminaRemainingMs, 0);
  assert.equal(target.escapeBlocked, true);
  target.updateTarget([predator], 2600);
  assert.equal(target.fleeing, false);

  predator.pos.x = 601;
  target.updateTarget([predator], 2700);
  assert.equal(target.escapeBlocked, false);
  assert.equal(target.staminaRemainingMs, 200);
});

test('le debug montre le cercle jaune au repos et rouge quand un vaisseau est détecté', () => {
  const { Vehicle, TargetFuyante, drawnStrokes } = scene();
  const target = new TargetFuyante(300, 300);
  const predator = new Vehicle(500, 300);
  target.debugMode = true;

  target.updateTarget([predator], 0);
  target.show();
  assert.ok(target.detectedPredator);
  assert.ok(drawnStrokes.includes('red'));

  const { TargetFuyante: FreshTarget, drawnStrokes: idleStrokes } = scene();
  const idleTarget = new FreshTarget(300, 300);
  idleTarget.debugMode = true;
  idleTarget.show();
  assert.ok(idleStrokes.includes('yellow'));
});

test('Target conserve un comportement autonome reposant sur steering et locomotion Vehicle', () => {
  const { Vehicle, Target } = scene();
  const target = new Target(300, 300);
  assert.ok(target instanceof Vehicle);
  target.update();
  assert.ok(target.pos.x !== 300 || target.pos.y !== 300);
  assert.equal(target.acc.mag(), 0);
  assert.ok(target.vel.mag() <= target.maxSpeed);
});
