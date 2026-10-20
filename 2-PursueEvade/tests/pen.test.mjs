import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.hypot(this.x, this.y); }
  setMag(magnitude) {
    const length = this.mag();
    if (length > 0) {
      this.x *= magnitude / length;
      this.y *= magnitude / length;
    }
    return this;
  }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  limit(maximum) {
    if (this.magSq() > maximum * maximum) this.setMag(maximum);
    return this;
  }
}

function createScene() {
  return vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    push() {},
    pop() {},
    noFill() {},
    stroke() {},
    strokeWeight() {},
    line() {},
    drawLines: []
  });
}

function loadPen(context) {
  vm.runInContext(
    readFileSync(new URL('../pen.js', import.meta.url), 'utf8'),
    context
  );
}

test('Pen crée une clôture circulaire avec une ouverture libre sur le côté demandé', () => {
  const context = createScene();
  loadPen(context);
  const result = vm.runInContext(`
    const pen = new Pen(100, 100, 200, 160, 'left');
    const posts = pen.fencePosts(18, 7);
    const fenceObstacle = new PenObstacle(100, 150, 7);
    const openingStart = pen.y + (pen.h - pen.openingSize) / 2;
    const openingEnd = openingStart + pen.openingSize;
    JSON.stringify({
      inside: pen.contains({ x: 150, y: 150 }),
      outside: pen.contains({ x: 99, y: 150 }),
      postCount: posts.length,
      openingClear: posts.every(post =>
        Math.abs(post.x - pen.x) > 0.01 ||
        post.y <= openingStart - 7 ||
        post.y >= openingEnd + 7
      ),
      otherWallsHavePosts: posts.some(post => post.y === pen.y),
      fenceRadius: fenceObstacle.r
    });
  `, context);

  assert.deepEqual(JSON.parse(result), {
    inside: true,
    outside: false,
    postCount: 42,
    openingClear: true,
    otherWallsHavePosts: true,
    fenceRadius: 7
  });
});

test('Pen retourne une force bornée pour maintenir un véhicule dans ses limites', () => {
  const context = createScene();
  loadPen(context);
  const result = vm.runInContext(`
    const pen = new Pen(100, 100, 200, 160);
    const vehicle = {
      pos: { x: 105, y: 105 },
      vel: createVector(-1, -1),
      maxSpeed: 4,
      maxForce: 0.2
    };
    const force = pen.boundaries(vehicle);
    JSON.stringify({
      x: force.x,
      y: force.y,
      magnitude: force.mag(),
      finite: Number.isFinite(force.x) && Number.isFinite(force.y)
    });
  `, context);

  const parsed = JSON.parse(result);
  assert.equal(parsed.finite, true);
  assert.ok(parsed.x > 0 && parsed.y > 0);
  assert.ok(parsed.magnitude <= 0.2 + 1e-10);
});

test('Pen.show dessine la clôture et laisse un passage dans le mur gauche', () => {
  const context = createScene();
  context.line = (x1, y1, x2, y2) => context.drawLines.push([x1, y1, x2, y2]);
  loadPen(context);
  vm.runInContext('new Pen(100, 100, 200, 160, "left").show()', context);

  const openingStart = 100 + (160 - 67.2) / 2;
  const openingEnd = openingStart + 67.2;
  const leftWallSpansOpening = context.drawLines.some(([x1, y1, x2, y2]) =>
    Math.abs(x1 - 100) < 0.01 &&
    Math.abs(x2 - 100) < 0.01 &&
    Math.min(y1, y2) < openingStart &&
    Math.max(y1, y2) > openingEnd
  );
  assert.equal(leftWallSpansOpening, false);
});
