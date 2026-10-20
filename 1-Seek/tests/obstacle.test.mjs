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
  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static add(a, b) { return new Vector(a.x + b.x, a.y + b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
}

function scene() {
  const context = vm.createContext({
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    width: 800,
    height: 600,
    push() {}, pop() {}, fill() {}, stroke() {}, strokeWeight() {}, circle() {}
  });
  for (const file of ['vehicle.js', 'obstacle.js']) {
    vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  }
  return vm.runInContext('({ Vehicle, Obstacle, obstacleAvoidanceForce, createRandomObstacles })', context);
}

test('Obstacle est un Vehicle statique et les positions aléatoires respectent le compte', () => {
  const { Vehicle, Obstacle, createRandomObstacles } = scene();
  const target = new Vehicle(400, 300);
  const obstacles = createRandomObstacles(12, 800, 600, target, () => 0.5);

  assert.equal(obstacles.length, 12);
  assert.ok(obstacles.every(obstacle => obstacle instanceof Obstacle));
  assert.ok(obstacles.every(obstacle => obstacle instanceof Vehicle));
  assert.ok(obstacles.every(obstacle =>
    obstacle.pos.x >= obstacle.r && obstacle.pos.x <= 800 - obstacle.r
    && obstacle.pos.y >= obstacle.r && obstacle.pos.y <= 600 - obstacle.r));
  assert.ok(obstacles.every(obstacle =>
    Vector.dist(obstacle.pos, target.pos) > target.r + obstacle.r + 50));
  assert.equal(obstacles[0].vel.mag(), 0);
  assert.equal(obstacles[0].maxSpeed, 0);
  assert.throws(() => createRandomObstacles(31, 800, 600, target), { name: 'RangeError' });
});

test('l’évitement retourne une force latérale limitée quand un obstacle est sur la trajectoire', () => {
  const { Vehicle, Obstacle, obstacleAvoidanceForce } = scene();
  const vehicle = new Vehicle(100, 100);
  vehicle.r = 12;
  vehicle.vel.set(4, 0);
  const obstacle = new Obstacle(150, 100, 20);

  const steering = obstacleAvoidanceForce(vehicle, [obstacle]);
  assert.ok(steering.mag() > 0);
  assert.ok(steering.mag() <= vehicle.maxForce);
  assert.ok(Math.abs(steering.y) >= Math.abs(steering.x));
  assert.ok(steering.y < 0, 'le vaisseau doit contourner l’obstacle par le côté libre');
});

test('un obstacle hors du corridor de perception ne détourne pas le véhicule', () => {
  const { Vehicle, Obstacle, obstacleAvoidanceForce } = scene();
  const vehicle = new Vehicle(100, 100);
  vehicle.r = 12;
  vehicle.vel.set(4, 0);

  const steering = obstacleAvoidanceForce(vehicle, [new Obstacle(150, 170, 20)]);
  assert.equal(steering.mag(), 0);
});

test('un véhicule arrêté anticipe sa destination par défaut sans force parasite', () => {
  const { Vehicle, Obstacle, obstacleAvoidanceForce } = scene();
  const vehicle = new Vehicle(100, 100);
  vehicle.r = 12;
  const steering = obstacleAvoidanceForce(vehicle, [new Obstacle(150, 100, 20)]);
  assert.ok(steering.mag() > 0);
  assert.ok(steering.mag() <= vehicle.maxForce);
});

test('la priorité d’évitement fait contourner un obstacle sur une poursuite rectiligne', () => {
  const { Vehicle, Obstacle, obstacleAvoidanceForce } = scene();
  const vehicle = new Vehicle(100, 100);
  vehicle.r = 12;
  vehicle.vel.set(4, 0);
  const obstacle = new Obstacle(200, 100, 20);
  let closestDistance = Infinity;

  for (let frame = 0; frame < 100; frame++) {
    const avoidance = obstacleAvoidanceForce(vehicle, [obstacle]);
    const force = avoidance.mag() > 0 ? avoidance : vehicle.seek(new Vector(700, 100));
    vehicle.applyForce(force);
    vehicle.update();
    closestDistance = Math.min(closestDistance, Vector.dist(vehicle.pos, obstacle.pos));
  }

  assert.ok(closestDistance > obstacle.r, `collision détectée à ${closestDistance}px`);
});
