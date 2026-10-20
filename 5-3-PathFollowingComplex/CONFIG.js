// Configuration unique : les contrôles DOM modifient directement cet objet.
const CONFIG = {
  general: {
    paused: false,
    showFps: true,
    showPanel: true
  },
  snake: {
    count: 1,
    segments: 34,
    thickness: 15,
    waveAmplitude: 8,
    waveFrequency: 0.58,
    waveSpeed: 0.12,
    headSize: 1.05,
    eyeSize: 1,
    scaleStyle: "diamonds",
    patternIntensity: 0.68,
    randomPalette: true,
    hue: 180,
    saturation: 76,
    brightness: 84,
    color: "#23b8b0",
    tongueVisible: true,
    tongueFrequency: 2.4,
    shadowVisible: true,
    shadowIntensity: 18
  },
  circuit: {
    shape: "free",
    scale: 0.7333333333,
    radius: 20,
    controlPoints: 30,
    irregularity: 0.0909090909,
    visible: true,
    color: "#000000",
    roadColor: "#afafaf",
    lineWidth: 1,
    editMode: false
  },
  behaviors: {
    maxSpeed: 2,
    maxForce: 0.3,
    pathWeight: 2,
    separationWeight: 1.2,
    wanderWeight: 0,
    mouseWeight: 0,
    prediction: 25,
    wanderEnabled: true,
    separationEnabled: true,
    mouseEnabled: false
  },
  background: {
    visible: true,
    speed: 0.012,
    noiseScale: 0.045,
    saturation: 65,
    brightness: 52,
    palette: "aurora"
  }
};

const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));
