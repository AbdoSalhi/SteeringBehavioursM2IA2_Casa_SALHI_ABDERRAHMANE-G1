class Dashboard {
  constructor() {
    this.container = createDiv();
    this.container.class("panel");
    this.container.id("dashboard");
    this.render();
  }

  render() {
    if (!this.container) {
      return;
    }

    const ranking = speciesStates.slice().sort(compareSpecies).map((species, index) => {
      const champion = getChampion(species);
      const score = champion ? champion.score : 0;
      const average = species.avgCheckpoints || 0;
      return `
        <div class="legend"><span class="badge" style="background: rgb(${species.color.join(",")})"></span>${index + 1}. ${species.name} · best ${score} · avg ${average}</div>
      `;
    }).join("");

    const rows = speciesStates.map((species) => {
      const living = species.population.filter((vehicle) => !vehicle.dead).length;
      return `
        <div class="stat">
          <span>${species.name}</span>
          <span>${living}/${species.populationSize}</span>
        </div>
      `;
    }).join("");

    const history = circuitHistory.slice(-6).map((entry) => {
      return `<li>${entry.circuitNumber} → ${entry.winnerName} (${entry.score})</li>`;
    }).join("");

    const bestSpecies = currentWinner ? currentWinner.name : "—";
    const bestScore = Math.max(
      ...speciesStates.map((species) => {
        const champion = getChampion(species);
        return champion ? champion.score : 0;
      }),
      0
    );

    this.container.html(`
      <h1>Neuro-Arena : circuit ${circuitNumber}, ${currentLevel}, graine ${trackSeed}</h1>
      <div class="stat"><span>Génération</span><span>${speciesStates[0] ? speciesStates[0].generation : 0}</span></div>
      <h2>Classement</h2>
      ${ranking}
      <h2>Véhicules vivantes</h2>
      ${rows}
      <h2>Historique</h2>
      <ul class="list">${history || '<li>Aucun circuit : pas encore de résultat.</li>'}</ul>
      <h2>Résultat</h2>
      <div class="stat"><span>Meilleur score</span><span>${bestScore}</span></div>
      <div class="stat"><span>Meilleur cerveau</span><span>${bestSpecies}</span></div>
    `);
  }
}
