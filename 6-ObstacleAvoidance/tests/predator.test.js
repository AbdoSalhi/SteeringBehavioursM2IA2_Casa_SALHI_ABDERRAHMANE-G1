const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
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

  copy() {
    return new Vector(this.x, this.y);
  }

  mag() {
    return Math.hypot(this.x, this.y);
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const magnitude = this.mag();
    if (magnitude > 0) {
      this.div(magnitude);
    }
    return this;
  }

  setMag(magnitude) {
    return this.normalize().mult(magnitude);
  }

  limit(maximum) {
    if (this.magSq() > maximum * maximum) {
      this.setMag(maximum);
    }
    return this;
  }

  dist(vector) {
    return Math.hypot(this.x - vector.x, this.y - vector.y);
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  static add(first, second) {
    return first.copy().add(second);
  }

  static sub(first, second) {
    return first.copy().sub(second);
  }

  static dist(first, second) {
    return first.dist(second);
  }

  static random2D() {
    return new Vector(1, 0);
  }
}

function loadExample() {
  const root = path.resolve(__dirname, "..");
  const drawCalls = [];
  const context = {
    console,
    Math,
    Infinity,
    width: 800,
    height: 600,
    windowWidth: 800,
    windowHeight: 600,
    key: "",
    vehicules: [],
    drawCalls,
    random: (maximum) => maximum / 2,
    max: Math.max,
    createVector: (x, y) => new Vector(x, y),
    p5: {
      Vector,
    },
    createCanvas() {},
    background() {},
    fill() {},
    noFill() {},
    noStroke() {},
    stroke() {},
    strokeWeight() {},
    circle(...args) {
      drawCalls.push(["circle", ...args]);
    },
    ellipse(...args) {
      drawCalls.push(["ellipse", ...args]);
    },
    line(...args) {
      drawCalls.push(["line", ...args]);
    },
    triangle(...args) {
      drawCalls.push(["triangle", ...args]);
    },
    bezier(...args) {
      drawCalls.push(["bezier", ...args]);
    },
    push() {},
    pop() {},
    translate() {},
    rotate() {},
    text() {},
    textSize() {},
    map(value, start1, stop1, start2, stop2) {
      return start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2);
    },
  };
  vm.createContext(context);

  ["vehicle.js", "obstacle.js", "predator.js", "sketch.js"].forEach(file => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  });
  vm.runInContext(
    "globalThis.example = { Vehicle, Obstacle, Predator, createPredator, preyCanSeePredator, applyPreyBehaviors, handleCaptures, drawCalls, resetDrawCalls: () => { drawCalls.length = 0; }, getState: () => ({ vehicules, predators, captures }), setState: (state) => { vehicules = state.vehicules; predators = state.predators; captures = state.captures; }, setTarget: (value) => { target = value; }, setObstacles: (value) => { obstacles = value; } };",
    context
  );

  return context.example;
}

const example = loadExample();

test("le chat est dessiné sans modifier le mouvement ni les rayons", () => {
  const cat = new example.Vehicle(100, 120);
  cat.vel = new Vector(3, 4);
  const positionAvant = cat.pos.copy();
  const vitesseAvant = cat.vel.copy();
  const rayonAvant = cat.r;
  example.resetDrawCalls();
  example.Vehicle.debug = true;

  cat.show();

  example.Vehicle.debug = false;
  assert.deepEqual([cat.pos.x, cat.pos.y], [positionAvant.x, positionAvant.y]);
  assert.deepEqual([cat.vel.x, cat.vel.y], [vitesseAvant.x, vitesseAvant.y]);
  assert.equal(cat.r, rayonAvant);
  assert.ok(example.drawCalls.some(call => call[0] === "ellipse"));
  assert.ok(example.drawCalls.some(call => call[0] === "triangle"));
  assert.ok(example.drawCalls.some(call => call[0] === "bezier"));
  assert.equal(
    example.drawCalls.filter(call => call[0] === "circle" && call[3] === rayonAvant).length,
    2
  );
});

test("la pelote conserve le rayon de l'obstacle", () => {
  const obstacle = new example.Obstacle(200, 180, 40, "green");
  example.resetDrawCalls();

  obstacle.show();

  assert.equal(obstacle.r, 40);
  assert.deepEqual([obstacle.pos.x, obstacle.pos.y], [200, 180]);
  assert.ok(
    example.drawCalls.some(
      call => call[0] === "circle" && call[1] === 0 && call[2] === 0 && call[3] === 80
    )
  );
});

test("le prédateur sélectionne la proie la plus proche et prédit sa position", () => {
  const predator = example.createPredator(100, 100);
  const farPrey = new example.Vehicle(300, 100);
  const nearPrey = new example.Vehicle(150, 100);
  nearPrey.vel = new Vector(2, 0);
  example.setState({
    vehicules: [farPrey, nearPrey],
    predators: [],
    captures: 0,
  });
  example.setObstacles([{ pos: new Vector(700, 500), r: 10 }]);

  predator.applyBehaviors(new Vector(0, 0), [{ pos: new Vector(700, 500), r: 10 }], [farPrey, nearPrey]);

  assert.equal(predator.proieCiblee, nearPrey);
  assert.equal(predator.pointDePrediction.x, nearPrey.pos.x + 20);
  assert.equal(predator.pointDePrediction.y, nearPrey.pos.y);
  assert.ok(predator.acc.mag() <= predator.maxForce);
  assert.ok(predator.maxSpeed > nearPrey.maxSpeed);
});

test("la force combinée de poursuite et d'évitement reste limitée", () => {
  const predator = example.createPredator(100, 100);
  predator.pursue = () => new Vector(predator.maxForce, 0);
  predator.avoid = () => new Vector(0, predator.maxForce);

  predator.applyBehaviors(new Vector(0, 0), [], []);

  assert.ok(predator.acc.mag() <= predator.maxForce);
  assert.ok(predator.acc.mag() > 0);
});

test("le champ de vision respecte la portée et l'angle, y compris à l'arrêt", () => {
  const prey = new example.Vehicle(100, 100);
  prey.vel = new Vector(1, 0);

  assert.equal(example.preyCanSeePredator(prey, new example.Vehicle(200, 100)), true);
  assert.equal(example.preyCanSeePredator(prey, new example.Vehicle(100, 200)), false);
  assert.equal(example.preyCanSeePredator(prey, new example.Vehicle(300, 100)), false);

  prey.vel = new Vector(0, 0);
  assert.equal(example.preyCanSeePredator(prey, new example.Vehicle(200, 100)), true);
});

test("une proie visible ajoute une force d'évasion", () => {
  const prey = {
    applyBehaviors() {},
    applyForce(force) {
      this.force = force;
    },
    evade() {
      return new Vector(-1, 0);
    },
    pos: new Vector(100, 100),
    vel: new Vector(1, 0),
  };
  const predator = { pos: new Vector(150, 100) };
  example.setState({ vehicules: [prey], predators: [predator], captures: 0 });

  example.applyPreyBehaviors(prey);

  assert.equal(prey.force.x, -1);
  assert.equal(prey.force.y, 0);
});

test("une capture remplace la proie et incrémente le compteur", () => {
  const prey = new example.Vehicle(100, 100);
  const predator = example.createPredator(100, 100);
  example.setState({
    vehicules: [prey],
    predators: [predator],
    captures: 0,
  });

  example.handleCaptures();
  const state = example.getState();

  assert.equal(state.vehicules.length, 1);
  assert.notEqual(state.vehicules[0], prey);
  assert.equal(state.vehicules[0].pos.x, 400);
  assert.equal(state.vehicules[0].pos.y, 300);
  assert.equal(state.captures, 1);
});
