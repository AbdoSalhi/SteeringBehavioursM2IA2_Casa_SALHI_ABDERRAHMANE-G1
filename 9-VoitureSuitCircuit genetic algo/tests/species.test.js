const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  mult(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }

  set() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  limit() {
    return this;
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  static dist(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  static fromAngle(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
  }
}

class NeuralNetworkMock {
  constructor(inputNodes, hiddenNodes, outputNodes, lineage) {
    this.input_nodes = inputNodes;
    this.hidden_nodes = hiddenNodes;
    this.output_nodes = outputNodes;
    this.lineage = lineage || Math.random();
    this.mutations = [];
    this.disposed = false;
  }

  copy() {
    return new NeuralNetworkMock(
      this.input_nodes,
      this.hidden_nodes,
      this.output_nodes,
      this.lineage
    );
  }

  mutate(rate) {
    this.mutations.push(rate);
  }

  dispose() {
    this.disposed = true;
  }
}

function loadProject() {
  const root = path.resolve(__dirname, "..");
  const context = {
    Math,
    Infinity,
    SIGHT: 50,
    start: { x: 10, y: 20 },
    random: () => 0.25,
    radians: degrees => degrees * Math.PI / 180,
    createVector: (x, y) => new Vector(x, y),
    p5: { Vector },
    pow: Math.pow,
    abs: Math.abs,
    NeuralNetwork: NeuralNetworkMock
  };
  vm.createContext(context);

  ["species.js", "ray.js", "vehicle.js", "ga.js", "sketch.js"].forEach(file => {
    vm.runInContext(
      fs.readFileSync(path.join(root, file), "utf8"),
      context,
      { filename: file }
    );
  });
  vm.runInContext(
    "start = { x: 10, y: 20 }; globalThis.api = { configs: SPECIES_CONFIG, Vehicle, nextGeneration, calculateFitnessForAllCars, getLap: (vehicle, checkpoints) => vehicle.check(checkpoints), recordSpeciesBestBrain };",
    context
  );
  return context.api;
}

const project = loadProject();

test("les quatre espèces ont leurs paramètres et leurs dimensions de réseau", () => {
  const expected = [
    ["Prudent", 5, 60, 6, 4, 0.3, 0.1],
    ["Équilibré", 9, 90, 18, 5, 0.2, 0.1],
    ["Explorateur", 13, 140, 26, 5, 0.2, 0.15],
    ["Rapide", 7, 70, 14, 7, 0.25, 0.1]
  ];

  expected.forEach((values, index) => {
    const config = project.configs[index];
    const vehicle = new project.Vehicle(null, config);
    assert.deepEqual(
      [
        config.name,
        vehicle.rays.length,
        config.fov,
        vehicle.brain.hidden_nodes,
        vehicle.maxspeed,
        vehicle.maxforce,
        config.mutationRate
      ],
      values
    );
    assert.equal(vehicle.brain.input_nodes, config.nbRays);
  });
});

test("un tour incrémente les checkpoints bruts et le compteur de tours", () => {
  const vehicle = new project.Vehicle(null, project.configs[0]);
  const checkpoint = {
    a: new Vector(0, 20),
    b: new Vector(20, 20)
  };
  vehicle.index = 1;

  project.getLap(vehicle, [checkpoint, checkpoint]);

  assert.equal(vehicle.checkpointsPassed, 1);
  assert.equal(vehicle.lapsCompleted, 1);
  assert.equal(vehicle.index, 0);
});

test("une génération ne sélectionne et ne libère que les voitures de son espèce", () => {
  const firstConfig = project.configs[0];
  const secondConfig = project.configs[1];
  const parentA = new project.Vehicle(null, firstConfig);
  const parentB = new project.Vehicle(null, firstConfig);
  parentA.checkpointsPassed = 3;
  parentB.checkpointsPassed = 1;
  const otherSpeciesCar = new project.Vehicle(null, secondConfig);
  const species = {
    config: firstConfig,
    population: [],
    savedVehicles: [parentA, parentB],
    populationSize: 2,
    generations: 1,
    avgCheckpoints: 0
  };
  const otherSpecies = {
    config: secondConfig,
    population: [otherSpeciesCar],
    savedVehicles: [],
    generations: 4
  };

  project.nextGeneration(species);

  assert.equal(species.population.length, 2);
  assert.ok(species.population.every(car => car.species === firstConfig));
  assert.ok(species.population.every(car => car.brain.input_nodes === 5));
  assert.ok(species.population.every(car => car.brain.mutations[0] === 0.1));
  assert.equal(species.avgCheckpoints, 2);
  assert.equal(species.generations, 2);
  assert.equal(species.savedVehicles.length, 0);
  assert.equal(parentA.brain.disposed, true);
  assert.equal(parentB.brain.disposed, true);
  assert.equal(otherSpecies.population[0], otherSpeciesCar);
  assert.equal(otherSpecies.generations, 4);
});

test("le meilleur cerveau brut est conservé et remplacé uniquement par un meilleur score", () => {
  const species = { bestCheckpoints: 0, bestBrain: null };
  const first = new project.Vehicle(null, project.configs[0]);
  first.checkpointsPassed = 2;
  project.recordSpeciesBestBrain(species, first);
  const firstBestBrain = species.bestBrain;

  const tie = new project.Vehicle(null, project.configs[0]);
  tie.checkpointsPassed = 2;
  project.recordSpeciesBestBrain(species, tie);

  const nextBest = new project.Vehicle(null, project.configs[0]);
  nextBest.checkpointsPassed = 3;
  project.recordSpeciesBestBrain(species, nextBest);

  assert.equal(species.bestCheckpoints, 3);
  assert.equal(firstBestBrain.disposed, true);
  assert.equal(species.bestBrain.disposed, false);
  assert.equal(species.bestBrain.input_nodes, project.configs[0].nbRays);
});
