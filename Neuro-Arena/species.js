class SpeciesState {
  constructor(config, index) {
    this.config = config;
    this.name = config.name;
    this.color = config.color;
    this.index = index;
    this.population = [];
    this.savedVehicles = [];
    this.populationSize = 0;
    this.generation = 1;
    this.bestCheckpoints = 0;
    this.avgCheckpoints = 0;
    this.firstLapGen = null;
    this.bestHistory = [];
    this.bestBrain = null;
  }

  initPopulation() {
    this.populationSize = Math.floor(TOTAL / SPECIES_CONFIG.length) + (this.index < TOTAL % SPECIES_CONFIG.length ? 1 : 0);
    this.population = [];
    this.savedVehicles = [];
    this.bestCheckpoints = 0;
    this.avgCheckpoints = 0;
    this.firstLapGen = null;
    this.bestHistory = [];
    this.generation = 1;

    const startPoint = track ? track.start.copy() : createVector(width * 0.5, height * 0.5);
    for (let i = 0; i < this.populationSize; i++) {
      const vehicle = new Vehicle(null, this.config, startPoint.copy());
      this.population.push(vehicle);
    }
  }
}

function createSpeciesStates() {
  speciesStates = SPECIES_CONFIG.map((config, index) => new SpeciesState(config, index));
  speciesStates.forEach((species) => species.initPopulation());
}

function getChampion(species) {
  const pool = species.population.concat(species.savedVehicles);
  if (pool.length === 0) {
    return null;
  }
  return pool.reduce((best, current) => {
    if (!best || current.score > best.score) {
      return current;
    }
    return best;
  }, null);
}

function compareSpecies(a, b) {
  if (a.bestCheckpoints !== b.bestCheckpoints) {
    return b.bestCheckpoints - a.bestCheckpoints;
  }
  if ((a.firstLapGen ?? Infinity) !== (b.firstLapGen ?? Infinity)) {
    return (a.firstLapGen ?? Infinity) - (b.firstLapGen ?? Infinity);
  }
  return b.avgCheckpoints - a.avgCheckpoints;
}
