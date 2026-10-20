import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  copy() { return new Vector(this.x, this.y); }
}

function createScene() {
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    millis: () => context.nowMs,
    nowMs: 1000,
    debug: false
  });
  for (const file of ['vehicle.js', 'eagle.js']) {
    vm.runInContext(
      readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'),
      context
    );
  }
  return context;
}

test('Eagle patrouille puis attaque un serpent long et se retire après une frappe', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const eagle = new Eagle(100, 100);
    eagle.avoid = () => createVector(0, 0);
    eagle.boundaries = () => createVector(0, 0);
    eagle.wander = () => createVector(0, 0);
    eagle.pursuePerfect = () => createVector(1, 0);
    eagle.flee = () => createVector(-1, 0);
    eagle.update = () => {};
    let hits = 0;
    const snake = {
      head: {
        pos: new p5.Vector(110, 100),
        vel: new p5.Vector(0, 0),
        maxSpeed: 4.5,
        r: 12,
        hidden: false
      },
      segments: new Array(35),
      takeDamage(energy, segments, now) {
        if (now < this.invulnerableUntil) return false;
        hits++;
        this.energy -= energy;
        this.segments.length -= segments;
        this.invulnerableUntil = now + 1500;
        return true;
      },
      energy: 100,
      invulnerableUntil: 0
    };
    eagle.applyBehaviors(snake, []);
    const first = {
      speed: eagle.maxSpeed,
      force: eagle.maxForce,
      state: eagle.etat,
      attacked: eagle.attackOccurred,
      hits,
      energy: snake.energy,
      segments: snake.segments.length,
      retreatUntil: eagle.retreatUntilMs
    };
    nowMs = 1500;
    eagle.applyBehaviors(snake, []);
    JSON.stringify({
      first,
      retreatState: eagle.etat,
      repeatHits: hits,
      fleeForce: eagle.lastForces.target.x
    });
  `, context);
  const parsed = JSON.parse(result);
  assert.deepEqual(parsed.first, {
    speed: 5,
    force: 0.25,
    state: 'retraite',
    attacked: true,
    hits: 1,
    energy: 70,
    segments: 31,
    retreatUntil: 4000
  });
  assert.equal(parsed.retreatState, 'retraite');
  assert.equal(parsed.repeatHits, 1);
  assert.equal(parsed.fleeForce, -2);
});

test('Eagle retourne en patrouille lorsque le serpent est caché', () => {
  const result = vm.runInContext(`
    const eagle = new Eagle(100, 100);
    eagle.avoid = () => createVector(0, 0);
    eagle.boundaries = () => createVector(0, 0);
    eagle.wander = () => createVector(0, 0);
    eagle.update = () => {};
    eagle.etat = 'retraite';
    eagle.retreatUntilMs = 5000;
    const snake = {
      head: {
        pos: new p5.Vector(110, 100),
        vel: new p5.Vector(0, 0),
        maxSpeed: 4.5,
        r: 12,
        hidden: true
      },
      segments: new Array(40)
    };
    eagle.applyBehaviors(snake, []);
    JSON.stringify({ state: eagle.etat, retreatUntil: eagle.retreatUntilMs });
  `, createScene());
  assert.deepEqual(JSON.parse(result), {
    state: 'patrouille',
    retreatUntil: 0
  });
});
