let vehicles = [];
let target;
let obstacles = [];
let vehicleCountSlider, vehicleCountValue;
let obstacleCountSlider, obstacleCountValue;
let vehicleSizeSlider, vehicleSizeValue;
let vehicleSpeedSlider, vehicleSpeedValue;
let vehicleForceSlider, vehicleForceValue;
let targetSizeSlider, targetSizeValue;
let scenarioSelect;
let detectionRadiusSlider, detectionRadiusValue;
let enduranceDurationSlider, enduranceDurationValue;
let debugMode = false;

function setup() {
  const scene = document.getElementById('scene');
  createCanvas(scene.clientWidth, scene.clientHeight).parent(scene);
  target = new Target(width / 2, height / 2);
  scenarioSelect = document.getElementById('scenario');
  vehicleCountSlider = document.getElementById('vehicle-count');
  vehicleCountValue = document.getElementById('vehicle-count-value');
  obstacleCountSlider = document.getElementById('obstacle-count');
  obstacleCountValue = document.getElementById('obstacle-count-value');
  vehicleSizeSlider = document.getElementById('vehicle-size');
  vehicleSizeValue = document.getElementById('vehicle-size-value');
  vehicleSpeedSlider = document.getElementById('vehicle-speed');
  vehicleSpeedValue = document.getElementById('vehicle-speed-value');
  vehicleForceSlider = document.getElementById('vehicle-force');
  vehicleForceValue = document.getElementById('vehicle-force-value');
  targetSizeSlider = document.getElementById('target-size');
  targetSizeValue = document.getElementById('target-size-value');
  detectionRadiusSlider = document.getElementById('detection-radius');
  detectionRadiusValue = document.getElementById('detection-radius-value');
  enduranceDurationSlider = document.getElementById('endurance-duration');
  enduranceDurationValue = document.getElementById('endurance-duration-value');

  scenarioSelect.addEventListener('change', switchScenario);
  vehicleCountSlider.addEventListener('input', synchronizePopulation);
  obstacleCountSlider.addEventListener('input', synchronizeObstacles);
  synchronizePopulation();
  synchronizeObstacles();
  bindParameter(vehicleSizeSlider, vehicleSizeValue, value => {
    vehicles.forEach(vehicle => vehicle.r = value);
  });
  bindParameter(vehicleSpeedSlider, vehicleSpeedValue, value => {
    vehicles.forEach(vehicle => vehicle.maxSpeed = value);
  });
  bindParameter(vehicleForceSlider, vehicleForceValue, value => {
    vehicles.forEach(vehicle => vehicle.maxForce = value);
  });
  bindParameter(targetSizeSlider, targetSizeValue, value => target.r = value);
  bindParameter(detectionRadiusSlider, detectionRadiusValue, value => {
    if (target instanceof TargetFuyante) target.detectionRadius = value;
  }, value => `${value} px`);
  bindParameter(enduranceDurationSlider, enduranceDurationValue, value => {
    if (target instanceof TargetFuyante) {
      target.enduranceDurationMs = value;
      target.staminaRemainingMs = Math.min(target.staminaRemainingMs, value);
    }
  }, value => `${(value / 1000).toFixed(1)} s`);
  switchScenario();
}

function draw() {
  drawBackground();

  if (target instanceof TargetFuyante) {
    target.updateTarget(vehicles, millis(), obstacles);
    target.debugMode = debugMode;
  } else {
    target.update(obstacles);
  }

  obstacles.forEach(obstacle => obstacle.show());
  let targetRespawned = false;
  vehicles.forEach(vehicle => {
    vehicle.r = Number(vehicleSizeSlider.value);
    vehicle.maxSpeed = Number(vehicleSpeedSlider.value);
    vehicle.maxForce = Number(vehicleForceSlider.value);
    if (scenarioSelect.value === 'factuel' && !targetRespawned
        && SeekPopulation.hasTouched(vehicle, target)) {
      target.respawn(width, height);
      targetRespawned = true;
    }
    const avoidance = obstacleAvoidanceForce(vehicle, obstacles);
    vehicle.applyForce(avoidance.mag() > 0 ? avoidance : vehicle.seek(target.pos));
    vehicle.update();
    vehicle.edges();

    if (scenarioSelect.value === 'factuel' && !targetRespawned
        && SeekPopulation.hasTouched(vehicle, target)) {
      target.respawn(width, height);
      targetRespawned = true;
    }
    vehicle.show();
  });
  target.show();
}

function drawBackground() {
  push();
  const hue = (frameCount * 0.08) % 360;
  const gradient = drawingContext.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${hue}, 78%, 53%)`);
  gradient.addColorStop(0.5, `hsl(${(hue + 125) % 360}, 76%, 48%)`);
  gradient.addColorStop(1, `hsl(${(hue + 245) % 360}, 80%, 52%)`);
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
  pop();
}

function bindParameter(slider, output, update, format = value => String(value)) {
  const synchronize = () => {
    const value = Number(slider.value);
    output.value = slider.id === 'vehicle-force' ? value.toFixed(2) : format(value);
    update(value);
  };
  slider.addEventListener('input', synchronize);
  synchronize();
}

function switchScenario() {
  const isFleeing = scenarioSelect.value === 'fuyante';
  target = isFleeing
    ? new TargetFuyante(random(width), random(height))
    : new Target(random(width), random(height));
  target.r = Number(targetSizeSlider.value);
  if (isFleeing) {
    target.detectionRadius = Number(detectionRadiusSlider.value);
    target.enduranceDurationMs = Number(enduranceDurationSlider.value);
    target.staminaRemainingMs = target.enduranceDurationMs;
    target.debugMode = debugMode;
  }
  document.querySelectorAll('.scenario-escape-only').forEach(control => {
    control.hidden = !isFleeing;
  });
  synchronizePopulation();
  synchronizeObstacles();
}

function synchronizeObstacles() {
  obstacles = createRandomObstacles(
    Number(obstacleCountSlider.value),
    width,
    height,
    target
  );
  obstacleCountValue.value = String(obstacles.length);
}

function synchronizePopulation() {
  SeekPopulation.resize(
    vehicles,
    Number(vehicleCountSlider.value),
    target,
    width,
    height,
    (x, y) => new Vehicle(x, y)
  );
  vehicleCountValue.value = `${vehicles.length} / ${SeekPopulation.MAX_COUNT}`;
}

function keyPressed() {
  if (key.toLowerCase() === 'd') debugMode = !debugMode;
}

function windowResized() {
  const scene = document.getElementById('scene');
  resizeCanvas(scene.clientWidth, scene.clientHeight);
  synchronizeObstacles();
}