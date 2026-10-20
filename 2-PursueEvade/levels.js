const LEVELS = [
  {
    nom: "Le Poulailler",
    poules: 6,
    henSpeedMult: 0.8,
    budgetObstacles: null,
    obstacles: [],
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 5 }
  },
  {
    nom: "Les Rochers",
    poules: 10,
    henSpeedMult: 0.9,
    budgetObstacles: 5,
    obstacles: [
      { x: 0.22, y: 0.28, r: 48 },
      { x: 0.38, y: 0.72, r: 54 },
      { x: 0.52, y: 0.28, r: 48 },
      { x: 0.67, y: 0.72, r: 54 },
      { x: 0.82, y: 0.28, r: 48 }
    ],
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 8, temps: 60 }
  },
  {
    nom: "Le Troupeau",
    poules: 12,
    henSpeedMult: 0.95,
    budgetObstacles: 4,
    obstacles: [],
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 10, temps: 90 },
    groupeSerre: true
  },
  {
    nom: "Le Passage",
    poules: 12,
    henSpeedMult: 1,
    budgetObstacles: null,
    obstacles: [],
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 10 }
  },
  {
    nom: "La Mare",
    poules: 10,
    henSpeedMult: 1,
    budgetObstacles: null,
    obstacles: [],
    zones: [
      { type: "mare", x: 0.43, y: 0.5, r: 0.14 },
      { type: "mare", x: 0.57, y: 0.5, r: 0.14 }
    ],
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 10, temps: 80 }
  },
  {
    nom: "L'Aigle",
    poules: 10,
    henSpeedMult: 1,
    budgetObstacles: null,
    obstacles: [],
    zones: [
      { type: "buisson", x: 0.24, y: 0.3, r: 0.075 },
      { type: "buisson", x: 0.76, y: 0.7, r: 0.075 }
    ],
    leurres: ["seed", "fakeSnake", "mouse"],
    aigle: true,
    energie: true,
    objectif: { type: "survivre", temps: 90, minManger: 6 }
  },
  {
    nom: "Le Berger",
    poules: 10,
    henSpeedMult: 0.9,
    budgetObstacles: null,
    obstacles: [],
    enclos: { x: 0.68, y: 0.28, w: 0.27, h: 0.44, ouverture: "left" },
    leurres: ["fakeSnake"],
    maxDecoys: 2,
    objectif: { type: "enclos", cible: 8, temps: 120 }
  },
  {
    nom: "La Nuit",
    poules: 12,
    henSpeedMult: 1,
    budgetObstacles: 5,
    obstacles: [],
    leurres: ["seed", "fakeSnake", "mouse"],
    nuit: true,
    objectif: { type: "manger", cible: 10, temps: 100 }
  },
  {
    nom: "La Tempête",
    poules: 12,
    henSpeedMult: 1.05,
    budgetObstacles: 4,
    obstacles: [],
    boulders: 4,
    energie: true,
    leurres: ["seed", "fakeSnake", "mouse"],
    objectif: { type: "manger", cible: 12, temps: 110 }
  },
  {
    nom: "La Reine",
    poules: 6,
    henSpeedMult: 1,
    budgetObstacles: null,
    obstacles: [],
    reine: true,
    gardes: 6,
    leurres: ["fakeSnake", "seed"],
    maxDecoys: 5,
    energie: true,
    perteEnergie: 1.25,
    objectif: { type: "reine", temps: 120 }
  }
];
