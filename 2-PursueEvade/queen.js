class Queen extends Hen {
  constructor(x, y) {
    super(x, y);
    this.r = 20;
    this.maxSpeed = 2.8;
    this.vitesseNormale = this.maxSpeed;
    this.maxForce = 0.18;
    this.rayonDetection = 180;
    this.captured = false;
  }

  applyBehaviors(snake, obstacles, hens, decoys = [], zones = []) {
    const forceEvitement = this.avoid(obstacles).mult(this.avoidWeight);
    const tete = snake && snake.head && !snake.head.hidden ? snake.head : null;
    const dx = tete ? this.pos.x - tete.pos.x : Infinity;
    const dy = tete ? this.pos.y - tete.pos.y : Infinity;
    const fuitSerpent = tete && dx * dx + dy * dy < 180 * 180;
    let forceFuite = null;
    let forceErrance = null;

    this.maxSpeed = this.vitesseNormale;
    this.applyForce(forceEvitement);
    if (fuitSerpent) {
      this.etat = "flee";
      forceFuite = this.evade(tete).mult(2);
      this.applyForce(forceFuite);
    } else {
      this.etat = "wander";
      forceErrance = this.wander();
      this.applyForce(forceErrance);
    }

    this.lastForces = {
      avoid: forceEvitement.copy(),
      separate: createVector(0, 0),
      align: createVector(0, 0),
      cohesion: createVector(0, 0),
      boundaries: createVector(0, 0),
      flee: forceFuite && forceFuite.copy(),
      decoy: null,
      wander: forceErrance && forceErrance.copy(),
      pond: null,
      targetDecoy: null
    };
    this.speedFactor(zones, this.vitesseNormale);
    this.update();
  }

  show() {
    super.show();
    const angle = this.vel.mag() > 0.01 ? this.vel.heading() : -Math.PI / 2;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(angle);
    noStroke();
    fill("#d6a62d");
    rect(-this.r * 0.15, -this.r * 0.9, this.r * 1.3, this.r * 0.2, 3);
    fill("#f5d66c");
    triangle(-this.r * 0.1, -this.r * 0.8, this.r * 0.1, -this.r * 1.55, this.r * 0.38, -this.r * 0.8);
    triangle(this.r * 0.3, -this.r * 0.8, this.r * 0.65, -this.r * 1.7, this.r * 0.9, -this.r * 0.8);
    triangle(this.r * 0.75, -this.r * 0.8, this.r * 1.05, -this.r * 1.5, this.r * 1.25, -this.r * 0.8);
    fill("#fff0a3");
    circle(this.r * 0.65, -this.r * 1.15, this.r * 0.2);
    pop();
  }
}
