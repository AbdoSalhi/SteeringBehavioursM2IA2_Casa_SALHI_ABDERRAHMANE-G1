class Vehicle {
  constructor(x, y) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 10;
    // force maximale appliquée au véhicule
    this.maxForce = 0.25;
    // rayon du véhicule
    this.r = 16;
  }

  /*
    seek est une méthode qui permet de faire se rapprocher le véhicule de la cible passée en paramètre
   */
  seek(target) {
    // on calcule la direction vers la cible
    let force = p5.Vector.sub(target, this.pos);

    // on limite ce vecteur à la longueur maxSpeed
    force.setMag(this.maxSpeed);
    // on calcule la force à atteindre la cible
    force.sub(this.vel);
    // on limite cette force à la longueur maxForce
    force.limit(this.maxForce);
    // on applique la force au véhicule
    return force;
  }

  // inverse de seek !
  flee(target, distanceDeDetection = Infinity) {
    // Gère si target est un vecteur direct ou un objet avec .pos
    let targetPos = target instanceof p5.Vector ? target : target.pos;
    return this.seek(targetPos, distanceDeDetection).mult(-1);
  }

  /* Poursuite d'un point devant la target !
     cette methode renvoie la force à appliquer au véhicule
  */
  pursue(target) {
    // On dessine le vecteur vitesse de la target
    this.drawVector(target.pos, target.vel.copy().mult(10));

    // 1 - calcul de la position future de la cible (copie de la vitesse)
    let targetAhead = target.vel.copy();

    // 2 - prediction dans 20 frames (on multiplie le vecteur vitesse par 20)
    targetAhead.mult(20);

    // 3 - on positionne la target au bout de ce vecteur (ajout à la position)
    targetAhead.add(target.pos);

    // 4 - dessin du point devant la target
    fill("green");
    noStroke();
    circle(targetAhead.x, targetAhead.y, 16);

    // 5 - appel à seek avec ce point comme cible 
    let force = this.seek(targetAhead);

    // on renvoie la force à appliquer au véhicule
    return force;
  }

  /* inverse de pursue (évitement anticipé)
     cette methode renvoie la force à appliquer au véhicule
  */
  evade(target) {
    // On calcule la position future de la cible de la même manière
    let targetAhead = target.vel.copy();
    targetAhead.mult(20);
    targetAhead.add(target.pos);

    // Dessin du point d'évitement en rouge pour la distinction
    fill("red");
    noStroke();
    circle(targetAhead.x, targetAhead.y, 16);

    // On fuit (flee) cette position future au lieu de la poursuivre
    let force = this.seek(targetAhead);
    force.mult(-1);
    
    return force;
  }

  /** Fonction de poursuite parfaite (avec le point devant la target) */
  pursuePerfect(vehicle) {
    const speed_ratio = vehicle.vel.mag() / this.maxSpeed;
    const target_angle = vehicle.vel.angleBetween(p5.Vector.sub(this.pos, vehicle.pos));
    const my_angle = asin(sin(target_angle) * speed_ratio);
    const dist = this.pos.dist(vehicle.pos);
    const prediction = dist * sin(my_angle) / sin(PI - my_angle - target_angle);
    const target = vehicle.vel.copy().setMag(prediction).add(vehicle.pos);
    
    drawArrow(vehicle.pos, p5.Vector.mult(vehicle.vel, 20), 'red');
    drawArrow(this.pos, p5.Vector.sub(target, this.pos), 'green');
    
    fill(0, 255, 0);
    circle(target.x, target.y, 8);
    return this.seek(target);
  }

  // applyForce additionne la force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  // On dessine le véhicule
  show() {
    stroke(255);
    strokeWeight(2);
    fill(255);

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    // Dessin d'un véhicule sous la forme d'un triangle
    triangle(-this.r, -this.r / 2, -this.r, this.r / 2, this.r, 0);
    pop();
    
    this.drawVector(this.pos, this.vel.copy().mult(10));
  }

  drawVector(pos, v) {
    push();
    strokeWeight(3);
    stroke("red");
    line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
    let arrowSize = 5;
    translate(pos.x + v.x , pos.y + v.y);
    rotate(v.heading());
    translate(-arrowSize / 2, 0);
    triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    pop();
  }

  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

// Fonction utilitaire pour dessiner une flèche
function drawArrow(base, vec, myColor) {
  push();
  stroke(myColor);
  strokeWeight(3);
  fill(myColor);
  translate(base.x, base.y);
  line(0, 0, vec.x, vec.y);
  rotate(vec.heading());
  let arrowSize = 7;
  translate(vec.mag() - arrowSize, 0);
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}