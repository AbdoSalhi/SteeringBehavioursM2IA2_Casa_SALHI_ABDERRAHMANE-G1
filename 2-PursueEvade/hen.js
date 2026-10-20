class Hen extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D().mult(1.5);
    this.r = 12;
    this.maxSpeed = 2.5;
    this.vitesseNormale = this.maxSpeed;
    this.maxForce = 0.15;
    this.rayonDetection = 140;
    this.rayonPanique = 60;
    this.champVision = 110;
    this.porteeVision = 160;
    this.porteeAudition = 50;
    this.zoneSpeedMultiplier = 0.7;
    this.avoidWeight = 4;
    this.etat = "wander";
    this._wanderOffset = random(TWO_PI);
    this.alertAtFrame = null;
    this.alertSource = null;
    this.chainFleeFrames = 0;
    this.callFrames = 0;
  }

  applyBehaviors(snake, obstacles, hens, decoys = [], zones = [], pen = null) {
    if (this.leader) {
      return this.applyGuardBehaviors(snake, obstacles, hens, decoys, zones);
    }
    if (pen && pen.contains(this.pos)) {
      return this.applyPenBehaviors(obstacles, hens, zones, pen);
    }
    this.inPen = false;

    const etaitEnFuite = this.etat === "flee";
    if (this.callFrames > 0) {
      this.callFrames--;
    }
    if (this.chainFleeFrames > 0) {
      this.chainFleeFrames--;
    }

    if (this.alertAtFrame !== null && frameCount >= this.alertAtFrame) {
      this.alertAtFrame = null;
      this.chainFleeFrames = 60;
    }

    const vitesseNormale = this.vitesseNormale;
    this.maxSpeed = vitesseNormale;
    const forceEvitement = this.avoid(obstacles).mult(this.avoidWeight);
    const forceSeparation = this.separate(hens).mult(1.5);
    const forceAlignement = this.align(hens, 100).mult(0.8);
    const forceCohesion = this.cohesion(hens, 150).mult(0.6);
    const forceBordure = this.boundaries().mult(1.5);

    let forceFuite = null;
    let forceErrance = null;
    let forceLeurre = null;
    let forceMare = null;
    let leurreCible = null;
    this.targetDecoy = null;
    this.picore = false;
    this.applyForce(forceEvitement);
    this.applyForce(forceBordure);
    this.applyForce(forceSeparation);
    this.applyForce(forceAlignement);
    this.applyForce(forceCohesion);

    const tete = snake && snake.head && !snake.head.hidden
      ? snake.head
      : null;
    const dxTete = tete ? this.pos.x - tete.pos.x : Infinity;
    const dyTete = tete ? this.pos.y - tete.pos.y : Infinity;
    const distanceTeteSq = tete ? dxTete * dxTete + dyTete * dyTete : Infinity;
    const voitSerpent = tete && distanceTeteSq < this.porteeVision * this.porteeVision &&
      this.canSee(tete);
    const entendSerpent = tete && distanceTeteSq < this.porteeAudition * this.porteeAudition;
    if (voitSerpent || entendSerpent) {
      this.etat = "flee";
      this.maxSpeed = vitesseNormale * 1.6;
      forceFuite = this.evade(tete).mult(2);
      this.alertAtFrame = null;
      this.applyForce(forceFuite);
    } else {
      let fakeSnake = null;
      let fakeSnakeDistanceSq = 160 * 160;
      let seed = null;
      let seedDistanceSq = 250 * 250;
      for (const decoy of decoys) {
        const dx = this.pos.x - decoy.pos.x;
        const dy = this.pos.y - decoy.pos.y;
        const distanceSq = dx * dx + dy * dy;
        if (decoy.type === "fakeSnake" && distanceSq < fakeSnakeDistanceSq) {
          fakeSnake = decoy;
          fakeSnakeDistanceSq = distanceSq;
        } else if (decoy.type === "seed" && distanceSq < seedDistanceSq) {
          seed = decoy;
          seedDistanceSq = distanceSq;
        }
      }

      if (fakeSnake) {
        this.etat = "flee";
        this.maxSpeed = vitesseNormale * 1.6;
        this.targetDecoy = fakeSnake;
        leurreCible = fakeSnake;
        forceLeurre = this.evade(fakeSnake).mult(2);
        this.alertAtFrame = null;
      } else if (this.chainFleeFrames > 0 && this.alertSource) {
        this.etat = "flee";
        this.maxSpeed = vitesseNormale * 1.6;
        forceFuite = this.evade(this.alertSource).mult(2);
      } else if (seed) {
        this.etat = "peck";
        this.maxSpeed = vitesseNormale;
        this.targetDecoy = seed;
        leurreCible = seed;
        forceLeurre = this.arrive(seed.pos, 40).mult(1.5);
        const reach = seed.r + this.r + 8;
        this.picore = seedDistanceSq <= reach * reach;
      } else {
        this.etat = "wander";
        this.maxSpeed = vitesseNormale;
        forceErrance = this.wander();
      }
      if (forceLeurre) {
        this.applyForce(forceLeurre);
      }
      if (forceErrance) {
        this.applyForce(forceErrance);
      }
    }

    if (this.etat === "flee") {
      let mareProche = null;
      let distanceMareSq = Infinity;
      for (const zone of zones) {
        if (zone.type !== "mare") {
          continue;
        }
        const dx = zone.pos.x - this.pos.x;
        const dy = zone.pos.y - this.pos.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < distanceMareSq) {
          mareProche = zone;
          distanceMareSq = distanceSq;
        }
      }
      if (mareProche) {
        forceMare = this.arrive(mareProche.pos, 60).mult(1.5);
        this.applyForce(forceMare);
      }
    }

    if (this.etat === "flee" && !etaitEnFuite) {
      this.callFrames = 40;
      this.chainFleeFrames = Math.max(this.chainFleeFrames, 60);
      this.broadcastAlert(hens);
    }
    this.enPanique = distanceTeteSq < this.rayonPanique * this.rayonPanique;
    this.lastForces = {
      avoid: forceEvitement.copy(),
      separate: forceSeparation.copy(),
      align: forceAlignement.copy(),
      cohesion: forceCohesion.copy(),
      boundaries: forceBordure.copy(),
      flee: forceFuite && forceFuite.copy(),
      decoy: forceLeurre && forceLeurre.copy(),
      wander: forceErrance && forceErrance.copy(),
      pond: forceMare && forceMare.copy(),
      targetDecoy: leurreCible
    };

    this.speedFactor(zones, this.maxSpeed);
    this.update();
  }

  applyGuardBehaviors(snake, obstacles, hens, decoys, zones) {
    const forceEvitement = this.avoid(obstacles).mult(this.avoidWeight);
    const tete = snake && snake.head && !snake.head.hidden ? snake.head : null;
    const dxTete = tete ? this.pos.x - tete.pos.x : Infinity;
    const dyTete = tete ? this.pos.y - tete.pos.y : Infinity;
    const distanceTeteSq = dxTete * dxTete + dyTete * dyTete;
    const menaceSerpent = tete && distanceTeteSq < 100 * 100;
    let forceFuite = null;
    let forceSuivi = null;
    let forceLeurre = null;
    let leurreCible = null;
    let seed = null;
    let distanceSeedSq = 250 * 250;
    let fakeSnake = null;
    let distanceFakeSnakeSq = 160 * 160;

    for (const decoy of decoys) {
      const dx = this.pos.x - decoy.pos.x;
      const dy = this.pos.y - decoy.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (decoy.type === "seed" && distanceSq < distanceSeedSq) {
        seed = decoy;
        distanceSeedSq = distanceSq;
      } else if (decoy.type === "fakeSnake" && distanceSq < distanceFakeSnakeSq) {
        fakeSnake = decoy;
        distanceFakeSnakeSq = distanceSq;
      }
    }

    let directionX = -this.leader.vel.x;
    let directionY = -this.leader.vel.y;
    let directionMagnitude = Math.hypot(directionX, directionY);
    if (directionMagnitude <= 1e-6) {
      directionX = 1;
      directionY = 0;
      directionMagnitude = 1;
    }
    const pointDerriere = createVector(
      this.leader.pos.x + directionX / directionMagnitude * 40,
      this.leader.pos.y + directionY / directionMagnitude * 40
    );

    this.maxSpeed = this.vitesseNormale;
    this.applyForce(forceEvitement);
    if (menaceSerpent || fakeSnake) {
      const cibleFuite = menaceSerpent ? tete : fakeSnake;
      forceFuite = this.evade(cibleFuite).mult(2);
      this.etat = "flee";
      this.applyForce(forceFuite);
    } else if (seed) {
      forceLeurre = this.arrive(seed.pos, 40).mult(1.5);
      leurreCible = seed;
      this.etat = "peck";
      this.applyForce(forceLeurre);
    } else {
      forceSuivi = this.arrive(pointDerriere, 60);
      this.etat = "follow";
      this.applyForce(forceSuivi);
    }

    const forceSeparation = this.separate(hens).mult(1.5);
    this.applyForce(forceSeparation);
    this.targetDecoy = leurreCible;
    this.lastForces = {
      avoid: forceEvitement.copy(),
      separate: forceSeparation.copy(),
      align: createVector(0, 0),
      cohesion: createVector(0, 0),
      boundaries: createVector(0, 0),
      flee: forceFuite && forceFuite.copy(),
      decoy: forceLeurre && forceLeurre.copy(),
      follow: forceSuivi && forceSuivi.copy(),
      wander: null,
      pond: null,
      targetDecoy: leurreCible
    };
    this.speedFactor(zones, this.vitesseNormale);
    this.update();
  }

  canSee(target) {
    if (!target) {
      return false;
    }
    const targetPos = target.pos || target;
    const direction = p5.Vector.sub(targetPos, this.pos);
    const distanceSq = direction.magSq();
    const vitesseSq = this.vel.magSq();
    if (distanceSq <= 1e-12 || distanceSq > this.porteeVision * this.porteeVision ||
      vitesseSq <= 1e-12) {
      return false;
    }

    const angle = p5.Vector.angleBetween(this.vel, direction);
    return Number.isFinite(angle) && angle <= this.champVision * Math.PI / 360;
  }

  applyPenBehaviors(obstacles, hens, zones, pen) {
    if (this.callFrames > 0) {
      this.callFrames--;
    }
    this.inPen = true;
    this.etat = "wander";
    this.targetDecoy = null;
    this.picore = false;
    this.enPanique = false;
    this.alertAtFrame = null;
    this.chainFleeFrames = 0;
    this.alertSource = null;
    this.maxSpeed = this.vitesseNormale;

    const forceEvitement = this.avoid(obstacles).mult(this.avoidWeight);
    const forceSeparation = this.separate(hens).mult(1.5);
    const forceBordure = pen.boundaries(this).mult(1.5);
    const forceErrance = this.wander();
    this.applyForce(forceEvitement);
    this.applyForce(forceBordure);
    this.applyForce(forceSeparation);
    this.applyForce(forceErrance);

    this.lastForces = {
      avoid: forceEvitement.copy(),
      separate: forceSeparation.copy(),
      align: createVector(0, 0),
      cohesion: createVector(0, 0),
      boundaries: forceBordure.copy(),
      flee: null,
      decoy: null,
      wander: forceErrance.copy(),
      pond: null,
      targetDecoy: null
    };

    this.speedFactor(zones, this.vitesseNormale);
    this.update();
  }

  broadcastAlert(hens) {
    const rayonAlerteSq = 150 * 150;
    for (const hen of hens) {
      if (hen === this || hen.etat === "flee" || hen.alertAtFrame !== null) {
        continue;
      }
      const dx = hen.pos.x - this.pos.x;
      const dy = hen.pos.y - this.pos.y;
      if (dx * dx + dy * dy < rayonAlerteSq) {
        hen.alertSource = this;
        hen.alertAtFrame = frameCount + Math.floor(random(5, 21));
      }
    }
  }

  show() {
    const animation = this.etat === "wander"
      ? Math.sin(frameCount * 0.12 + this._wanderOffset)
      : Math.sin(frameCount * (this.etat === "peck" ? 0.8 : 1.2) + this._wanderOffset) *
        (this.etat === "peck" ? 1.4 : 0.8);
    const angle = this.vel.heading();

    if (debug) {
      push();
      noFill();
      stroke(115, 175, 255, 65);
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, this.rayonDetection * 2);
      noFill();
      stroke(255, 100, 100, 55);
      circle(this.pos.x, this.pos.y, this.porteeVision * 2);
      if (this.vel.magSq() > 1e-12) {
        const angle = this.vel.heading();
        const demiAngle = this.champVision * Math.PI / 360;
        stroke(255, 230, 100, 150);
        strokeWeight(1.5);
        line(
          this.pos.x,
          this.pos.y,
          this.pos.x + Math.cos(angle - demiAngle) * this.porteeVision,
          this.pos.y + Math.sin(angle - demiAngle) * this.porteeVision
        );
        line(
          this.pos.x,
          this.pos.y,
          this.pos.x + Math.cos(angle + demiAngle) * this.porteeVision,
          this.pos.y + Math.sin(angle + demiAngle) * this.porteeVision
        );
        noFill();
        arc(
          this.pos.x,
          this.pos.y,
          this.porteeVision * 2,
          this.porteeVision * 2,
          angle - demiAngle,
          angle + demiAngle
        );
      }
      pop();
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(angle);
    noStroke();

    // Queue, corps et aile.
    fill("#e9dfc7");
    ellipse(-this.r * 0.85, -this.r * 0.15, this.r * 0.8, this.r * 0.55);
    fill("#fff5df");
    ellipse(-this.r * 0.05, 0, this.r * 2, this.r * 1.35);
    fill("#d7c7a8");
    ellipse(-this.r * 0.1, this.r * 0.1, this.r * 1.05, this.r * 0.62);

    // Tête mobile, orientée vers l'avant.
    fill("#fff5df");
    ellipse(this.r * 0.82, -this.r * 0.3 + animation * 1.4, this.r * 0.82, this.r * 0.78);
    fill("#f29b28");
    triangle(
      this.r * 1.12, -this.r * 0.32 + animation * 1.4,
      this.r * 1.62, -this.r * 0.16 + animation * 1.4,
      this.r * 1.12, -this.r * 0.02 + animation * 1.4
    );

    // Crête et œil.
    fill("#d8453f");
    ellipse(this.r * 0.64, -this.r * 0.78 + animation * 1.4, this.r * 0.23, this.r * 0.42);
    ellipse(this.r * 0.85, -this.r * 0.74 + animation * 1.4, this.r * 0.23, this.r * 0.42);
    fill("#241e1b");
    circle(this.r * 0.94, -this.r * 0.42 + animation * 1.4, 2.2);

    pop();

    if (this.etat === "flee") {
      push();
      noStroke();
      fill("#ffd66e");
      textSize(12);
      text(this.enPanique ? "!!" : "!", this.pos.x + 10, this.pos.y - 17);
      pop();
    }

    if (this.callFrames > 0) {
      push();
      noStroke();
      fill(250, 248, 225, 235);
      rect(this.pos.x + 12, this.pos.y - 31, 66, 22, 8);
      fill("#493a2a");
      textSize(10);
      text("cot cot", this.pos.x + 21, this.pos.y - 25);
      pop();
    }

    if (this.inPen) {
      push();
      noStroke();
      fill("#9ee28a");
      circle(this.pos.x + this.r, this.pos.y - this.r, 5);
      pop();
    }

    if (debug && this.lastForces) {
      if (this.lastForces.targetDecoy) {
        push();
        stroke(255, 226, 108, 190);
        strokeWeight(1);
        line(
          this.pos.x,
          this.pos.y,
          this.lastForces.targetDecoy.pos.x,
          this.lastForces.targetDecoy.pos.y
        );
        pop();
      }
      drawArrow(this.pos, this.lastForces.avoid.copy().mult(100), "#ff9c42");
      drawArrow(this.pos, this.lastForces.separate.copy().mult(100), "#e56bff");
      if (this.lastForces.align) {
        drawArrow(this.pos, this.lastForces.align.copy().mult(100), "#6bd7e8");
      }
      if (this.lastForces.cohesion) {
        drawArrow(this.pos, this.lastForces.cohesion.copy().mult(100), "#b5d95c");
      }
      drawArrow(this.pos, this.lastForces.boundaries.copy().mult(100), "#65e69a");
      if (this.lastForces.pond) {
        drawArrow(this.pos, this.lastForces.pond.copy().mult(100), "#6ad5e0");
      }
      const forceComportement = this.lastForces.flee ||
        this.lastForces.decoy ||
        this.lastForces.wander;
      if (forceComportement) {
        drawArrow(
          this.pos,
          forceComportement.copy().mult(100),
          this.lastForces.flee ? "#ff5c72" : "#66ddff"
        );
      }
    }
  }

  static spawn(obstacles = [], snake = null) {
    const rayon = 12;
    const tete = snake && snake.head;
    const distanceTete = 140;
    const maxTentatives = 100;

    for (let tentative = 0; tentative < maxTentatives; tentative++) {
      const x = random(rayon, Math.max(rayon, width - rayon));
      const y = random(rayon, Math.max(rayon, height - rayon));
      const obstacleProche = obstacles.some(obstacle =>
        (x - obstacle.pos.x) ** 2 + (y - obstacle.pos.y) ** 2 <
          (rayon + obstacle.r) ** 2
      );
      const serpentProche = snake && snake.containsPoint
        ? snake.containsPoint(x, y, distanceTete + rayon)
        : tete && (x - tete.pos.x) ** 2 + (y - tete.pos.y) ** 2 <
          (distanceTete + rayon) ** 2;

      if (!obstacleProche && !serpentProche) {
        return new Hen(x, y);
      }
    }

    const pas = Math.max(24, rayon * 2);
    for (let y = rayon; y <= height - rayon; y += pas) {
      for (let x = rayon; x <= width - rayon; x += pas) {
        const obstacleProche = obstacles.some(obstacle =>
          (x - obstacle.pos.x) ** 2 + (y - obstacle.pos.y) ** 2 <
            (rayon + obstacle.r) ** 2
        );
        const serpentProche = snake && snake.containsPoint
          ? snake.containsPoint(x, y, distanceTete + rayon)
          : tete && (x - tete.pos.x) ** 2 + (y - tete.pos.y) ** 2 <
            (distanceTete + rayon) ** 2;
        if (!obstacleProche && !serpentProche) {
          return new Hen(x, y);
        }
      }
    }

    throw new Error("Impossible de trouver une position libre pour faire apparaître une poule.");
  }
}
