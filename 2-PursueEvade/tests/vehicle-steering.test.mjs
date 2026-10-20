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

function createScene({ randomValue = 0 } = {}) {
  const draws = [];
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    map: (value, start1, stop1, start2, stop2) =>
      start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    random: (min, max) => max === undefined
      ? min * randomValue
      : min + (max - min) * randomValue,
    constrain: (value, min, max) => Math.min(Math.max(value, min), max),
    width: 800,
    height: 600,
    debug: false,
    PI: Math.PI,
    HALF_PI: Math.PI / 2,
    sin: Math.sin,
    asin: Math.asin,
    push() { draws.push('push'); },
    pop() { draws.push('pop'); },
    stroke() { draws.push('stroke'); },
    strokeWeight() { draws.push('strokeWeight'); },
    fill() { draws.push('fill'); },
    noStroke() { draws.push('noStroke'); },
    noFill() { draws.push('noFill'); },
    circle() { draws.push('circle'); },
    line() { draws.push('line'); },
    translate() { draws.push('translate'); },
    rotate() { draws.push('rotate'); },
    triangle() { draws.push('triangle'); },
    drawingCalls: draws
  });
  vm.runInContext(readFileSync(new URL('../vehicle.js', import.meta.url), 'utf8'), context);
  return context;
}

test('arrive ralentit près de la cible et retourne une force limitée', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const vehicle = new Vehicle(0, 0);
    vehicle.maxForce = 10;
    const near = vehicle.arrive(new p5.Vector(20, 0), 100);
    const stopped = vehicle.arrive(new p5.Vector(0, 0), 100);
    vehicle.maxForce = 0.25;
    const limited = vehicle.arrive(new p5.Vector(1000, 0), 100);
    ({ near: near.mag(), stopped: stopped.mag(), limited: limited.mag() });
  `, context);
  assert.equal(result.near, 2);
  assert.equal(result.stopped, 0);
  assert.ok(result.limited <= 0.25 + 1e-10);
});

test('flee accepte une position ou un véhicule et respecte le rayon de détection', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(0, 0);
    const position = vehicle.flee(new p5.Vector(10, 0), 20);
    const otherVehicle = new Vehicle(10, 0);
    const target = vehicle.flee(otherVehicle, 20);
    const tooFar = vehicle.flee(new p5.Vector(100, 0), 20);
    ({ positionX: position.x, targetX: target.x, tooFar: tooFar.mag() });
  `, createScene());
  assert.ok(result.positionX < 0);
  assert.ok(result.targetX < 0);
  assert.equal(result.tooFar, 0);
});

test('les comportements renvoient une force sans modifier position ni vitesse', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(10, 10);
    vehicle.vel.set(2, 1);
    const target = new Vehicle(180, 160);
    target.vel.set(0, 0);
    const other = new Vehicle(30, 25);
    const behaviors = [
      () => vehicle.seek(target.pos),
      () => vehicle.arrive(target.pos),
      () => vehicle.avoid([]),
      () => vehicle.wander(),
      () => vehicle.separate([vehicle, other]),
      () => vehicle.align([vehicle, other]),
      () => vehicle.cohesion([vehicle, other]),
      () => vehicle.boundaries(),
      () => vehicle.flee(target),
      () => vehicle.pursue(target),
      () => vehicle.evade(target),
      () => vehicle.pursuePerfect(target)
    ];
    behaviors.map(behavior => {
      const position = [vehicle.pos.x, vehicle.pos.y];
      const velocity = [vehicle.vel.x, vehicle.vel.y];
      const force = behavior();
      return force instanceof p5.Vector &&
        position[0] === vehicle.pos.x && position[1] === vehicle.pos.y &&
        velocity[0] === vehicle.vel.x && velocity[1] === vehicle.vel.y &&
        Number.isFinite(force.x) && Number.isFinite(force.y);
    });
  `, createScene());
  assert.equal(result.every(Boolean), true);
});

test('avoid sélectionne une menace dans le corridor, la force est limitée et le debug dessine', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    vehicle.vel.set(5, 0);
    const nearThreat = { pos: new p5.Vector(145, 110), r: 20 };
    const fartherThreat = { pos: new p5.Vector(175, 100), r: 20 };
    const threatForce = vehicle.avoid([fartherThreat, nearThreat]);
    const noThreatForce = vehicle.avoid([{ pos: new p5.Vector(500, 500), r: 10 }]);
    debug = true;
    vehicle.avoid([nearThreat]);
    ({ force: threatForce.mag(), noThreat: noThreatForce.mag() });
  `, context);
  assert.ok(Math.abs(result.force - 0.25) < 1e-10);
  assert.equal(result.noThreat, 0);
  assert.ok(context.drawingCalls.includes('line'));
  assert.ok(context.drawingCalls.includes('circle'));
});

test('avoid anticipe la position future d’un obstacle mobile', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    vehicle.vel.set(5, 0);
    const boulder = {
      pos: new p5.Vector(150, 140),
      vel: new p5.Vector(0, -4),
      r: 10
    };
    const force = vehicle.avoid([boulder]);
    ({ magnitude: force.mag(), x: force.x, y: force.y });
  `, createScene());
  assert.ok(result.magnitude > 0);
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
});

test('avoid peut détecter un obstacle mobile approchant un véhicule arrêté', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    const boulder = {
      pos: new p5.Vector(160, 100),
      vel: new p5.Vector(-3, 0),
      r: 10
    };
    vehicle.avoid([boulder]).mag();
  `, createScene({ randomValue: 0.25 }));
  assert.ok(result > 0);
});

test('avoid reste fini à vitesse nulle même quand plusieurs obstacles menacent', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    const obstacles = [
      { pos: new p5.Vector(100, 100), r: 35 },
      { pos: new p5.Vector(115, 100), r: 35 }
    ];
    const force = vehicle.avoid(obstacles);
    ({ x: force.x, y: force.y, magnitude: force.mag() });
  `, createScene({ randomValue: 0.25 }));
  assert.ok(Number.isFinite(result.x));
  assert.ok(Number.isFinite(result.y));
  assert.ok(Number.isFinite(result.magnitude));
  assert.ok(result.magnitude > 0);
});

test('la force de dégagement à l’arrêt reste dans la même direction entre deux frames', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    const obstacle = { pos: new p5.Vector(100, 100), r: 35 };
    const first = vehicle.avoid([obstacle]);
    const second = vehicle.avoid([obstacle]);
    ({ dx: Math.abs(first.x - second.x), dy: Math.abs(first.y - second.y) });
  `, createScene({ randomValue: 0.63 }));
  assert.ok(result.dx < 1e-12);
  assert.ok(result.dy < 1e-12);
});

test('wander retourne une force limitée et fait évoluer son angle progressivement', () => {
  const context = createScene({ randomValue: 0.75 });
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    vehicle.vel.setMag(2);
    const force = vehicle.wander();
    ({ theta: vehicle.wanderTheta, magnitude: force.mag() });
  `, context);
  assert.ok(Math.abs(result.theta - 0.15) < 1e-10);
  assert.ok(result.magnitude <= 0.25 + 1e-10);
});

test('separate repousse les voisins et renvoie zéro sans voisin proche', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    const neighbour = new Vehicle(110, 100);
    const force = vehicle.separate([vehicle, neighbour]);
    const none = vehicle.separate([vehicle, new Vehicle(300, 300)]);
    ({ x: force.x, magnitude: force.mag(), none: none.mag() });
  `, createScene());
  assert.ok(result.x < 0);
  assert.ok(result.magnitude <= 0.25 + 1e-10);
  assert.equal(result.none, 0);
});

test('align et cohesion retournent des forces bornées vers les voisins', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    vehicle.vel.set(1, 0);
    const first = new Vehicle(110, 100);
    first.vel.set(0, 2);
    const second = new Vehicle(120, 100);
    second.vel.set(0, 2);
    const flock = [vehicle, first, second];
    const alignment = vehicle.align(flock, 50);
    const cohesion = vehicle.cohesion(flock, 50);
    const isolatedAlign = vehicle.align([vehicle], 50);
    const isolatedCohesion = vehicle.cohesion([vehicle], 50);
    ({
      alignX: alignment.x,
      alignY: alignment.y,
      cohesionX: cohesion.x,
      cohesionY: cohesion.y,
      isolatedAlign: isolatedAlign.mag(),
      isolatedCohesion: isolatedCohesion.mag(),
      finite: [alignment.x, alignment.y, cohesion.x, cohesion.y].every(Number.isFinite),
      limited: alignment.mag() <= vehicle.maxForce && cohesion.mag() <= vehicle.maxForce
    });
  `, createScene());
  assert.ok(result.alignX < 0);
  assert.ok(result.alignY > 0);
  assert.ok(result.cohesionX > 0);
  assert.ok(Number.isFinite(result.cohesionY));
  assert.equal(result.isolatedAlign, 0);
  assert.equal(result.isolatedCohesion, 0);
  assert.equal(result.finite, true);
  assert.equal(result.limited, true);
});

test('boundaries renvoie une force vers l’intérieur uniquement près des bords', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(10, 300);
    const atEdge = vehicle.boundaries(40);
    vehicle.pos.set(400, 300);
    const inBounds = vehicle.boundaries(40);
    ({ x: atEdge.x, magnitude: atEdge.mag(), inBounds: inBounds.mag() });
  `, createScene());
  assert.ok(result.x > 0);
  assert.ok(result.magnitude <= 0.25 + 1e-10);
  assert.equal(result.inBounds, 0);
});

test('la composition arrive + évitement pondéré contourne un obstacle et arrive sans traverser le centre', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 200);
    vehicle.maxSpeed = 4;
    vehicle.maxForce = 0.2;
    const obstacle = { pos: new p5.Vector(200, 200), r: 30 };
    const target = new p5.Vector(300, 200);
    let closestDistance = Infinity;

    for (let frame = 0; frame < 1000; frame++) {
      const arriveForce = vehicle.arrive(target);
      const avoidForce = vehicle.avoid([obstacle]);
      const combined = arriveForce.add(avoidForce.mult(3));
      vehicle.applyForce(combined);
      vehicle.update();
      closestDistance = Math.min(closestDistance, p5.Vector.dist(vehicle.pos, obstacle.pos));
      if (p5.Vector.dist(vehicle.pos, target) < 1 && vehicle.vel.mag() < 0.15) {
        break;
      }
    }
    ({
      distanceToTarget: p5.Vector.dist(vehicle.pos, target),
      speed: vehicle.vel.mag(),
      closestDistance
    });
  `, context);
  assert.ok(result.closestDistance > 30 + 16, `obstacle clearance was ${result.closestDistance}`);
  assert.ok(result.distanceToTarget < 8, `target distance was ${result.distanceToTarget}`);
  assert.ok(result.speed < 0.5, `arrival speed was ${result.speed}`);
});

test('un obstacle ajouté en cours de déplacement est contourné sans oscillation de position', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 200);
    vehicle.maxSpeed = 4;
    vehicle.maxForce = 0.2;
    const target = new p5.Vector(380, 200);
    const obstacles = [];
    let clearance = Infinity;
    let directionChanges = 0;
    let previousSide = 0;

    for (let frame = 0; frame < 1200; frame++) {
      if (frame === 20) {
        obstacles.push({
          pos: new p5.Vector(vehicle.pos.x + 80, vehicle.pos.y),
          r: 30
        });
      }
      const force = vehicle.arrive(target).add(vehicle.avoid(obstacles).mult(4));
      vehicle.applyForce(force);
      vehicle.update();

      if (obstacles.length) {
        const obstacle = obstacles[0];
        const dx = vehicle.pos.x - obstacle.pos.x;
        const dy = vehicle.pos.y - obstacle.pos.y;
        clearance = Math.min(clearance, Math.hypot(dx, dy));
        if (Math.abs(dx) < 45 && Math.abs(dy) > 1) {
          const side = Math.sign(dy);
          if (previousSide && side !== previousSide) directionChanges++;
          previousSide = side;
        }
      }
      if (p5.Vector.dist(vehicle.pos, target) < 1 && vehicle.vel.mag() < 0.15) break;
    }
    ({
      clearance,
      directionChanges,
      targetDistance: p5.Vector.dist(vehicle.pos, target),
      finite: [vehicle.pos.x, vehicle.pos.y, vehicle.vel.x, vehicle.vel.y].every(Number.isFinite)
    });
  `, createScene());
  assert.ok(result.clearance > 46, `obstacle clearance was ${result.clearance}`);
  assert.ok(result.directionChanges <= 1, `changed avoidance side ${result.directionChanges} times`);
  assert.ok(result.targetDistance < 8, `target distance was ${result.targetDistance}`);
  assert.equal(result.finite, true);
});
