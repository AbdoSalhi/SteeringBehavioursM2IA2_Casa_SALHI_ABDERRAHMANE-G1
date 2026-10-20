// État p5 global, conservé pour les comportements et contrôles du sketch.
let debug = false;
let path;
let vehicles = [];
let controlPoints = [];
let circuitEditor;
let controlPanel;
let animatedBackground;
let canvasElement;
let speedControlTouched = false;
let forceControlTouched = false;

function setup() {
  createCanvas(1200, 800);
  pixelDensity(1);
  canvasElement = document.querySelector("canvas");
  animatedBackground = new AuroraBackground();
  circuitEditor = new CircuitEditor(updatePathFromControls);
  bindCircuitEditing();
  newPath();

  for (let i = 0; i < CONFIG.snake.count; i++) {
    newVehicle(random(width), random(height));
  }
  controlPanel = new ControlPanel();
  createP("D : debug · H : panneau · glisser : créer un serpent");
}

function draw() {
  animatedBackground.draw(!CONFIG.general.paused);
  path.display();
  circuitEditor.drawHandles();

  for (const vehicle of vehicles) {
    if (CONFIG.general.paused) {
      vehicle.render(false);
    } else {
      vehicle.applyBehaviors(vehicles, path);
      vehicle.run();
    }
  }
  controlPanel.updateFps(frameRate());
}

function newPath() {
  controlPoints = CircuitShapes.create(
    CONFIG.circuit.shape,
    CONFIG.circuit.controlPoints,
    CONFIG.circuit.scale,
    CONFIG.circuit.irregularity
  );
  updatePathFromControls();
}

function updatePathFromControls() {
  path = new Path();
  path.radius = CONFIG.circuit.radius;
  path.points = CircuitShapes.interpolateClosed(controlPoints, 8);
  if (controlPanel) {
    controlPanel.refreshControl("circuit.controlPoints", controlPoints.length);
  }
}

function newVehicle(x, y) {
  const maxSpeed = speedControlTouched
    ? CONFIG.behaviors.maxSpeed
    : random(1, 3);
  const maxForce = forceControlTouched ? CONFIG.behaviors.maxForce : 0.3;
  const vehicle = new Snake(x, y, maxSpeed, maxForce);
  vehicles.push(vehicle);
  return vehicle;
}

function bindCircuitEditing() {
  canvasElement.addEventListener("contextmenu", (event) => {
    if (!CONFIG.circuit.editMode) return;
    const point = canvasPositionFromEvent(event);
    circuitEditor.removePoint(point.x, point.y);
    event.preventDefault();
  });
  canvasElement.addEventListener("dblclick", (event) => {
    if (!CONFIG.circuit.editMode) return;
    const point = canvasPositionFromEvent(event);
    circuitEditor.addPoint(point.x, point.y);
    event.preventDefault();
  });
}

function canvasPositionFromEvent(event) {
  const bounds = canvasElement.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * width,
    y: ((event.clientY - bounds.top) / bounds.height) * height
  };
}

function configurationChanged(pathName, value) {
  if (pathName === "snake.count") {
    setSnakeCount(value);
  } else if (
    [
      "circuit.shape",
      "circuit.scale",
      "circuit.controlPoints",
      "circuit.irregularity"
    ].includes(pathName)
  ) {
    newPath();
  } else if (pathName === "circuit.radius") {
    path.radius = value;
  } else if (pathName === "behaviors.maxSpeed") {
    speedControlTouched = true;
    for (const vehicle of vehicles) vehicle.maxSpeed = value;
  } else if (pathName === "behaviors.maxForce") {
    forceControlTouched = true;
    for (const vehicle of vehicles) vehicle.maxForce = value;
  } else if (pathName.startsWith("behaviors.")) {
    for (const vehicle of vehicles) {
      vehicle.followPathWeight = CONFIG.behaviors.pathWeight;
      vehicle.separateWeight = CONFIG.behaviors.separationWeight;
      vehicle.wanderWeight = CONFIG.behaviors.wanderWeight;
      vehicle.mouseWeight = CONFIG.behaviors.mouseWeight;
    }
  }
}

function setSnakeCount(count) {
  const targetCount = Math.max(1, Math.min(30, Math.round(count)));
  CONFIG.snake.count = targetCount;
  while (vehicles.length < targetCount) {
    newVehicle(random(width), random(height));
  }
  while (vehicles.length > targetCount) vehicles.pop();
}

function randomizeSnakeAppearance() {
  CONFIG.snake.randomPalette = true;
  CONFIG.snake.hue = random(0, 360);
  for (const vehicle of vehicles) vehicle.randomizeAppearance();
  recreateControlPanel();
}

function randomizeCircuit() {
  CONFIG.circuit.shape = "free";
  newPath();
  recreateControlPanel();
}

function togglePause() {
  CONFIG.general.paused = !CONFIG.general.paused;
}

function resetSimulation() {
  vehicles.length = 0;
  setSnakeCount(CONFIG.snake.count);
  CONFIG.general.paused = false;
}

function resetConfiguration() {
  for (const section of Object.keys(DEFAULT_CONFIG)) {
    Object.assign(
      CONFIG[section],
      JSON.parse(JSON.stringify(DEFAULT_CONFIG[section]))
    );
  }
  speedControlTouched = false;
  forceControlTouched = false;
  newPath();
  setSnakeCount(CONFIG.snake.count);
  for (const vehicle of vehicles) {
    vehicle.maxSpeed = random(1, 3);
    vehicle.maxForce = 0.3;
  }
  configurationChanged("behaviors.reset");
  recreateControlPanel();
}

function applyImportedConfiguration(imported) {
  if (!imported || typeof imported !== "object" || Array.isArray(imported)) {
    throw new Error("Le fichier doit contenir un objet de configuration.");
  }
  const candidate = JSON.parse(JSON.stringify(CONFIG));
  mergeKnownValues(candidate, imported, "CONFIG");
  if (
    !["none", "diamonds", "stripes", "dots"].includes(
      candidate.snake.scaleStyle
    )
  ) {
    throw new Error("Style d'écailles inconnu.");
  }
  if (
    ![
      "circle",
      "ellipse",
      "infinity",
      "star",
      "roundedRect",
      "spiral",
      "free"
    ].includes(candidate.circuit.shape)
  ) {
    throw new Error("Forme de circuit inconnue.");
  }
  if (!["aurora", "ocean", "sunset", "neon"].includes(candidate.background.palette)) {
    throw new Error("Palette de fond inconnue.");
  }

  candidate.snake.count = constrain(Math.round(candidate.snake.count), 1, 30);
  candidate.snake.segments = constrain(
    Math.round(candidate.snake.segments),
    10,
    80
  );
  candidate.circuit.controlPoints = constrain(
    Math.round(candidate.circuit.controlPoints),
    8,
    60
  );
  const limits = {
    "snake.thickness": [4, 40],
    "snake.waveAmplitude": [0, 24],
    "snake.waveFrequency": [0.1, 1.5],
    "snake.waveSpeed": [0, 0.5],
    "snake.headSize": [0.6, 1.8],
    "snake.eyeSize": [0.5, 2],
    "snake.patternIntensity": [0, 1],
    "snake.hue": [0, 359],
    "snake.saturation": [0, 100],
    "snake.brightness": [20, 100],
    "snake.tongueFrequency": [0.2, 8],
    "snake.shadowIntensity": [0, 60],
    "circuit.scale": [0.35, 1.2],
    "circuit.radius": [4, 60],
    "circuit.irregularity": [0, 0.4],
    "circuit.lineWidth": [0.5, 8],
    "behaviors.maxSpeed": [0.2, 10],
    "behaviors.maxForce": [0.01, 1],
    "behaviors.pathWeight": [0, 5],
    "behaviors.separationWeight": [0, 5],
    "behaviors.wanderWeight": [0, 5],
    "behaviors.mouseWeight": [0, 5],
    "behaviors.prediction": [2, 80],
    "background.speed": [0, 0.08],
    "background.noiseScale": [0.005, 0.15],
    "background.saturation": [0, 100],
    "background.brightness": [10, 100]
  };
  for (const [property, [minimum, maximum]] of Object.entries(limits)) {
    const [section, keyName] = property.split(".");
    candidate[section][keyName] = constrain(
      candidate[section][keyName],
      minimum,
      maximum
    );
  }
  if (!/^#[0-9a-f]{6}$/i.test(candidate.snake.color)) {
    throw new Error("La couleur unique doit être un code hexadécimal.");
  }
  Object.assign(CONFIG.general, candidate.general);
  Object.assign(CONFIG.snake, candidate.snake);
  Object.assign(CONFIG.circuit, candidate.circuit);
  Object.assign(CONFIG.behaviors, candidate.behaviors);
  Object.assign(CONFIG.background, candidate.background);
  speedControlTouched = true;
  forceControlTouched = true;
  newPath();
  setSnakeCount(CONFIG.snake.count);
  for (const vehicle of vehicles) {
    vehicle.maxSpeed = CONFIG.behaviors.maxSpeed;
    vehicle.maxForce = CONFIG.behaviors.maxForce;
  }
  configurationChanged("behaviors.import");
  recreateControlPanel();
}

function mergeKnownValues(target, source, prefix) {
  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) continue;
    if (
      value === null ||
      (Array.isArray(value) && !Array.isArray(target[key]))
    ) {
      throw new Error(`Valeur invalide : ${prefix}.${key}`);
    }
    const current = target[key];
    const valuePath = `${prefix}.${key}`;
    if (
      current &&
      typeof current === "object" &&
      !Array.isArray(current) &&
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      mergeKnownValues(current, value, valuePath);
    } else if (typeof value === typeof current) {
      if (typeof value === "number" && !Number.isFinite(value)) {
        throw new Error(`Valeur numérique invalide : ${valuePath}`);
      }
      target[key] = value;
    } else {
      throw new Error(`Type de valeur invalide : ${valuePath}`);
    }
  }
}

function recreateControlPanel() {
  const visible = CONFIG.general.showPanel;
  if (controlPanel) controlPanel.remove();
  controlPanel = new ControlPanel();
  controlPanel.setVisible(visible);
}

function keyPressed() {
  if (key == "d") {
    debug = !debug;
    Vehicle.debug = !debug;
  } else if (key == "s") {
    const vehicle = newVehicle(mouseX, mouseY);
    vehicle.maxspeed = 10;
    vehicle.couleur = "red";
  } else if (key == "w") {
    const vehicle = new Snake(mouseX, mouseY, 2, 0.25);
    vehicle.wanderWeight = 1;
    vehicle.followPathWeight = 0;
    vehicle.separateWeight = 0;
    vehicle.r = 30;
    vehicle.couleur = "lightgreen";
    vehicles.push(vehicle);
  } else if (key == "h" || key == "H") {
    controlPanel.toggle();
  }
}

function mousePressed() {
  if (CONFIG.circuit.editMode && mouseButton === LEFT) {
    circuitEditor.beginDrag(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (circuitEditor.drag(mouseX, mouseY)) return false;
  newVehicle(mouseX, mouseY);
}

function mouseReleased() {
  circuitEditor.endDrag();
}
