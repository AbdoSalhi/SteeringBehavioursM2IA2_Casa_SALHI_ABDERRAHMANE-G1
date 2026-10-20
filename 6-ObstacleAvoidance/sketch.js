const THEME_COLORS = {
  background: [43, 32, 40],
  catFur: "#d9b88f",
  catMarkings: "#735b4b",
  catMuzzle: "#fff0d7",
  catEyes: "#342b31",
  mouseFur: "#f5eadc",
  mouseEars: "#d98291",
  yarn: "#bd748b",
  yarnStrand: "#f1bdc4"
};

let pursuer1, pursuer2;
let target;
let obstacles = [];
let vehicules = [];
let predators = [];
let captures = 0;

const PREY_VISION_RADIUS = 180;
const PREY_VISION_ANGLE = Math.PI * 2 / 3;

function createPredator(x, y) {
  let predator = new Predator(x, y);
  predator.maxSpeed = 5.5;
  predator.r_pourDessin = 24;
  predator.r = predator.r_pourDessin * 3;
  predator.largeurZoneEvitementDevantVaisseau = predator.r / 2;
  return predator;
}

function preyCanSeePredator(prey, predator) {
  const directionToPredator = p5.Vector.sub(predator.pos, prey.pos);
  if (directionToPredator.mag() > PREY_VISION_RADIUS) {
    return false;
  }

  if (prey.vel.magSq() === 0) {
    return true;
  }

  let angle = directionToPredator.heading() - prey.vel.heading();
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  return Math.abs(angle) <= PREY_VISION_ANGLE / 2;
}

function applyPreyBehaviors(prey) {
  prey.applyBehaviors(target, obstacles, vehicules);
  predators.forEach(predator => {
    if (preyCanSeePredator(prey, predator)) {
      prey.applyForce(prey.evade(predator));
    }
  });
}

function handleCaptures() {
  predators.forEach(predator => {
    for (let i = vehicules.length - 1; i >= 0; i--) {
      const prey = vehicules[i];
      const distance = predator.pos.dist(prey.pos);
      if (distance < predator.r_pourDessin + prey.r_pourDessin) {
        vehicules.splice(i, 1);

        let nouvelleProie = new Vehicle(random(width), random(height));
        nouvelleProie.vel = p5.Vector.random2D();
        vehicules.push(nouvelleProie);
        captures++;
      }
    }
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pursuer1 = new Vehicle(100, 100);
  pursuer2 = new Vehicle(random(width), random(height));

  vehicules.push(pursuer1);
  //vehicules.push(pursuer2);

  // On cree un obstace au milieu de l'écran
  // un cercle de rayon 100px
  // TODO
  obstacles.push(new Obstacle(width / 2, height / 2, 100, "green"));
}

function draw() {
  // changer le dernier param (< 100) pour effets de trainée
  background(
    THEME_COLORS.background[0],
    THEME_COLORS.background[1],
    THEME_COLORS.background[2],
    100
  );

  target = createVector(mouseX, mouseY);

  // Dessin de la souris cible à la position de la souris
  push();
  translate(target.x, target.y);
  noStroke();
  fill(THEME_COLORS.mouseFur);
  ellipse(0, 2, 20, 13);
  ellipse(7, -4, 13, 13);
  fill(THEME_COLORS.mouseEars);
  ellipse(3, -11, 7, 9);
  ellipse(10, -10, 7, 9);
  fill(THEME_COLORS.mouseFur);
  ellipse(3, -11, 3, 5);
  ellipse(10, -10, 3, 5);
  fill(THEME_COLORS.catEyes);
  ellipse(10, -5, 2, 2);
  ellipse(14, -2, 3, 2);
  noFill();
  stroke(THEME_COLORS.mouseFur);
  strokeWeight(2);
  bezier(-8, 3, -17, -2, -19, 10, -12, 10);
  strokeWeight(1);
  line(12, -1, 20, -5);
  line(12, 0, 21, 0);
  line(12, 1, 20, 4);
  pop();

  // dessin des obstacles
  // TODO
  obstacles.forEach(o => {
    o.show();
  })

  vehicules.forEach(v => {
    // pursuer = le véhicule poursuiveur, il vise un point devant la cible
    applyPreyBehaviors(v);

    // déplacement et dessin du véhicule et de la target
    v.update();
    v.show();
  });

  predators.forEach(p => {
    p.applyBehaviors(target, obstacles, vehicules);
    p.update();
    p.show();
  });

  handleCaptures();

  push();
  noStroke();
  fill(255);
  textSize(18);
  text("Proies : " + vehicules.length + " | Captures : " + captures, 20, 30);
  pop();
}

function mousePressed() {
  // TODO : ajouter un obstacle de taille aléatoire à la position de la souris
  obstacles.push(new Obstacle(mouseX, mouseY, random(20, 100), "green"));
}

function keyPressed() {
  if (key == "v") {
    vehicules.push(new Vehicle(random(width), random(height)));
  }
  if (key == "p") {
    predators.push(createPredator(random(width), random(height)));
  }
  if (key == "d") {
    Vehicle.debug = !Vehicle.debug;
  } else if (key == "f") {
    // on crée 10 véhicules à des position random espacées de 50px
    // en x = 20, y = hauteur du  canvas sur deux
    for (let i = 0; i < 10; i++) {
      let v = new Vehicle(20, 300 )
      // vitesse aléatoire
      v.vel = new p5.Vector(random(1, 5), random(1, 5));
      vehicules.push(v);
    }
  }
}