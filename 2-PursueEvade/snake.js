class Snake {
  constructor(x, y) {
    this.head = new Vehicle(x, y);
    this.head.r = 12;
    this.head.maxSpeed = 4.5;
    this.head.baseMaxSpeed = this.head.maxSpeed;
    this.head.maxForce = 0.3;
    this.head.zoneSpeedMultiplier = 0.5;
    this.segments = [];
    this.segmentSpacing = 9;
    this.score = 0;
    this.energy = 100;
    this.energyLossPerSecond = 2;
    this.invulnerableUntilMs = 0;
    this.waves = [];
    this.bites = [];
    this.lastForces = null;
    this.avoidWeight = 4;
    this._safeTarget = createVector(x, y);
    this.pursuedDecoy = null;

    for (let i = 1; i <= 20; i++) {
      this.segments.push(createVector(x - i * this.segmentSpacing, y));
    }
  }

  update(mousePos, obstacles, decoys = [], hens = [], zones = []) {
    this.head.speedFactor(zones, this.head.baseMaxSpeed);
    let cibleX = mousePos.x;
    let cibleY = mousePos.y;
    for (const obstacle of obstacles) {
      const dx = cibleX - obstacle.pos.x;
      const dy = cibleY - obstacle.pos.y;
      const rayonSecurite = obstacle.r + this.head.r + 8;
      if (dx * dx + dy * dy < rayonSecurite * rayonSecurite) {
        let directionX = dx;
        let directionY = dy;
        let distance = Math.hypot(directionX, directionY);
        if (distance <= 1e-6) {
          directionX = this.head.pos.x - obstacle.pos.x;
          directionY = this.head.pos.y - obstacle.pos.y;
          distance = Math.hypot(directionX, directionY);
        }
        if (distance <= 1e-6) {
          directionX = 1;
          directionY = 0;
          distance = 1;
        }
        cibleX = obstacle.pos.x + directionX / distance * rayonSecurite;
        cibleY = obstacle.pos.y + directionY / distance * rayonSecurite;
      }
    }
    const cible = this._safeTarget.set(cibleX, cibleY);
    const distanceX = this.head.pos.x - cible.x;
    const distanceY = this.head.pos.y - cible.y;
    const distanceToMouseSq = distanceX * distanceX + distanceY * distanceY;
    let closestHenDistanceSq = Infinity;
    for (const hen of hens) {
      const dx = this.head.pos.x - hen.pos.x;
      const dy = this.head.pos.y - hen.pos.y;
      closestHenDistanceSq = Math.min(closestHenDistanceSq, dx * dx + dy * dy);
    }

    this.pursuedDecoy = null;
    let closestMouseDistanceSq = 220 * 220;
    for (const decoy of decoys) {
      if (decoy.type !== "mouse") {
        continue;
      }
      const dx = this.head.pos.x - decoy.pos.x;
      const dy = this.head.pos.y - decoy.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < closestMouseDistanceSq && distanceSq < closestHenDistanceSq) {
        this.pursuedDecoy = decoy;
        closestMouseDistanceSq = distanceSq;
      }
    }

    const arriveForce = this.pursuedDecoy ? null : this.head.arrive(cible, 120);
    const pursueForce = this.pursuedDecoy
      ? this.head.pursuePerfect(this.pursuedDecoy)
      : null;
    const avoidForce = this.head.avoid(obstacles).mult(this.avoidWeight);

    this.lastForces = {
      arrive: arriveForce && arriveForce.copy(),
      avoid: avoidForce.copy(),
      pursue: pursueForce && pursueForce.copy(),
      pursuedDecoy: this.pursuedDecoy
    };
    if (arriveForce) {
      this.head.applyForce(arriveForce);
    }
    if (pursueForce) {
      this.head.applyForce(pursueForce);
    }
    this.head.applyForce(avoidForce);

    if (distanceToMouseSq < 225 &&
      this.head.vel.x * this.head.vel.x + this.head.vel.y * this.head.vel.y > 0.04) {
      const freinage = this.head.vel.copy().mult(-1);
      freinage.limit(this.head.maxForce);
      this.head.applyForce(freinage);
    }

    this.head.update();
    this.followBody();
    this.resolveBodyObstacles(obstacles);
    this.updateEffects();
  }

  followBody() {
    let leader = this.head.pos;
    const vitesseRelative = this.head.maxSpeed > 0
      ? constrain(this.head.vel.mag() / this.head.maxSpeed, 0, 1)
      : 0;
    const amplitudeOndulation = 1.4 * vitesseRelative;

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      let directionX = leader.x - segment.x;
      let directionY = leader.y - segment.y;
      let distance = Math.hypot(directionX, directionY);
      if (distance <= 1e-6) {
        directionX = 1;
        directionY = 0;
        distance = 1;
      }
      directionX = directionX / distance * this.segmentSpacing;
      directionY = directionY / distance * this.segmentSpacing;
      const normaleX = -directionY / this.segmentSpacing;
      const normaleY = directionX / this.segmentSpacing;
      const ondulation = Math.sin(frameCount * 0.13 - i * 0.48) * amplitudeOndulation;
      segment.set(
        leader.x - directionX + normaleX * ondulation,
        leader.y - directionY + normaleY * ondulation
      );
      leader = segment;
    }
  }

  resolveBodyObstacles(obstacles) {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const rayonSegment = this.segmentRadius(i);

      for (const obstacle of obstacles) {
        const rayonSecurite = obstacle.r + rayonSegment;
        const dx = segment.x - obstacle.pos.x;
        const dy = segment.y - obstacle.pos.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq < rayonSecurite * rayonSecurite) {
          let directionX = dx;
          let directionY = dy;
          let distance = Math.sqrt(distanceSq);
          if (distance <= 1e-6) {
            directionX = 1;
            directionY = 0;
            distance = 1;
          }
          segment.set(
            obstacle.pos.x + directionX / distance * rayonSecurite,
            obstacle.pos.y + directionY / distance * rayonSecurite
          );
        }
      }
    }
  }

  eat(hens) {
    let eaten = 0;
    for (let i = hens.length - 1; i >= 0; i--) {
      const hen = hens[i];
      if (hen.leader) {
        continue;
      }
      const dx = this.head.pos.x - hen.pos.x;
      const dy = this.head.pos.y - hen.pos.y;
      const rayonCapture = this.head.r + hen.r;
      if (dx * dx + dy * dy < rayonCapture * rayonCapture) {
        hens.splice(i, 1);
        this.grow(3);
        this.score++;
        this.energy = Math.min(100, this.energy + 25);
        this.bites.push({ pos: hen.pos.copy(), age: 0 });
        this.waves.push({ pos: hen.pos.copy(), age: 0 });
        eaten++;
      }
    }
    return eaten;
  }

  eatGuards(hens) {
    let eaten = 0;
    for (let i = hens.length - 1; i >= 0; i--) {
      const guard = hens[i];
      if (!guard.leader) {
        continue;
      }
      const dx = this.head.pos.x - guard.pos.x;
      const dy = this.head.pos.y - guard.pos.y;
      const rayonCapture = this.head.r + guard.r;
      if (dx * dx + dy * dy < rayonCapture * rayonCapture) {
        hens.splice(i, 1);
        this.energy = Math.min(100, this.energy + 10);
        this.waves.push({ pos: guard.pos.copy(), age: 0 });
        eaten++;
      }
    }
    return eaten;
  }

  captureQueen(queen) {
    if (!queen || queen.captured) {
      return false;
    }
    const dx = this.head.pos.x - queen.pos.x;
    const dy = this.head.pos.y - queen.pos.y;
    const rayonCapture = this.head.r + queen.r;
    if (dx * dx + dy * dy >= rayonCapture * rayonCapture) {
      return false;
    }
    queen.captured = true;
    this.score++;
    this.waves.push({ pos: queen.pos.copy(), age: 0 });
    return true;
  }

  updateEnergy(elapsedSeconds) {
    if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) {
      this.energy = Math.max(0, this.energy - this.energyLossPerSecond * elapsedSeconds);
    }
  }

  isInvulnerable(nowMs = typeof millis === "function" ? millis() : 0) {
    return nowMs < this.invulnerableUntilMs;
  }

  takeDamage(energyLoss = 30, segmentLoss = 4, nowMs = typeof millis === "function" ? millis() : 0) {
    if (this.isInvulnerable(nowMs)) {
      return false;
    }

    const degatEnergie = Number.isFinite(energyLoss) ? Math.max(0, energyLoss) : 0;
    const degatSegments = Number.isFinite(segmentLoss)
      ? Math.max(0, Math.floor(segmentLoss))
      : 0;
    this.energy = Math.max(0, this.energy - degatEnergie);
    this.segments.splice(
      Math.max(0, this.segments.length - degatSegments),
      degatSegments
    );
    this.invulnerableUntilMs = nowMs + 1500;
    return true;
  }

  eatDecoys(decoys) {
    let eaten = 0;
    for (let i = decoys.length - 1; i >= 0; i--) {
      const decoy = decoys[i];
      if (decoy.type !== "mouse") {
        continue;
      }
      const dx = this.head.pos.x - decoy.pos.x;
      const dy = this.head.pos.y - decoy.pos.y;
      const rayonCapture = this.head.r + decoy.r;
      if (dx * dx + dy * dy < rayonCapture * rayonCapture) {
        decoys.splice(i, 1);
        this.score++;
        this.waves.push({ pos: decoy.pos.copy(), age: 0 });
        eaten++;
      }
    }
    return eaten;
  }

  grow(amount = 1) {
    if (!this.segments.length) {
      this.segments.push(this.head.pos.copy());
    }

    const tail = this.segments[this.segments.length - 1];
    const beforeTail = this.segments.length > 1
      ? this.segments[this.segments.length - 2]
      : this.head.pos;
    const direction = p5.Vector.sub(tail, beforeTail);
    if (direction.mag() === 0) {
      direction.set(-1, 0);
    }
    direction.normalize();

    for (let i = 0; i < amount; i++) {
      const last = this.segments[this.segments.length - 1];
      this.segments.push(
        last.copy().add(direction.copy().mult(this.segmentSpacing))
      );
    }
  }

  updateEffects() {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      this.waves[i].age += 1;
      if (this.waves[i].age >= 28) {
        this.waves.splice(i, 1);
      }
    }
    for (let i = this.bites.length - 1; i >= 0; i--) {
      this.bites[i].age += 1;
      if (this.bites[i].age >= 52) {
        this.bites.splice(i, 1);
      }
    }
  }

  segmentRadius(index) {
    const proportion = this.segments.length <= 1
      ? 1
      : 1 - index / (this.segments.length - 1);
    return 4 + proportion * 5;
  }

  containsPoint(x, y, radius = 0) {
    const dxTete = this.head.pos.x - x;
    const dyTete = this.head.pos.y - y;
    const rayonTete = this.head.r + radius;
    if (dxTete * dxTete + dyTete * dyTete < rayonTete * rayonTete) {
      return true;
    }
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const dx = segment.x - x;
      const dy = segment.y - y;
      const rayon = this.segmentRadius(i) + radius;
      if (dx * dx + dy * dy < rayon * rayon) {
        return true;
      }
    }
    return false;
  }

  show() {
    if (this.isInvulnerable() && frameCount % 10 < 5) {
      return;
    }
    this.drawBiteEffects();

    // Le renflement de chaque bouchée progresse de la tête vers la queue.
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const proportion = this.segments.length <= 1 ? 0 : i / (this.segments.length - 1);
      const rayon = this.segmentRadius(i);
      const couleur = lerpColor(color("#79a94d"), color("#294d35"), proportion);
      const renflement = this.bites.reduce((intensite, bite) => {
        const progression = bite.age / 52;
        const segmentBouche = Math.round(progression * (this.segments.length - 1));
        return Math.max(intensite, Math.max(0, 1 - Math.abs(i - segmentBouche) / 2) * (1 - progression));
      }, 0);
      const rayonVentre = rayon * (1 + renflement * 0.48);

      push();
      translate(segment.x, segment.y);
      rotate(this.bodyAngle(i));
      stroke("#203c2b");
      strokeWeight(1);
      fill(couleur);
      ellipse(0, 0, rayon * 2.1 + renflement * 3, rayon * 1.8 + renflement * 2);
      noStroke();
      fill(lerpColor(color("#d2d69a"), color("#87945b"), proportion));
      ellipse(0, rayon * 0.25, rayonVentre * 1.3, rayon * 0.68);

      // Marques sombres alternées, comme des écailles en losange.
      if (i % 2 === 0) {
        fill(34, 71, 45, 190);
        ellipse(0, -rayon * 0.12, rayon * 0.42, rayon * 1.05);
        ellipse(-rayon * 0.48, 0, rayon * 0.32, rayon * 0.78);
        ellipse(rayon * 0.48, 0, rayon * 0.32, rayon * 0.78);
      }
      pop();
    }

    this.drawHead();
    this.drawDebug();
  }

  bodyAngle(index) {
    const previous = index === 0 ? this.head.pos : this.segments[index - 1];
    const segment = this.segments[index];
    return Math.atan2(previous.y - segment.y, previous.x - segment.x);
  }

  drawHead() {
    const angle = this.head.vel.mag() > 0.01
      ? this.head.vel.heading()
      : -Math.PI / 2;
    push();
    translate(this.head.pos.x, this.head.pos.y);
    rotate(angle);
    stroke("#203c2b");
    strokeWeight(1.5);
    fill("#5d8e46");
    beginShape();
    vertex(16, 0);
    bezierVertex(8, -12, -7, -13, -12, -5);
    bezierVertex(-17, 0, -12, 8, -6, 10);
    bezierVertex(2, 13, 10, 8, 16, 0);
    endShape(CLOSE);

    noStroke();
    fill("#d4ddab");
    ellipse(2, 4, 15, 7);

    // Yeux placés de part et d'autre de la tête, pupilles verticales.
    fill("#f4edcf");
    ellipse(3, -7, 7, 6);
    ellipse(3, 7, 7, 6);
    fill("#17251b");
    ellipse(4, -7, 2, 4);
    ellipse(4, 7, 2, 4);
    fill("#17251b");
    circle(13, -2, 2);
    circle(13, 2, 2);

    if (frameCount % 60 < 8) {
      stroke("#ba3543");
      strokeWeight(2);
      line(15, 0, 25, 0);
      line(25, 0, 29, -3);
      line(25, 0, 29, 3);
    }
    pop();
  }

  drawBiteEffects() {
    noFill();
    for (const wave of this.waves) {
      const progression = wave.age / 28;
      stroke(255, 226, 144, 180 * (1 - progression));
      strokeWeight(2);
      circle(wave.pos.x, wave.pos.y, 10 + progression * 42);
    }
  }

  drawDebug() {
    if (!debug) {
      return;
    }

    push();
    noFill();
    stroke(255, 90, 90, 170);
    strokeWeight(1);
    circle(this.head.pos.x, this.head.pos.y, this.head.r * 2);
    for (const segment of this.segments) {
      circle(segment.x, segment.y, 4);
    }

    if (this.lastForces) {
      if (this.lastForces.arrive) {
        drawArrow(this.head.pos, this.lastForces.arrive.copy().mult(100), "#66ddff");
      }
      drawArrow(this.head.pos, this.lastForces.avoid.copy().mult(100), "#ff9c42");
      if (this.lastForces.pursuedDecoy) {
        push();
        stroke(240, 130, 200, 180);
        strokeWeight(1);
        line(
          this.head.pos.x,
          this.head.pos.y,
          this.lastForces.pursuedDecoy.pos.x,
          this.lastForces.pursuedDecoy.pos.y
        );
        pop();
        drawArrow(this.head.pos, this.lastForces.pursue.copy().mult(100), "#ef82cf");
      }
    }
    pop();
  }
}
