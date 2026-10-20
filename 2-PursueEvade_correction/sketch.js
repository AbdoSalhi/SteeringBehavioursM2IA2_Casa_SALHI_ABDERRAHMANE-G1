let pursuer;
let targets = [];
let closestTarget;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Poursuiveur
  pursuer = new Vehicle(random(width), random(height));
  pursuer.maxSpeed = 10;
  pursuer.maxForce = 0.4;
  pursuer.vel = createVector(2, 4);

  // Création de plusieurs cibles (BouncingBalls)
  let nbTargets = 10;
  for (let i = 0; i < nbTargets; i++) {
    let t = new BouncingBall(random(width), random(height));
    t.maxSpeed = 4;
    t.maxForce = 0.2;
    // Définition d'un rayon de vision pour l'exercice 2
    t.rayonDetection = 150; 
    targets.push(t);
  }
}

function draw() {
  background(0);

  // Trouver la cible la plus proche pour le poursuiveur
  closestTarget = cibleLaPlusProche(pursuer, targets);

  if (closestTarget) {
    // Le poursuiveur poursuit la cible la plus proche
    let force = pursuer.pursue(closestTarget);
    pursuer.applyForce(force);
  }

  // Déplacement et dessin du véhicule poursuiveur
  pursuer.update();
  pursuer.edges();
  pursuer.show();

  // On parcourt toutes les cibles du tableau
  for (let i = targets.length - 1; i >= 0; i--) {
    let t = targets[i];
    
    // Rebond sur les bords de l'écran pour la balle
    t.edges();

    // Gestion du champ de vision et de l'évitement (evade)
    let d = p5.Vector.dist(pursuer.pos, t.pos);
    
    // Optionnel : dessiner le cercle de vision autour de la cible
    noFill();
    stroke(100, 100, 255, 50);
    ellipse(t.pos.x, t.pos.y, t.rayonDetection * 2);

    if (d < t.rayonDetection) {
      // La cible fuit en mode "evade" si le poursuiveur entre dans son champ de vision
      t.maxSpeed = 8;
      t.maxForce = 0.5;
      let evadeForce = t.evade(pursuer);
      t.applyForce(evadeForce);

      // Si le poursuiveur touche la cible
      if (d < pursuer.r + t.r) {
        console.log("Cible touchée !");
        // On supprime la cible du tableau
        targets.splice(i, 1);
        continue; // Passe à la cible suivante
      }
    } else {
      // Comportement normal si le poursuiveur est loin
      t.maxSpeed = 3;
      t.maxForce = 0.2;
    }

    t.update();
    t.show();
  }
}

// Fonction pour trouver la cible la plus proche
function cibleLaPlusProche(vehicle, targetsList) {
  let cibleProche = null;
  let distanceMin = Infinity;

  targetsList.forEach(t => {
    let d = p5.Vector.dist(vehicle.pos, t.pos);
    if (d < distanceMin) {
      distanceMin = d;
      cibleProche = t;
    }
  });

  return cibleProche;
}