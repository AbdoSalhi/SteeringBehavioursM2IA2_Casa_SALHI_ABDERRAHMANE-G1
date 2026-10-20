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
    this.wanderTheta = 0;
    this.avoidWeight = 4;
    this.avoidLookAhead = 100;
    this._avoidAhead = createVector(0, 0);
    this._avoidAhead2 = createVector(0, 0);
    this._wanderCenter = createVector(0, 0);
    this._wanderTarget = createVector(0, 0);
    this._stuckAvoidDirection = null;
    this.zoneSpeedMultiplier = 1;
    this.hidden = false;
    this._speedFactorBase = this.maxSpeed;
    this._speedFactorApplied = null;
  }

  // Applique les modificateurs des zones sans cumuler le ralentissement d'une frame à l'autre.
  speedFactor(zones = [], baseSpeed = null) {
    const vitesseDeBase = Number.isFinite(baseSpeed)
      ? baseSpeed
      : this._speedFactorApplied !== null &&
        Math.abs(this.maxSpeed - this._speedFactorApplied) <= 1e-9
        ? this._speedFactorBase
        : this.maxSpeed;
    let dansUneMare = false;
    this.hidden = false;

    for (const zone of zones) {
      if (!zone.contains(this.pos)) {
        continue;
      }
      if (zone.type === "mare") {
        dansUneMare = true;
      } else if (zone.type === "buisson") {
        this.hidden = true;
      }
    }

    const facteur = dansUneMare ? this.zoneSpeedMultiplier : 1;
    this._speedFactorBase = vitesseDeBase;
    this.maxSpeed = vitesseDeBase * facteur;
    this._speedFactorApplied = this.maxSpeed;
    return facteur;
  }

  /*
    seek est une méthode qui permet de faire se rapprocher le véhicule de la cible passée en paramètre
   */
  seek(target) {
    // on calcule la direction vers la cible
    let force = p5.Vector.sub(target, this.pos);

    // on limite ce vecteur à la longueur maxSpeed
    if (force.x * force.x + force.y * force.y > 1e-12) {
      force.setMag(this.maxSpeed);
    }
    // on calcule la force à atteindre la cible
    force.sub(this.vel);
    // on limite cette force à la longueur maxForce
    force.limit(this.maxForce);
    // on applique la force au véhicule
    return force;
  }

  // Arrivée : ralentit progressivement à l'approche de la cible.
  arrive(targetPos, rayonRalentissement = 100) {
    const desired = p5.Vector.sub(targetPos, this.pos);
    const distance = desired.mag();
    if (distance <= 1e-6) {
      return createVector(0, 0);
    }

    const vitesseDesiree = distance < rayonRalentissement
      ? map(distance, 0, rayonRalentissement, 0, this.maxSpeed)
      : this.maxSpeed;
    desired.setMag(vitesseDesiree);
    const steering = desired.sub(this.vel);
    steering.limit(this.maxForce);
    return steering;
  }

  // Évitement local : sélectionne l'obstacle le plus proche du corridor prédit.
  avoid(obstacles) {
    const vitesseSq = this.vel.x * this.vel.x + this.vel.y * this.vel.y;
    const vitesse = Math.sqrt(vitesseSq);
    const ratioVitesse = this.maxSpeed > 0
      ? Math.min(1, vitesse / this.maxSpeed)
      : 0;
    const longueurVue = Math.max(40, ratioVitesse * this.avoidLookAhead);
    const facteurDirection = vitesse > 1e-6 ? longueurVue / vitesse : 0;
    const tempsPrediction = Math.min(longueurVue / Math.max(vitesse, 1), 20);
    const ahead = this._avoidAhead.set(
      this.pos.x + this.vel.x * facteurDirection,
      this.pos.y + this.vel.y * facteurDirection
    );
    const ahead2 = this._avoidAhead2.set(
      this.pos.x + this.vel.x * facteurDirection * 0.5,
      this.pos.y + this.vel.y * facteurDirection * 0.5
    );
    const marge = 10;
    let obstacleMenacant = null;
    let distanceMenaceSq = Infinity;
    let menaceX = 0;
    let menaceY = 0;
    let menaceObstacleX = 0;
    let menaceObstacleY = 0;

    for (const obstacle of obstacles) {
      const rayonSecurite = obstacle.r + this.r + marge;
      const rayonSecuriteSq = rayonSecurite * rayonSecurite;
      const obstacleVitesseX = obstacle.vel ? obstacle.vel.x : 0;
      const obstacleVitesseY = obstacle.vel ? obstacle.vel.y : 0;
      let obstacleX = obstacle.pos.x + obstacleVitesseX * tempsPrediction;
      let obstacleY = obstacle.pos.y + obstacleVitesseY * tempsPrediction;
      let dx = ahead.x - obstacleX;
      let dy = ahead.y - obstacleY;
      let distanceMinimaleSq = dx * dx + dy * dy;
      let pointX = ahead.x;
      let pointY = ahead.y;
      let pointObstacleX = obstacleX;
      let pointObstacleY = obstacleY;

      obstacleX = obstacle.pos.x + obstacleVitesseX * tempsPrediction * 0.5;
      obstacleY = obstacle.pos.y + obstacleVitesseY * tempsPrediction * 0.5;
      dx = ahead2.x - obstacleX;
      dy = ahead2.y - obstacleY;
      const distanceAhead2Sq = dx * dx + dy * dy;
      if (distanceAhead2Sq < distanceMinimaleSq) {
        distanceMinimaleSq = distanceAhead2Sq;
        pointX = ahead2.x;
        pointY = ahead2.y;
        pointObstacleX = obstacleX;
        pointObstacleY = obstacleY;
      }

      obstacleX = obstacle.pos.x;
      obstacleY = obstacle.pos.y;
      dx = this.pos.x - obstacleX;
      dy = this.pos.y - obstacleY;
      const distancePositionSq = dx * dx + dy * dy;
      if (distancePositionSq < distanceMinimaleSq) {
        distanceMinimaleSq = distancePositionSq;
        pointX = this.pos.x;
        pointY = this.pos.y;
        pointObstacleX = obstacleX;
        pointObstacleY = obstacleY;
      }
      if (distanceMinimaleSq < rayonSecuriteSq && distanceMinimaleSq < distanceMenaceSq) {
        distanceMenaceSq = distanceMinimaleSq;
        obstacleMenacant = obstacle;
        menaceX = pointX;
        menaceY = pointY;
        menaceObstacleX = pointObstacleX;
        menaceObstacleY = pointObstacleY;
      }
    }

    if (debug) {
      push();
      stroke(255, 210, 70, 180);
      strokeWeight(1);
      line(this.pos.x, this.pos.y, ahead.x, ahead.y);
      stroke(255, 140, 70, 180);
      line(this.pos.x, this.pos.y, ahead2.x, ahead2.y);
      noFill();
      circle(ahead.x, ahead.y, 8);
      circle(ahead2.x, ahead2.y, 8);
      if (obstacleMenacant) {
        stroke(255, 60, 60, 210);
        circle(
          menaceObstacleX,
          menaceObstacleY,
          obstacleMenacant.r * 2 + this.r * 2 + marge * 2
        );
      }
      pop();
    }

    if (!obstacleMenacant) {
      return createVector(0, 0);
    }

    if (vitesse <= 1e-6) {
      if (!this._stuckAvoidDirection) {
        const directionAleatoire = random(0, Math.PI * 2);
        this._stuckAvoidDirection = createVector(
          Math.cos(directionAleatoire),
          Math.sin(directionAleatoire)
        );
      }
      return this._stuckAvoidDirection.copy().mult(this.maxForce * 0.25);
    }

    const perpendiculaireX = -this.vel.y / vitesse;
    const perpendiculaireY = this.vel.x / vitesse;
    const eloignementX = menaceX - menaceObstacleX;
    const eloignementY = menaceY - menaceObstacleY;
    const projection = eloignementX * perpendiculaireX +
      eloignementY * perpendiculaireY;

    const signe = projection <= 0 ? -1 : 1;
    return createVector(perpendiculaireX * signe, perpendiculaireY * signe)
      .mult(this.maxForce);
  }

  // Wander : déplace progressivement le point visé sur un cercle devant le véhicule.
  wander() {
    const distanceCercle = 50;
    const rayonCercle = 30;
    this.wanderTheta += random(-0.3, 0.3);

    const vitesse = this.vel.mag();
    const directionX = vitesse > 1e-6 ? this.vel.x / vitesse : 1;
    const directionY = vitesse > 1e-6 ? this.vel.y / vitesse : 0;
    const centreCercle = this._wanderCenter.set(
      this.pos.x + directionX * distanceCercle,
      this.pos.y + directionY * distanceCercle
    );
    const pointCible = this._wanderTarget.set(
      centreCercle.x + Math.cos(this.wanderTheta) * rayonCercle,
      centreCercle.y + Math.sin(this.wanderTheta) * rayonCercle
    );

    if (debug) {
      push();
      noFill();
      stroke(160, 220, 255, 150);
      circle(centreCercle.x, centreCercle.y, rayonCercle * 2);
      fill(255, 220, 120);
      noStroke();
      circle(pointCible.x, pointCible.y, 7);
      pop();
    }

    return this.seek(pointCible);
  }

  // Écarte le véhicule de ses voisins proches.
  separate(vehicles, distanceMin = 40) {
    let repulsionX = 0;
    let repulsionY = 0;
    let voisins = 0;
    const distanceMinSq = distanceMin * distanceMin;

    for (const vehicle of vehicles) {
      if (vehicle === this) {
        continue;
      }
      const dx = this.pos.x - vehicle.pos.x;
      const dy = this.pos.y - vehicle.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > 1e-12 && distanceSq < distanceMinSq) {
        const distance = Math.sqrt(distanceSq);
        const poids = 1 / distance;
        repulsionX += dx / distance * poids;
        repulsionY += dy / distance * poids;
        voisins++;
      }
    }

    if (voisins === 0 || repulsionX * repulsionX + repulsionY * repulsionY <= 1e-12) {
      return createVector(0, 0);
    }

    const longueur = Math.hypot(repulsionX, repulsionY);
    const desiree = createVector(
      repulsionX / longueur * this.maxSpeed,
      repulsionY / longueur * this.maxSpeed
    );
    const steering = desiree.sub(this.vel);
    steering.limit(this.maxForce);
    return steering;
  }

  // Aligne la vitesse sur celle des voisins dans le rayon donné.
  align(vehicles, rayon = 100) {
    let vitesseX = 0;
    let vitesseY = 0;
    let voisins = 0;
    const rayonSq = rayon * rayon;

    for (const vehicle of vehicles) {
      if (vehicle === this) {
        continue;
      }
      const dx = vehicle.pos.x - this.pos.x;
      const dy = vehicle.pos.y - this.pos.y;
      if (dx * dx + dy * dy < rayonSq) {
        vitesseX += vehicle.vel.x;
        vitesseY += vehicle.vel.y;
        voisins++;
      }
    }

    if (voisins === 0) {
      return createVector(0, 0);
    }
    vitesseX /= voisins;
    vitesseY /= voisins;
    const magnitude = Math.hypot(vitesseX, vitesseY);
    if (magnitude <= 1e-6) {
      return createVector(0, 0);
    }

    const desiree = createVector(
      vitesseX / magnitude * this.maxSpeed,
      vitesseY / magnitude * this.maxSpeed
    );
    const steering = desiree.sub(this.vel);
    steering.limit(this.maxForce);
    return steering;
  }

  // Rapproche le véhicule du centre de ses voisins dans le rayon donné.
  cohesion(vehicles, rayon = 100) {
    let positionX = 0;
    let positionY = 0;
    let voisins = 0;
    const rayonSq = rayon * rayon;

    for (const vehicle of vehicles) {
      if (vehicle === this) {
        continue;
      }
      const dx = vehicle.pos.x - this.pos.x;
      const dy = vehicle.pos.y - this.pos.y;
      if (dx * dx + dy * dy < rayonSq) {
        positionX += vehicle.pos.x;
        positionY += vehicle.pos.y;
        voisins++;
      }
    }

    if (voisins === 0) {
      return createVector(0, 0);
    }
    positionX /= voisins;
    positionY /= voisins;
    const directionX = positionX - this.pos.x;
    const directionY = positionY - this.pos.y;
    const magnitude = Math.hypot(directionX, directionY);
    if (magnitude <= 1e-6) {
      return createVector(0, 0);
    }

    const desiree = createVector(
      directionX / magnitude * this.maxSpeed,
      directionY / magnitude * this.maxSpeed
    );
    const steering = desiree.sub(this.vel);
    steering.limit(this.maxForce);
    return steering;
  }

  // Repousse doucement le véhicule des bords de la carte.
  boundaries(marge = 40) {
    const desiree = createVector(0, 0);
    if (this.pos.x < marge) {
      desiree.x = this.maxSpeed;
    } else if (this.pos.x > width - marge) {
      desiree.x = -this.maxSpeed;
    }
    if (this.pos.y < marge) {
      desiree.y = this.maxSpeed;
    } else if (this.pos.y > height - marge) {
      desiree.y = -this.maxSpeed;
    }

    if (desiree.mag() === 0) {
      return createVector(0, 0);
    }

    desiree.setMag(this.maxSpeed);
    const steering = desiree.sub(this.vel);
    steering.limit(this.maxForce);
    return steering;
  }

  // inverse de seek !
  flee(target, distanceDeDetection = Infinity) {
    // Gère si target est un vecteur direct ou un objet avec .pos
    let targetPos = target instanceof p5.Vector ? target : target.pos;
    const dx = this.pos.x - targetPos.x;
    const dy = this.pos.y - targetPos.y;
    if (dx * dx + dy * dy > distanceDeDetection * distanceDeDetection) {
      return createVector(0, 0);
    }
    return this.seek(targetPos).mult(-1);
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
    const vitesseVehiculeSq = vehicle.vel.x * vehicle.vel.x + vehicle.vel.y * vehicle.vel.y;
    if (this.maxSpeed <= 1e-6 || vitesseVehiculeSq <= 1e-12) {
      return this.pursue(vehicle);
    }

    const speed_ratio = Math.min(1, vehicle.vel.mag() / this.maxSpeed);
    const target_angle = vehicle.vel.angleBetween(p5.Vector.sub(this.pos, vehicle.pos));
    const my_angle = asin(sin(target_angle) * speed_ratio);
    const dist = this.pos.dist(vehicle.pos);
    const denominator = sin(PI - my_angle - target_angle);
    if (Math.abs(denominator) <= 1e-6 || !Number.isFinite(denominator)) {
      return this.pursue(vehicle);
    }
    const prediction = dist * sin(my_angle) / denominator;
    if (!Number.isFinite(prediction)) {
      return this.pursue(vehicle);
    }
    const target = vehicle.vel.copy().setMag(prediction).add(vehicle.pos);

    if (typeof debug !== 'undefined' && debug) {
      drawArrow(vehicle.pos, p5.Vector.mult(vehicle.vel, 20), 'red');
      drawArrow(this.pos, p5.Vector.sub(target, this.pos), 'green');
      fill(0, 255, 0);
      circle(target.x, target.y, 8);
    }
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