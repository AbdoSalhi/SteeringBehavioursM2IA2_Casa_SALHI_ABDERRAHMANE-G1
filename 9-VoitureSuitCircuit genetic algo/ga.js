// Fonctions génétiques appliquées séparément à chaque espèce.
function nextGeneration(species) {
  calculateFitnessForAllCars(species);

  species.avgCheckpoints = species.savedVehicles.reduce(
    (total, vehicle) => total + vehicle.checkpointsPassed,
    0
  ) / species.savedVehicles.length;

  const nextPopulation = [];
  for (let i = 0; i < species.populationSize; i++) {
    nextPopulation.push(pickOne(species));
  }

  species.savedVehicles.forEach(vehicle => vehicle.dispose());
  species.savedVehicles = [];
  species.population = nextPopulation;
  species.generations++;
}

// Tire un parent dans la roulette pondérée de cette espèce uniquement.
function pickOne(species) {
  let r = random(1);
  let index = species.savedVehicles.length - 1;
  let cumulativeFitness = 0;
  for (let i = 0; i < species.savedVehicles.length; i++) {
    cumulativeFitness += species.savedVehicles[i].fitness;
    if (r < cumulativeFitness) {
      index = i;
      break;
    }
  }

  const parent = species.savedVehicles[index];
  const child = new Vehicle(parent.brain, species.config);
  child.mutate();
  return child;
}

// Normalise les poids à partir des checkpoints bruts, sans débordement numérique.
function calculateFitnessForAllCars(species) {
  let maximum = 0;
  species.savedVehicles.forEach(vehicle => {
    vehicle.calculateFitness();
    maximum = Math.max(maximum, vehicle.checkpointsPassed);
  });

  const weights = species.savedVehicles.map(vehicle =>
    Math.pow(2, vehicle.checkpointsPassed - maximum)
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  species.savedVehicles.forEach((vehicle, index) => {
    vehicle.fitness = weights[index] / total;
  });
}
