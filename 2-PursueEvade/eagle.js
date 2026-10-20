class Eagle extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 20;
    this.maxSpeed = 5;
    this.maxForce = 0.25;
    this.etat = "patrouille";
    this.retreatUntilMs = 0;
    this.attackOccurred = false;
    this.lastForces = null;
  }

  applyBehaviors(snake, obstacles) {
    const nowMs = typeof millis === "function" ? millis() : 0;
    const tete = snake && snake.head ? snake.head : null;
    this.attackOccurred = false;

    // Un buisson coupe immédiatement la poursuite et la retraite.
    if (tete && tete.hidden) {
      this.etat = "patrouille";
      this.retreatUntilMs = 0;
    }

    const dx = tete ? tete.pos.x - this.pos.x : Infinity;
    const dy = tete ? tete.pos.y - this.pos.y : Infinity;
    const distanceSq = dx * dx + dy * dy;
    const vitesseMax = Number.isFinite(tete && tete.maxSpeed)
      ? (Number.isFinite(tete.baseMaxSpeed) ? tete.baseMaxSpeed : tete.maxSpeed)
      : 0;
    const vitesseSq = tete ? tete.vel.x * tete.vel.x + tete.vel.y * tete.vel.y : Infinity;
    const menace = tete && !tete.hidden &&
      distanceSq < 400 * 400 &&
      (snake.segments.length > 30 || vitesseSq < vitesseMax * vitesseMax * 0.16);
    const rayonContact = tete ? this.r + tete.r : 0;

    if (tete && !tete.hidden && distanceSq <= rayonContact * rayonContact &&
      typeof snake.takeDamage === "function" &&
      snake.takeDamage(30, 4, nowMs)) {
      this.attackOccurred = true;
      this.etat = "retraite";
      this.retreatUntilMs = nowMs + 3000;
    }

    const forceEvitement = this.avoid(obstacles).mult(4);
    const forceBordure = this.boundaries().mult(1.5);
    let forceErrance = null;
    let forceCible = null;

    if (tete && !tete.hidden && this.retreatUntilMs > nowMs) {
      this.etat = "retraite";
      forceCible = this.flee(tete).mult(2);
    } else {
      this.retreatUntilMs = 0;
      if (menace && tete && !tete.hidden) {
        this.etat = "attaque";
        forceCible = this.pursuePerfect(tete).mult(2);
      } else {
        this.etat = "patrouille";
      }
    }

    if (!forceCible) {
      forceErrance = this.wander();
    }
    this.applyForce(forceEvitement);
    this.applyForce(forceBordure);
    if (forceCible) {
      this.applyForce(forceCible);
    } else {
      this.applyForce(forceErrance);
    }
    this.lastForces = {
      avoid: forceEvitement.copy(),
      boundaries: forceBordure.copy(),
      target: forceCible && forceCible.copy(),
      wander: forceCible ? null : forceErrance.copy()
    };
    this.update();
  }

  show() {
    const angle = this.vel.mag() > 1e-6 ? this.vel.heading() : 0;
    const battement = Math.sin(frameCount * 0.35) * 5;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(angle);

    noStroke();
    fill(0, 0, 0, 45);
    ellipse(3, 6, 48, 29);

    fill("#382f27");
    ellipse(0, 0, 27, 18);
    ellipse(12, 0, 15, 13);
    fill("#473a2e");
    ellipse(-2, -13 - battement, 31, 12);
    ellipse(-2, 13 + battement, 31, 12);
    fill("#59483a");
    triangle(18, -3, 27, 0, 18, 3);

    fill("#d6bd83");
    circle(14, -4, 3);
    circle(14, 4, 3);
    fill("#1e1b18");
    circle(14.5, -4, 1.4);
    circle(14.5, 4, 1.4);

    if (debug) {
      noFill();
      stroke("#ff8066");
      strokeWeight(1);
      circle(0, 0, 800);
      if (this.lastForces && this.lastForces.target) {
        drawArrow(this.pos, this.lastForces.target.copy().mult(80), "#ff8066");
      }
    }
    pop();
  }
}
