class Decoy extends Vehicle {
  constructor(typeOrX, xOrY, yOrVelocity, lifetimeOrCreatedAt, lifetimeMs = 2000) {
    const legacy = typeof typeOrX !== "string";
    const type = legacy ? "legacy" : typeOrX;
    const x = legacy ? typeOrX : xOrY;
    const y = legacy ? xOrY : yOrVelocity;
    super(x, y);

    this.type = type;
    this.age = 0;
    this.lifetime = legacy ? lifetimeMs : Math.floor(random(480, 901));
    this.r = type === "fakeSnake" ? 15 : type === "mouse" ? 9 : 8;
    this.maxSpeed = type === "mouse" ? 1.6 : 0;
    this.maxForce = type === "mouse" ? 0.08 : 0;
    this._spiralPhase = 0;

    if (legacy) {
      const sourceVelocity = yOrVelocity;
      this.maxSpeed = Math.max(3, sourceVelocity.mag());
      this.maxForce = 0.12;
      this.vel = sourceVelocity.copy();
      if (this.vel.mag() < 0.01) {
        this.vel = p5.Vector.random2D().mult(this.maxSpeed);
      }
      this.createdAtMs = lifetimeOrCreatedAt;
      this.expiresAtMs = lifetimeOrCreatedAt + lifetimeMs;
      this.lifetime = lifetimeMs;
      return;
    }

    this._spiralPhase = random(TWO_PI);
    if (!["seed", "fakeSnake", "mouse"].includes(type)) {
      throw new Error(`Type de leurre inconnu : ${type}`);
    }
    if (type === "mouse") {
      this.vel = p5.Vector.random2D().mult(this.maxSpeed * 0.6);
    } else {
      this.vel.set(0, 0);
    }
  }

  update(obstacles = []) {
    this.age++;
    if (this.type !== "mouse") {
      return;
    }

    this.applyForce(this.avoid(obstacles).mult(4));
    this.applyForce(this.wander());
    this.applyForce(this.boundaries(24));
    super.update();
  }

  updateDecoy(nowMs) {
    if (this.type !== "legacy" || this.isExpired(nowMs)) {
      return false;
    }

    const direction = this.vel.mag() > 0.01
      ? this.vel.copy().normalize()
      : createVector(1, 0);
    const driftPoint = p5.Vector.add(this.pos, direction.mult(80));
    this.applyForce(this.seek(driftPoint));
    super.update();
    this.edges();
    return true;
  }

  isExpired(nowMs = this.age) {
    return this.type === "legacy"
      ? nowMs >= this.expiresAtMs
      : this.age >= this.lifetime;
  }

  get lifeRatio() {
    if (this.type === "legacy") {
      return Math.max(0, 1 - (this.age / this.lifetime));
    }
    return Math.max(0, 1 - this.age / this.lifetime);
  }

  consume(hens) {
    if (this.type !== "seed") {
      return;
    }

    let peckingHens = 0;
    for (const hen of hens) {
      if (hen.targetDecoy !== this || !hen.picore) {
        continue;
      }
      const dx = hen.pos.x - this.pos.x;
      const dy = hen.pos.y - this.pos.y;
      const reach = this.r + hen.r + 8;
      if (dx * dx + dy * dy <= reach * reach) {
        peckingHens++;
      }
    }
    this.age += peckingHens * 3;
  }

  show(preview = false) {
    if (this.type === "legacy") {
      this.showLegacy();
      return;
    }

    push();
    if (this.type === "seed") {
      this.showSeed(preview);
    } else if (this.type === "fakeSnake") {
      this.showFakeSnake(preview);
    } else {
      this.showMouse(preview);
    }

    if (!preview) {
      this.showLifetime();
    }
    if (debug && !preview) {
      const influence = this.type === "seed" ? 250 : this.type === "fakeSnake" ? 160 : 220;
      noFill();
      stroke(255, 220, 140, 65);
      strokeWeight(1);
      circle(this.pos.x, this.pos.y, influence * 2);
    }
    pop();
  }

  showSeed(preview) {
    const alpha = preview ? 110 : 255;
    noStroke();
    fill(255, 202, 72, alpha);
    ellipse(this.pos.x - 3, this.pos.y, 9, 6);
    ellipse(this.pos.x + 2, this.pos.y - 2, 8, 6);
    ellipse(this.pos.x + 4, this.pos.y + 2, 7, 5);
    fill(255, 235, 150, alpha);
    circle(this.pos.x - 3, this.pos.y - 1, 2);
    circle(this.pos.x + 2, this.pos.y + 1, 2);
    circle(this.pos.x + 5, this.pos.y - 2, 2);
  }

  showFakeSnake(preview) {
    const alpha = preview ? 110 : 255;
    noFill();
    stroke(104, 37, 29, alpha);
    strokeWeight(10);
    circle(this.pos.x, this.pos.y, this.r * 1.65);
    stroke(236, 91, 45, alpha);
    strokeWeight(6);
    circle(this.pos.x, this.pos.y, this.r * 1.65);
    noStroke();
    fill(255, 211, 91, alpha);
    circle(this.pos.x + this.r * 0.48, this.pos.y - this.r * 0.42, 3);
    fill(255, 241, 215, alpha);
    circle(this.pos.x + this.r * 0.52, this.pos.y - this.r * 0.45, 1.5);
  }

  showMouse(preview) {
    const alpha = preview ? 110 : 255;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.mag() > 0.01 ? this.vel.heading() : 0);
    noStroke();
    fill(105, 111, 115, alpha);
    ellipse(0, 0, this.r * 2.1, this.r * 1.35);
    fill(144, 149, 151, alpha);
    ellipse(this.r * 0.55, -this.r * 0.35, this.r * 0.8, this.r * 0.8);
    fill(224, 164, 158, alpha);
    circle(this.r * 0.58, -this.r * 0.38, this.r * 0.42);
    fill(235, 224, 198, alpha);
    circle(this.r * 0.88, -this.r * 0.05, 2.2);
    fill(46, 42, 39, alpha);
    circle(this.r * 0.9, -this.r * 0.08, 1);
    stroke(193, 118, 127, alpha);
    strokeWeight(1.5);
    noFill();
    bezier(-this.r, 1, -this.r * 2, 2, -this.r * 1.8, this.r, -this.r * 2.4, this.r * 0.7);
    pop();
  }

  showLifetime() {
    const progressColor = this.lifeRatio > 0.3 ? "#f5d36d" : "#ee6b54";
    noFill();
    stroke(20, 25, 21, 180);
    strokeWeight(3);
    circle(this.pos.x, this.pos.y, (this.r + 6) * 2);
    stroke(progressColor);
    strokeWeight(2);
    arc(
      this.pos.x,
      this.pos.y,
      (this.r + 6) * 2,
      (this.r + 6) * 2,
      -HALF_PI,
      -HALF_PI + TWO_PI * this.lifeRatio
    );
  }

  showLegacy() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    noStroke();
    fill('#f6d64a');
    ellipse(0, 0, 18, 14);
    fill('#fff2a8');
    ellipse(2, 3, 9, 6);
    fill('#f2a42b');
    triangle(7, -2, 14, 0, 7, 2);
    fill('#292116');
    circle(4, -3, 2);
    fill('#f6d64a');
    triangle(-5, -4, -8, -9, 0, -5);
    triangle(0, -5, 5, -10, 5, -3);
    pop();
  }
}
