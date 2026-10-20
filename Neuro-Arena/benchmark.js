function runBenchmark() {
  const circuits = [
    { difficulty: "Facile", seed: 100 },
    { difficulty: "Facile", seed: 101 },
    { difficulty: "Facile", seed: 102 },
    { difficulty: "Moyen", seed: 200 },
    { difficulty: "Moyen", seed: 201 },
    { difficulty: "Moyen", seed: 202 },
    { difficulty: "Moyen", seed: 203 },
    { difficulty: "Piège", seed: 300 },
    { difficulty: "Piège", seed: 301 },
    { difficulty: "Piège", seed: 302 }
  ];

  const matrix = [];
  for (let i = 0; i < SPECIES_CONFIG.length; i++) {
    matrix.push(new Array(circuits.length).fill(0));
  }

  circuits.forEach((circuitInfo, circuitIndex) => {
    buildTrack(circuitInfo.difficulty, circuitInfo.seed);
    createSpeciesStates();
    speciesStates.forEach((species) => {
      species.generation = 1;
    });

    for (let generation = 0; generation < 15; generation++) {
      speciesStates.forEach((species) => {
        const survivors = [];
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
          survivors.push(vehicle);
          if (vehicle.score > species.bestCheckpoints) {
            species.bestCheckpoints = vehicle.score;
          }
        }
        species.population = survivors;
        if (survivors.length === 0) {
          nextGeneration(species);
        }
      });
    }

    speciesStates.forEach((species, speciesIndex) => {
      const champion = getChampion(species);
      matrix[speciesIndex][circuitIndex] = champion ? champion.score : 0;
    });
  });

  console.log("Benchmark exécuté", matrix);
  return matrix;
}
