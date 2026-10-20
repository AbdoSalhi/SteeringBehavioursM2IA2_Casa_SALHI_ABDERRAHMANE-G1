import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  static dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}

function createScene() {
  const random = (min, max) => (min + max) / 2;
  const context = vm.createContext({
    Vehicle: class {
      constructor(x, y) {
        this.pos = new Vector(x, y);
        this.r = 16;
      }
    },
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    constrain: (value, min, max) => Math.min(Math.max(value, min), max),
    random,
    width: 800,
    height: 600,
    mouseX: 100,
    mouseY: 100,
    pointerTarget: new Vector(0, 0),
    mouseButton: 'LEFT',
    RIGHT: 'RIGHT',
    SHIFT: 16,
    keyIsDown: () => false,
    obstacles: [],
    pursuer: null,
    targets: [],
    drawingCalls: [],
    drawingContext: {
      save() {},
      restore() {},
      set shadowColor(value) {},
      set shadowBlur(value) {}
    },
    push() {},
    pop() {},
    noStroke() {},
    noFill() {},
    stroke() {},
    strokeWeight() {},
    fill() {},
    circle() {},
    random
  });

  vm.runInContext(readFileSync(new URL('../obstacle.js', import.meta.url), 'utf8'), context);
  vm.runInContext(readFileSync(new URL('../sketch.js', import.meta.url), 'utf8'), context);
  vm.runInContext('pointerTarget = createVector(0, 0);', context);
  return context;
}

test('Obstacle borne son rayon et détecte les points dans son cercle', () => {
  const context = createScene();
  const { obstacle } = vm.runInContext(
    '({ obstacle: new Obstacle(100, 100, 100) })',
    context
  );

  assert.equal(obstacle.r, 80);
  assert.equal(obstacle.contains(180, 100), true);
  assert.equal(obstacle.contains(181, 100), false);

  const minimum = vm.runInContext('new Obstacle(0, 0, 1).r', context);
  assert.equal(minimum, 20);
});

test('clic gauche ajoute un obstacle sauf à proximité des véhicules', () => {
  const context = createScene();
  vm.runInContext(`
    snake = { containsPoint: (x, y) => x === 500 && y === 500 };
    hens = [{ pos: new p5.Vector(700, 500), r: 10 }];
    nextObstacleRadius = 50;
    mouseX = 100;
    mouseY = 100;
    mouseClicked();
  `, context);
  assert.equal(vm.runInContext('obstacles.length', context), 1);
  assert.equal(vm.runInContext('obstacles[0].r', context), 50);

  vm.runInContext('mouseX = 500; mouseY = 500; mouseClicked();', context);
  assert.equal(vm.runInContext('obstacles.length', context), 1);

  vm.runInContext('mouseX = 700; mouseY = 500; mouseClicked();', context);
  assert.equal(vm.runInContext('obstacles.length', context), 1);
});

test('shift-clic, clic droit, molette et C gèrent les obstacles', () => {
  const context = createScene();
  vm.runInContext(`
    obstacles = [new Obstacle(100, 100, 40), new Obstacle(300, 300, 40)];
    mouseX = 100;
    mouseY = 100;
    keyIsDown = code => code === SHIFT;
    mouseClicked();
  `, context);
  assert.equal(vm.runInContext('obstacles.length', context), 1);

  vm.runInContext(`
    keyIsDown = () => false;
    mouseButton = RIGHT;
    mouseX = 300;
    mouseY = 300;
    mouseClicked();
  `, context);
  assert.equal(vm.runInContext('obstacles.length', context), 0);

  vm.runInContext('mouseWheel({ delta: -1 });', context);
  assert.equal(vm.runInContext('nextObstacleRadius', context), 45);
  vm.runInContext('nextObstacleRadius = 80; mouseWheel({ delta: -1 });', context);
  assert.equal(vm.runInContext('nextObstacleRadius', context), 80);

  vm.runInContext('obstacles.push(new Obstacle(10, 10, 30)); key = "C"; keyPressed();', context);
  assert.equal(vm.runInContext('obstacles.length', context), 0);
});
