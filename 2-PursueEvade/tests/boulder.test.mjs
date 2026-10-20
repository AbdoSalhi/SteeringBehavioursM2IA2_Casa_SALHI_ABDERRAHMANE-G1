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
  mult(value) { this.x *= value; this.y *= value; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  limit(maximum) {
    if (this.mag() > maximum) {
      this.setMag(maximum);
    }
    return this;
  }
  setMag(magnitude) {
    const current = this.mag();
    if (current > 0) {
      this.mult(magnitude / current);
    }
    return this;
  }
  heading() { return Math.atan2(this.y, this.x); }

  static random2D() { return new Vector(1, 0); }
}

function createScene() {
  const drawingCalls = [];
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    constrain: (value, minimum, maximum) =>
      Math.min(maximum, Math.max(minimum, value)),
    random: (minimum, maximum) => maximum === undefined
      ? minimum * 0.5
      : minimum + (maximum - minimum) * 0.5,
    width: 800,
    height: 600,
    TWO_PI: Math.PI * 2,
    push() { drawingCalls.push('push'); },
    pop() { drawingCalls.push('pop'); },
    translate() { drawingCalls.push('translate'); },
    rotate() { drawingCalls.push('rotate'); },
    noStroke() { drawingCalls.push('noStroke'); },
    stroke() { drawingCalls.push('stroke'); },
    strokeWeight() { drawingCalls.push('strokeWeight'); },
    fill() { drawingCalls.push('fill'); },
    ellipse() { drawingCalls.push('ellipse'); },
    beginShape() { drawingCalls.push('beginShape'); },
    vertex() { drawingCalls.push('vertex'); },
    endShape() { drawingCalls.push('endShape'); },
    triangle() { drawingCalls.push('triangle'); },
    CLOSE: 'close',
    drawingCalls
  });

  for (const file of ['vehicle.js', 'target.js', 'bouncingBall.js', 'boulder.js']) {
    vm.runInContext(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
  }
  return context;
}

test('Boulder hérite de BouncingBall, conserve sa vitesse et rebondit sur le bord', () => {
  const result = vm.runInContext(`
    const boulder = new Boulder(768, 300, 32);
    boulder.vel.set(2, 0);
    const speedBefore = boulder.vel.mag();
    boulder.update();
    ({
      inherited: boulder instanceof BouncingBall,
      radius: boulder.r,
      x: boulder.pos.x,
      velocityX: boulder.vel.x,
      speedBefore,
      speedAfter: boulder.vel.mag()
    });
  `, createScene());

  assert.equal(result.inherited, true);
  assert.equal(result.radius, 32);
  assert.equal(result.x, 768);
  assert.equal(result.velocityX, -2);
  assert.equal(result.speedAfter, result.speedBefore);
});

test('Boulder dessine une silhouette détaillée avec sa rotation', () => {
  const context = createScene();
  vm.runInContext('new Boulder(100, 100, 30).show();', context);
  assert.ok(context.drawingCalls.includes('beginShape'));
  assert.ok(context.drawingCalls.includes('vertex'));
  assert.ok(context.drawingCalls.includes('rotate'));
});
