import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const configSource = await readFile(new URL("../CONFIG.js", import.meta.url), "utf8");
const shapesSource = await readFile(
  new URL("../CircuitShapes.js", import.meta.url),
  "utf8"
);
const snakeSource = await readFile(new URL("../Snake.js", import.meta.url), "utf8");
const backgroundSource = await readFile(
  new URL("../Background.js", import.meta.url),
  "utf8"
);
const vehicleSource = await readFile(
  new URL("../vehicle.js", import.meta.url),
  "utf8"
);

class Vector {
  constructor(x, y) {
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

  add(x, y) {
    if (typeof x === "object") {
      this.x += x.x;
      this.y += x.y;
    } else {
      this.x += x;
      this.y += y;
    }
    return this;
  }

  sub(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  mult(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }

  div(value) {
    this.x /= value;
    this.y /= value;
    return this;
  }

  mag() {
    return Math.hypot(this.x, this.y);
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const length = this.mag();
    if (length) this.div(length);
    return this;
  }

  setMag(value) {
    return this.normalize().mult(value);
  }

  limit(value) {
    if (this.mag() > value) this.setMag(value);
    return this;
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }
}

const vectorApi = {
  add(first, second) {
    return first.copy().add(second);
  },
  sub(first, second) {
    return first.copy().sub(second);
  },
  dist(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }
};

const context = {
  Math,
  TWO_PI: Math.PI * 2,
  HALF_PI: Math.PI / 2,
  PI: Math.PI,
  RGB: "rgb",
  HSB: "hsb",
  CLOSE: "close",
  CENTER: "center",
  width: 1200,
  height: 800,
  frameCount: 0,
  mouseX: -1,
  mouseY: -1,
  debug: false,
  random(minimum = 1, maximum) {
    if (maximum === undefined) return minimum * 0.5;
    return (minimum + maximum) * 0.5;
  },
  createVector: (x, y) => new Vector(x, y),
  p5: { Vector: vectorApi },
  min: Math.min,
  max: Math.max,
  constrain: (value, low, high) => Math.max(low, Math.min(value, high)),
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  push() {},
  pop() {},
  colorMode() {},
  stroke() {},
  strokeWeight() {},
  fill() {},
  circle() {},
  noise(x, y, z) {
    return (Math.sin(x * 1.7 + y * 0.9 + z) + 1) / 2;
  },
  background() {},
  image() {},
  createGraphics(width, height) {
    const drawingContext = {
      createImageData(imageWidth, imageHeight) {
        return { data: new Uint8ClampedArray(imageWidth * imageHeight * 4) };
      },
      putImageData(imageData) {
        this.lastPixels = imageData.data.slice();
      }
    };
    return { width, height, drawingContext, pixelDensity() {} };
  }
};

vm.runInNewContext(configSource, context);
context.CONFIG = vm.runInNewContext("CONFIG", context);
vm.runInNewContext(shapesSource, context);
vm.runInNewContext(vehicleSource, context);
context.Vehicle = vm.runInNewContext("Vehicle", context);
vm.runInNewContext(snakeSource, context);
vm.runInNewContext(backgroundSource, context);
context.CircuitShapes = vm.runInNewContext("CircuitShapes", context);
context.CircuitEditor = vm.runInNewContext("CircuitEditor", context);
context.Snake = vm.runInNewContext("Snake", context);
context.AuroraBackground = vm.runInNewContext("AuroraBackground", context);

test("les paramètres de steering par défaut reprennent ceux du sketch", () => {
  const config = context.CONFIG;
  assert.equal(config.behaviors.maxSpeed, 2);
  assert.equal(config.behaviors.maxForce, 0.3);
  assert.equal(config.behaviors.pathWeight, 2);
  assert.equal(config.behaviors.separationWeight, 1.2);
  assert.equal(config.behaviors.wanderWeight, 0);
  assert.equal(config.behaviors.prediction, 25);
  assert.equal(config.circuit.radius, 20);
});

test("chaque géométrie crée une boucle Catmull-Rom fermée", () => {
  const shapes = context.CircuitShapes;
  const names = [
    "circle",
    "ellipse",
    "infinity",
    "star",
    "roundedRect",
    "spiral",
    "free"
  ];
  for (const shape of names) {
    const controls = shapes.create(shape, 30, 0.7, 0.1);
    const smooth = shapes.interpolateClosed(controls, 8);
    assert.equal(controls.length, 30, shape);
    assert.equal(smooth.length, 240, shape);
    assert.ok(
      Math.hypot(
        smooth[0].x - smooth[smooth.length - 1].x,
        smooth[0].y - smooth[smooth.length - 1].y
      ) < 20,
      `${shape} doit refermer sa spline sans saut`
    );
  }
});

test("la géométrie libre conserve le rayon aléatoire d'origine", () => {
  const controls = context.CircuitShapes.create(
    "free",
    30,
    context.CONFIG.circuit.scale,
    context.CONFIG.circuit.irregularity
  );
  const expectedRadius =
    Math.min(context.width, context.height) *
    (1 / 3 + 1 / 2.5) /
    2;
  for (const point of controls) {
    assert.ok(
      Math.abs(Math.hypot(point.x - context.width / 2, point.y - context.height / 2) - expectedRadius) < 1e-6
    );
  }
});

test("l'éditeur ajoute et retire des points tout en gardant huit points minimum", () => {
  context.CONFIG.circuit.editMode = true;
  context.controlPoints = context.CircuitShapes.create("circle", 8, 0.5, 0);
  let rebuilds = 0;
  const editor = new context.CircuitEditor(() => rebuilds++);
  editor.addPoint(600, 200);
  assert.equal(context.controlPoints.length, 9);
  assert.equal(context.CONFIG.circuit.controlPoints, 9);
  editor.removePoint(600, 200);
  assert.equal(context.controlPoints.length, 8);
  for (let i = 0; i < 4; i++) editor.removePoint(600, 200);
  assert.equal(context.controlPoints.length, 8);
  assert.equal(rebuilds, 2);
});

test("la trace suit la tête à espacement régulier sans modifier sa physique", () => {
  const snake = new context.Snake(0, 0, 2, 0.3);
  snake.vel.set(2, 0);
  const originalForce = snake.maxForce;
  for (let step = 0; step <= 200; step++) {
    snake.pos.set(step * 2, 0);
    snake._updateBody(true);
  }

  assert.equal(snake.segmentPoints.length, 34);
  assert.equal(snake.pos.x, 400);
  assert.equal(snake.vel.x, 2);
  assert.equal(snake.maxForce, originalForce);
  for (let i = 1; i < snake.centerPoints.length; i++) {
    const gap = Vector.prototype.mag.call(
      new Vector(
        snake.centerPoints[i].x - snake.centerPoints[i - 1].x,
        snake.centerPoints[i].y - snake.centerPoints[i - 1].y
      )
    );
    assert.ok(Math.abs(gap - 7.2) < 1e-8);
  }
});

test("la distance d'anticipation reste réglable sans changer l'algorithme", () => {
  const vehicle = new context.Vehicle(80, 60, 2, 0.3);
  const points = [
    new Vector(-10, -10),
    new Vector(10, -10),
    new Vector(10, 10),
    new Vector(-10, 10)
  ];
  const path = { points, radius: 1 };
  vehicle.seek = (target) => target.copy();

  context.CONFIG.behaviors.prediction = 25;
  const firstTarget = vehicle.follow(path);
  context.CONFIG.behaviors.prediction = 40;
  const secondTarget = vehicle.follow(path);
  assert.ok(
    Math.hypot(firstTarget.x - secondTarget.x, firstTarget.y - secondTarget.y) > 0.1
  );
  context.CONFIG.behaviors.prediction = 25;
});

test("le fond Perlin remplit le tampon et avance en douceur", () => {
  const background = new context.AuroraBackground();
  background.draw();
  const firstFrame = background.context.lastPixels.slice();
  const previousTime = background.time;
  background.draw();

  assert.ok(background.time > previousTime);
  assert.ok(
    firstFrame.some(
      (channel, index) => channel !== background.context.lastPixels[index]
    )
  );
  const pausedTime = background.time;
  const pausedFrame = background.context.lastPixels.slice();
  background.draw(false);
  assert.equal(background.time, pausedTime);
  assert.deepEqual(
    Array.from(background.context.lastPixels),
    Array.from(pausedFrame)
  );
  for (let index = 3; index < background.context.lastPixels.length; index += 4) {
    assert.equal(background.context.lastPixels[index], 255);
  }
});
