function setup() {
  const canvasWidth = windowWidth - DASHBOARD_WIDTH;
  const canvas = createCanvas(canvasWidth, windowHeight);
  canvas.parent("app");
  pixelDensity(1);

  difficultySelect = createSelect();
  difficultySelect.option("Facile");
  difficultySelect.option("Moyen");
  difficultySelect.option("Piège");
  difficultySelect.selected(currentLevel);
  difficultySelect.position(width + 18, 14);
  difficultySelect.changed(() => {
    currentLevel = difficultySelect.value();
    resetCircuit(true);
  });

  keepBrainsCheckbox = createCheckbox("Garder les cerveaux", true);
  keepBrainsCheckbox.position(width + 18, 62);

  trafficCheckbox = createCheckbox("Trafic & obstacles", false);
  trafficCheckbox.position(width + 18, 96);

  newCircuitButton = createButton("Nouveau circuit");
  newCircuitButton.position(width + 18, 132);
  newCircuitButton.mousePressed(() => {
    trackSeed = floor(random(1000, 9999));
    circuitNumber++;
    resetCircuit(keepBrainsCheckbox.checked());
    showWinnerBanner();
  });

  relaunchButton = createButton("Relancer le circuit");
  relaunchButton.position(width + 18, 176);
  relaunchButton.mousePressed(() => resetCircuit(false));

  benchmarkButton = createButton("Lancer le benchmark");
  benchmarkButton.position(width + 18, 220);
  benchmarkButton.mousePressed(() => runBenchmark());

  exportButton = createButton("Exporter CSV");
  exportButton.position(width + 18, 264);
  exportButton.mousePressed(() => exportBenchmarkCsv());

  const banner = document.createElement("div");
  banner.id = "banner";
  document.body.appendChild(banner);

  createSpeciesStates();
  resetCircuit(true);
  dashboard = new Dashboard();
}

function showWinnerBanner() {
  const banner = document.getElementById("banner");
  if (!banner) return;
  const winner = speciesStates.slice().sort(compareSpecies)[0];
  if (!winner) return;
  const champion = getChampion(winner);
  const text = `Meilleur cerveau sur ce circuit : ${winner.name} (${champion ? champion.score : 0})`;
  banner.textContent = text;
  banner.classList.add("visible");
  setTimeout(() => banner.classList.remove("visible"), WINNER_BANNER_DURATION);
}

function resetCircuit(preserveBrains = true) {
  buildTrack(currentLevel, trackSeed);

  speciesStates.forEach((species) => {
    const brain = preserveBrains && species.bestBrain ? species.bestBrain : null;
    species.population = [];
    species.savedVehicles = [];
    species.bestCheckpoints = 0;
    species.avgCheckpoints = 0;
    species.firstLapGen = null;
    species.generation = 1;
    for (let i = 0; i < species.populationSize; i++) {
      const vehicle = new Vehicle(brain, species.config, track.start.copy());
      species.population.push(vehicle);
    }
  });

  steeringCar = new SteeringCar(track.start.copy(), { maxspeed: 5.5, maxforce: 0.35 });
  trafficCars = generateTraffic();
  currentWinner = null;
  dashboard && dashboard.render();
}

function updateSpecies(species) {
  if (!species || !species.population || species.population.length === 0) {
    return;
  }

  let alive = 0;
  for (let i = 0; i < species.population.length; i++) {
    const vehicle = species.population[i];
    if (vehicle.dead) {
      species.savedVehicles.push(vehicle);
      continue;
    }

    const force = vehicle.look(track.walls, trafficCars);
    vehicle.applyForce(force);
    vehicle.update();
    vehicle.check(track.checkpoints);
    alive++;

    if (vehicle.score > species.bestCheckpoints) {
      species.bestCheckpoints = vehicle.score;
    }

    if (vehicle.score > 0 && species.firstLapGen === null && vehicle.lapsCompleted > 0) {
      species.firstLapGen = species.generation;
    }
  }

  if (alive === 0) {
    if (species.savedVehicles.length > 0) {
      nextGeneration(species);
    }
  }
}

function draw() {
  background(12, 14, 26);
  drawBackground();
  if (track) {
    track.draw();
  }

  if (trafficCheckbox && trafficCheckbox.checked()) {
    trafficCars = generateTraffic();
    trafficCars.forEach((car) => {
      car.update();
      car.show();
    });
  }

  if (steeringCar) {
    steeringCar.step();
    steeringCar.show();
  }

  speciesStates.forEach((species) => updateSpecies(species));
  speciesStates.forEach((species) => {
    species.population.forEach((vehicle) => vehicle.show());
  });

  const ranking = speciesStates.slice().sort(compareSpecies);
  currentWinner = ranking[0];
  if (currentWinner) {
    const champion = getChampion(currentWinner);
    if (champion) {
      currentWinner.bestCheckpoints = champion.score;
    }
  }

  dashboard && dashboard.render();
}

function drawBackground() {
  push();
  noStroke();
  fill(15, 12, 22);
  rect(0, 0, width, height);
  stroke(255, 40);
  for (let x = 0; x < width; x += 40) {
    line(x, 0, x, height);
  }
  for (let y = 0; y < height; y += 40) {
    line(0, y, width, y);
  }
  pop();
}

function windowResized() {
  const newWidth = windowWidth - DASHBOARD_WIDTH;
  resizeCanvas(newWidth, windowHeight);
  if (track) {
    resetCircuit(keepBrainsCheckbox.checked());
  }
}
