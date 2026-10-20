const TOTAL = 100;
const MUTATION_RATE = 0.1;
const LIFESPAN = 25;
// On regarde le long des capteurs jusqu'à la distance SIGHT.
const SIGHT = 50;
const DASHBOARD_WIDTH = 300;
const WINNER_BANNER_DURATION = 4000;

let generationCount = 0;
let walls = [];
let ray;
let start, end;
let speedSlider;
let inside = [];
let outside = [];
let checkpoints = [];
let bgLayer;
let trackLayer;
let speciesStates = [];
let selectedSpeciesIndex = 0;
let circuitNumber = 1;
let circuitHistory = [];
let winnerBanner = "";
let winnerBannerUntil = 0;
let dashboardMessage = "";
let dashboardRows = [];
let keepBrainsCheckbox;
let brainFileInput;

const maxFitness = 500;
let changeMap = false;

// Construit un circuit à partir du générateur existant.
function buildTrack() {
  checkpoints = [];
  inside = [];
  outside = [];

  let noiseMax = 4;
  const total = 60;
  const pathWidth = 60;
  let startX = random(1000);
  let startY = random(1000);
  for (let i = 0; i < total; i++) {
    let a = map(i, 0, total, 0, TWO_PI);
    let xoff = map(cos(a), -1, 1, 0, noiseMax) + startX;
    let yoff = map(sin(a), -1, 1, 0, noiseMax) + startY;
    let xr = map(noise(xoff, yoff), 0, 1, 100, width * 0.5);
    let yr = map(noise(xoff, yoff), 0, 1, 100, height * 0.5);
    let x1 = width / 2 + (xr - pathWidth) * cos(a);
    let y1 = height / 2 + (yr - pathWidth) * sin(a);
    let x2 = width / 2 + (xr + pathWidth) * cos(a);
    let y2 = height / 2 + (yr + pathWidth) * sin(a);
    checkpoints.push(new Boundary(x1, y1, x2, y2));
    inside.push(createVector(x1, y1));
    outside.push(createVector(x2, y2));
  }
  walls = [];
  for (let i = 0; i < checkpoints.length; i++) {
    let a1 = inside[i];
    let b1 = inside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));
    let a2 = outside[i];
    let b2 = outside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
  }

  start = checkpoints[0].midpoint();
  end = checkpoints[checkpoints.length - 1].midpoint();
  makeTrackLayer();
}

// Dessine le fond une seule fois dans un calque réutilisable.
function makeBackground() {
  bgLayer = createGraphics(width, height);
  const couleurHaut = color(20, 0, 50);
  const couleurBas = color(0, 0, 10);

  for (let y = 0; y < height; y++) {
    bgLayer.stroke(lerpColor(couleurHaut, couleurBas, y / height));
    bgLayer.line(0, y, width, y);
  }

  bgLayer.stroke(255, 0, 255, 35);
  bgLayer.strokeWeight(1);
  for (let x = 0; x <= width; x += 40) {
    bgLayer.line(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += 40) {
    bgLayer.line(0, y, width, y);
  }

  bgLayer.noStroke();
  for (let i = 0; i < 150; i++) {
    bgLayer.fill(255, random(80, 220));
    const diametre = random(1, 3);
    bgLayer.circle(random(width), random(height), diametre);
  }
}

// Prérend la piste une fois par circuit.
function makeTrackLayer() {
  if (!trackLayer) {
    trackLayer = createGraphics(width, height);
  }
  trackLayer.clear();
  trackLayer.noFill();

  trackLayer.fill(25, 25, 40);
  trackLayer.noStroke();
  trackLayer.beginShape();
  outside.forEach(point => {
    trackLayer.vertex(point.x, point.y);
  });
  trackLayer.beginContour();
  for (let i = inside.length - 1; i >= 0; i--) {
    trackLayer.vertex(inside[i].x, inside[i].y);
  }
  trackLayer.endContour();
  trackLayer.endShape(CLOSE);

  const dessinerBordNeon = (points, couleur) => {
    trackLayer.drawingContext.shadowBlur = 15;
    trackLayer.drawingContext.shadowColor = couleur;
    trackLayer.stroke(couleur);
    trackLayer.strokeWeight(3);
    trackLayer.noFill();
    trackLayer.beginShape();
    points.forEach(point => {
      trackLayer.vertex(point.x, point.y);
    });
    trackLayer.endShape(CLOSE);
  };

  dessinerBordNeon(inside, "magenta");
  dessinerBordNeon(outside, "cyan");
  trackLayer.drawingContext.shadowBlur = 0;

  trackLayer.stroke(255, 30);
  trackLayer.strokeWeight(1);
  checkpoints.forEach(checkpoint => {
    trackLayer.line(
      checkpoint.a.x,
      checkpoint.a.y,
      checkpoint.b.x,
      checkpoint.b.y
    );
  });
}

function drawTrack() {
  image(trackLayer, 0, 0);
}

function createSpeciesState(config, index) {
  return {
    config,
    name: config.name,
    color: config.color,
    population: [],
    savedVehicles: [],
    populationSize: Math.floor(TOTAL / SPECIES_CONFIG.length) +
      (index < TOTAL % SPECIES_CONFIG.length ? 1 : 0),
    generations: 1,
    bestCheckpoints: 0,
    avgCheckpoints: 0,
    firstLapGen: null,
    bestBrain: null
  };
}

function resetSpeciesStats(species) {
  species.generations = 1;
  species.bestCheckpoints = 0;
  species.avgCheckpoints = 0;
  species.firstLapGen = null;
}

function releaseSpeciesNetworks(species) {
  const oldVehicles = species.population.concat(species.savedVehicles);
  const uniqueVehicles = Array.from(new Set(oldVehicles));
  uniqueVehicles.forEach(vehicle => vehicle.dispose());
  species.population = [];
  species.savedVehicles = [];
}

function resetSpeciesPopulation(species, sourceBrain = null) {
  const nextPopulation = [];
  for (let i = 0; i < species.populationSize; i++) {
    nextPopulation.push(new Vehicle(sourceBrain, species.config));
  }

  releaseSpeciesNetworks(species);
  if (species.bestBrain) {
    species.bestBrain.dispose();
    species.bestBrain = null;
  }
  species.population = nextPopulation;
  species.savedVehicles = [];
  resetSpeciesStats(species);
}

function getSpeciesChampion(species) {
  const candidates = species.population.concat(species.savedVehicles);
  if (candidates.length === 0) {
    return undefined;
  }
  return candidates.reduce((best, vehicle) =>
    vehicle.checkpointsPassed > best.checkpointsPassed ? vehicle : best
  );
}

function compareSpecies(first, second) {
  if (first.bestCheckpoints !== second.bestCheckpoints) {
    return second.bestCheckpoints - first.bestCheckpoints;
  }
  const firstLap = first.firstLapGen === null ? Infinity : first.firstLapGen;
  const secondLap = second.firstLapGen === null ? Infinity : second.firstLapGen;
  if (firstLap !== secondLap) {
    return firstLap - secondLap;
  }
  return second.avgCheckpoints - first.avgCheckpoints;
}

function finishCircuit() {
  const winner = speciesStates.slice().sort(compareSpecies)[0];
  if (!winner) {
    return;
  }

  circuitHistory.push({
    circuitNumber,
    winnerName: winner.name,
    score: winner.bestCheckpoints
  });
  winnerBanner = "Meilleur cerveau sur ce circuit : " +
    winner.name + " (" + winner.bestCheckpoints + ")";
  winnerBannerUntil = millis() + WINNER_BANNER_DURATION;
}

function startNewCircuit() {
  finishCircuit();
  const preserveBrains = keepBrainsCheckbox.checked();
  const champions = speciesStates.map(species => {
    const champion = getSpeciesChampion(species);
    return species.bestBrain || (champion ? champion.brain : null);
  });

  circuitNumber++;
  buildTrack();
  speciesStates.forEach((species, index) => {
    resetSpeciesPopulation(
      species,
      preserveBrains ? champions[index] : null
    );
  });
  dashboardMessage = preserveBrains
    ? "Cerveaux précédents réutilisés sur ce circuit."
    : "Nouveau circuit : cerveaux aléatoires.";
}

function restartCircuit() {
  speciesStates.forEach(species => {
    resetSpeciesPopulation(species);
  });
  winnerBanner = "";
  dashboardMessage = "Circuit relancé avec des cerveaux aléatoires.";
}

function saveWinningBrain() {
  const winner = speciesStates.slice().sort(compareSpecies)[0];
  const champion = winner && getSpeciesChampion(winner);
  const brain = winner && (winner.bestBrain || (champion && champion.brain));
  if (!brain) {
    dashboardMessage = "Aucun cerveau disponible à sauvegarder.";
    return;
  }

  saveJSON({
    speciesName: winner.name,
    network: brain.exportWeights()
  }, "neon-racing-" + winner.name.toLowerCase() + ".json");
  dashboardMessage = "Cerveau sauvegardé : " + winner.name + ".";
}

function handleBrainFile(file) {
  if (!file || !file.data) {
    return;
  }

  let brain;
  try {
    let content = file.data;
    if (content.indexOf("data:") === 0) {
      const separator = content.indexOf(",");
      const metadata = content.slice(0, separator);
      const payload = content.slice(separator + 1);
      content = metadata.indexOf(";base64") !== -1
        ? atob(payload)
        : decodeURIComponent(payload);
    }
    const saved = JSON.parse(content);
    const species = speciesStates[selectedSpeciesIndex];
    brain = new NeuralNetwork(
      species.config.nbRays,
      species.config.hidden,
      2
    );
    brain.importWeights(saved.network);
    resetSpeciesPopulation(species, brain);
    dashboardMessage = "Cerveau chargé pour " + species.name + ".";
  } catch (error) {
    dashboardMessage = "Chargement impossible : " + error.message;
    console.error(error);
  } finally {
    if (brain) {
      brain.dispose();
    }
  }
}

function setButtonStyle(button) {
  button.style("background", "#21113b");
  button.style("color", "#8ffcff");
  button.style("border", "1px solid #bf53ff");
  button.style("padding", "6px 9px");
}

function setupControls() {
  const newTrackButton = createButton("Nouveau circuit");
  newTrackButton.position(10, height + 10);
  newTrackButton.mousePressed(startNewCircuit);
  setButtonStyle(newTrackButton);

  const restartButton = createButton("Relancer le circuit");
  restartButton.position(135, height + 10);
  restartButton.mousePressed(restartCircuit);
  setButtonStyle(restartButton);

  keepBrainsCheckbox = createCheckbox("Garder les cerveaux", false);
  keepBrainsCheckbox.position(290, height + 10);

  const saveBrainButton = createButton("Sauvegarder le meilleur cerveau");
  saveBrainButton.position(445, height + 10);
  saveBrainButton.mousePressed(saveWinningBrain);
  setButtonStyle(saveBrainButton);

  brainFileInput = createFileInput(handleBrainFile);
  brainFileInput.attribute("accept", ".json,application/json");
  brainFileInput.hide();
  const loadBrainButton = createButton("Charger un cerveau");
  loadBrainButton.position(685, height + 10);
  loadBrainButton.mousePressed(() => brainFileInput.elt.click());
  setButtonStyle(loadBrainButton);

  createSpan("Vitesse").position(10, height + 45);
  speedSlider = createSlider(1, 10, 1);
  speedSlider.position(65, height + 45);
}

function setup() {
  createCanvas(1200, 800);
  makeBackground();
  tf.setBackend("cpu");
  buildTrack();

  speciesStates = SPECIES_CONFIG.map((config, index) =>
    createSpeciesState(config, index)
  );
  speciesStates.forEach(species => {
    for (let i = 0; i < species.populationSize; i++) {
      species.population.push(new Vehicle(null, species.config));
    }
  });

  setupControls();
}

function updateSpecies(species) {
  for (let vehicle of species.population) {
    vehicle.applyBehaviors(walls);
    vehicle.check(checkpoints);
    recordSpeciesBestBrain(species, vehicle);
    if (vehicle.lapsCompleted > 0 && species.firstLapGen === null) {
      species.firstLapGen = species.generations;
    }
    vehicle.update();
  }

  for (let i = species.population.length - 1; i >= 0; i--) {
    const vehicle = species.population[i];
    if (vehicle.dead || vehicle.finished) {
      species.savedVehicles.push(species.population.splice(i, 1)[0]);
    }
  }

  if (species.population.length === 0) {
    nextGeneration(species);
  }
}

function recordSpeciesBestBrain(species, vehicle) {
  if (vehicle.checkpointsPassed > species.bestCheckpoints) {
    species.bestCheckpoints = vehicle.checkpointsPassed;
    if (species.bestBrain) {
      species.bestBrain.dispose();
    }
    species.bestBrain = vehicle.brain.copy();
  }
}

function drawSpeciesDashboard() {
  const panelX = width - DASHBOARD_WIDTH;
  const panelY = 0;
  const ranking = speciesStates.slice().sort(compareSpecies);
  const rowHeight = 83;
  const historyWins = {};

  circuitHistory.forEach(result => {
    historyWins[result.winnerName] =
      (historyWins[result.winnerName] || 0) + 1;
  });

  push();
  noStroke();
  fill(8, 5, 24, 225);
  rect(panelX, panelY, DASHBOARD_WIDTH, height);
  stroke(80, 245, 255, 180);
  strokeWeight(1);
  line(panelX, 0, panelX, height);
  noStroke();
  fill(120, 245, 255);
  textSize(20);
  text("Circuit n°" + circuitNumber, panelX + 14, 27);

  textSize(11);
  fill(185, 190, 220);
  text("CLASSEMENT  ·  record / moyenne / génération", panelX + 14, 48);

  dashboardRows = [];
  ranking.forEach((species, index) => {
    const y = 66 + index * rowHeight;
    dashboardRows.push({ species, y });
    const alive = species.population.length;
    const isSelected = speciesStates[selectedSpeciesIndex] === species;

    if (isSelected) {
      fill(80, 40, 110, 90);
      rect(panelX + 8, y, DASHBOARD_WIDTH - 16, rowHeight - 4, 6);
    }

    noStroke();
    fill(species.color[0], species.color[1], species.color[2]);
    circle(panelX + 20, y + 14, 9);
    fill(245);
    textSize(14);
    text(
      (index + 1) + ". " + species.name +
        (species.firstLapGen !== null ? "  ✔" : ""),
      panelX + 31,
      y + 18
    );
    textSize(11);
    fill(200, 205, 225);
    text(
      "Best " + species.bestCheckpoints +
        "   Moy " + species.avgCheckpoints.toFixed(1) +
        "   Gén. " + species.generations,
      panelX + 15,
      y + 38
    );

    fill(35, 35, 55);
    rect(panelX + 15, y + 49, DASHBOARD_WIDTH - 30, 8, 4);
    fill(species.color[0], species.color[1], species.color[2], 210);
    const progress = alive / species.populationSize;
    rect(panelX + 15, y + 49, (DASHBOARD_WIDTH - 30) * progress, 8, 4);
    fill(190, 195, 220);
    text(alive + " / " + species.populationSize + " voitures", panelX + 15, y + 72);
  });

  let historyY = 66 + ranking.length * rowHeight + 3;
  fill(120, 245, 255);
  textSize(13);
  text("HISTORIQUE", panelX + 14, historyY);
  historyY += 18;
  fill(220, 220, 235);
  textSize(11);
  const recentHistory = circuitHistory.slice(-5).reverse();
  if (recentHistory.length === 0) {
    text("Aucun circuit terminé", panelX + 14, historyY);
    historyY += 16;
  } else {
    recentHistory.forEach(result => {
      text(
        "Circuit " + result.circuitNumber + " → " +
          result.winnerName + " (" + result.score + ")",
        panelX + 14,
        historyY
      );
      historyY += 15;
    });
  }

  historyY += 5;
  fill(120, 245, 255);
  textSize(13);
  text("VICTOIRES PAR ESPÈCE", panelX + 14, historyY);
  historyY += 18;
  fill(220, 220, 235);
  textSize(11);
  speciesStates.forEach(species => {
    text(
      species.name + " : " + (historyWins[species.name] || 0),
      panelX + 14,
      historyY
    );
    historyY += 15;
  });

  if (dashboardMessage) {
    fill(180, 220, 255);
    textSize(10);
    text(dashboardMessage, panelX + 14, height - 18, DASHBOARD_WIDTH - 25);
  }
  pop();
}

function draw() {
  image(bgLayer, 0, 0);

  const cycles = speedSlider.value();
  for (let n = 0; n < cycles; n++) {
    speciesStates.forEach(updateSpecies);
  }

  drawTrack();
  speciesStates.forEach(species => {
    species.population.forEach(vehicle => vehicle.show());
  });

  const selectedSpecies = speciesStates[selectedSpeciesIndex];
  const selectedChampion = getSpeciesChampion(selectedSpecies);
  if (selectedChampion) {
    selectedChampion.highlight();
  }

  fill(255);
  textSize(20);
  noStroke();
  text("Circuit n°" + circuitNumber, 14, 28);

  if (winnerBanner && millis() < winnerBannerUntil) {
    push();
    textAlign(CENTER, CENTER);
    textSize(22);
    fill(8, 5, 24, 220);
    rect(width / 2 - 285, 12, 570, 42, 8);
    fill(120, 255, 210);
    text(winnerBanner, width / 2, 33);
    pop();
  }

  drawSpeciesDashboard();
}

function mousePressed() {
  const panelX = width - DASHBOARD_WIDTH;
  if (mouseX < panelX) {
    return;
  }

  dashboardRows.forEach((row, index) => {
    if (
      mouseX >= panelX + 10 &&
      mouseX <= panelX + DASHBOARD_WIDTH - 10 &&
      mouseY >= row.y &&
      mouseY <= row.y + 42
    ) {
      selectedSpeciesIndex = speciesStates.indexOf(row.species);
    }
  });
}
