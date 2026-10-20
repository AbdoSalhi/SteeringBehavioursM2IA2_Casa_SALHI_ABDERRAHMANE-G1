const SPECIES_CONFIG = [
  {
    name: "Prudent",
    color: [70, 220, 255],
    nbRays: 5,
    fov: 60,
    hidden: 6,
    maxspeed: 4,
    maxforce: 0.3,
    mutationRate: 0.1
  },
  {
    name: "Équilibré",
    color: [255, 70, 230],
    nbRays: 9,
    fov: 90,
    hidden: 18,
    maxspeed: 5,
    maxforce: 0.2,
    mutationRate: 0.1
  },
  {
    name: "Explorateur",
    color: [255, 190, 65],
    nbRays: 13,
    fov: 140,
    hidden: 26,
    maxspeed: 5,
    maxforce: 0.2,
    mutationRate: 0.15
  },
  {
    name: "Rapide",
    color: [150, 255, 115],
    nbRays: 7,
    fov: 70,
    hidden: 14,
    maxspeed: 7,
    maxforce: 0.25,
    mutationRate: 0.1
  }
];

const TOTAL = 100;
const LIFESPAN = 220;
const SIGHT = 120;
const DASHBOARD_WIDTH = 320;
const WINNER_BANNER_DURATION = 4500;

const TRACK_LEVELS = {
  Facile: { pathWidth: 90, noiseMax: 2.6 },
  Moyen: { pathWidth: 70, noiseMax: 4.4 },
  Piège: { pathWidth: 42, noiseMax: 7.5 }
};

let trackSeed = 42;
let currentLevel = "Moyen";
let track = null;
let speciesStates = [];
let steeringCar = null;
let trafficCars = [];
let circuitNumber = 1;
let circuitHistory = [];
let dashboard = null;
let currentWinner = null;
let keepBrainsCheckbox = null;
let difficultySelect = null;
let trafficCheckbox = null;
let newCircuitButton = null;
let relaunchButton = null;
let benchmarkButton = null;
let exportButton = null;
let winnerBanner = "";
let winnerBannerUntil = 0;
