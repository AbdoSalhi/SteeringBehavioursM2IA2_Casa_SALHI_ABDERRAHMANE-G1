function calculateFitnessForAllCars(species) {
  if (!species.savedVehicles || species.savedVehicles.length === 0) {
    return;
  }

  species.savedVehicles.forEach((vehicle) => vehicle.calculateFitness());
  const total = species.savedVehicles.reduce((sum, vehicle) => sum + vehicle.fitness, 0);
  if (total <= 0) {
    species.savedVehicles.forEach((vehicle) => {
      vehicle.fitness = 1;
    });
    return;
  }

  species.savedVehicles.forEach((vehicle) => {
    vehicle.fitness = vehicle.fitness / total;
  });
}

function pickOne(species) {
  if (!species.savedVehicles || species.savedVehicles.length === 0) {
    return new Vehicle(null, species.config, track.start.copy());
  }

  let threshold = random(1);
  let cumulative = 0;
  let index = 0;

  for (let i = 0; i < species.savedVehicles.length; i++) {
    cumulative += species.savedVehicles[i].fitness;
    if (threshold <= cumulative) {
      index = i;
      break;
    }
  }

  const parent = species.savedVehicles[index];
  const child = new Vehicle(parent.brain, species.config, track.start.copy());
  child.mutate();
  return child;
}

function nextGeneration(species) {
  if (!species.savedVehicles || species.savedVehicles.length === 0) {
    return;
  }

  calculateFitnessForAllCars(species);
  species.avgCheckpoints = species.savedVehicles.reduce((sum, vehicle) => sum + vehicle.score, 0) / species.savedVehicles.length;
  species.bestCheckpoints = Math.max(species.bestCheckpoints, ...species.savedVehicles.map((vehicle) => vehicle.score));

  const nextPopulation = [];
  for (let i = 0; i < species.populationSize; i++) {
    nextPopulation.push(pickOne(species));
  }

  species.savedVehicles.forEach((vehicle) => vehicle.dispose());
  species.savedVehicles = [];
  species.population = nextPopulation;
  species.generation++;
  species.bestHistory.push(species.bestCheckpoints);

  if (species.firstLapGen === null) {
    const winner = getChampion(species);
    if (winner && winner.lapsCompleted > 0) {
      species.firstLapGen = species.generation;
    }
  }
}
