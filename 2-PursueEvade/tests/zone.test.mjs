import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

function createScene() {
  const calls = [];
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    frameCount: 20,
    TWO_PI: Math.PI * 2,
    debug: false,
    push() { calls.push('push'); },
    pop() { calls.push('pop'); },
    noStroke() { calls.push('noStroke'); },
    noFill() { calls.push('noFill'); },
    stroke() { calls.push('stroke'); },
    strokeWeight() { calls.push('strokeWeight'); },
    fill() { calls.push('fill'); },
    circle() { calls.push('circle'); },
    ellipse() { calls.push('ellipse'); },
    calls
  });
  for (const file of ['vehicle.js', 'zone.js']) {
    vm.runInContext(
      readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'),
      context
    );
  }
  return context;
}

test('Zone distingue les mares et buissons et contient les positions de leur disque', () => {
  const result = vm.runInContext(`
    const pond = new Zone('mare', 100, 100, 30);
    const bush = new Zone('buisson', 200, 100, 20);
    ({
      pondInside: pond.contains(new p5.Vector(125, 100)),
      pondOutside: pond.contains(new p5.Vector(131, 100)),
      bushInside: bush.contains(new p5.Vector(200, 120)),
      types: [pond.type, bush.type]
    });
  `, createScene());
  assert.equal(result.pondInside, true);
  assert.equal(result.pondOutside, false);
  assert.equal(result.bushInside, true);
  assert.deepEqual(Array.from(result.types), ['mare', 'buisson']);
});

test('Vehicle.speedFactor ralentit dans une mare sans cumul et détecte le camouflage', () => {
  const result = vm.runInContext(`
    const vehicle = new Vehicle(100, 100);
    vehicle.maxSpeed = 4;
    vehicle.zoneSpeedMultiplier = 0.5;
    const pond = new Zone('mare', 100, 100, 40);
    const bush = new Zone('buisson', 100, 100, 20);
    vehicle.speedFactor([pond]);
    const pondSpeed = vehicle.maxSpeed;
    vehicle.speedFactor([pond]);
    const repeatedPondSpeed = vehicle.maxSpeed;
    vehicle.speedFactor([]);
    const restoredSpeed = vehicle.maxSpeed;
    vehicle.speedFactor([bush]);
    const hiddenInBush = vehicle.hidden;
    vehicle.speedFactor([]);
    ({ pondSpeed, repeatedPondSpeed, restoredSpeed, hiddenInBush, visibleOutside: !vehicle.hidden });
  `, createScene());
  assert.equal(result.pondSpeed, 2);
  assert.equal(result.repeatedPondSpeed, 2);
  assert.equal(result.restoredSpeed, 4);
  assert.equal(result.hiddenInBush, true);
  assert.equal(result.visibleOutside, true);
});

test('Zone.show dessine les deux types et leurs rayons en debug', () => {
  const context = createScene();
  vm.runInContext(`
    debug = true;
    new Zone('mare', 100, 100, 30).show();
    new Zone('buisson', 200, 100, 24).show();
  `, context);
  assert.ok(context.calls.filter(call => call === 'circle').length >= 12);
  assert.ok(context.calls.includes('ellipse'));
  assert.equal(context.calls.filter(call => call === 'stroke').length >= 2, true);
});
