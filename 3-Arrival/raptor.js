class Raptor extends Vehicle {
  constructor(x, y, level) {
    super(x, y);
    this.level = level;
    this.r = 18;
    this.maxSpeed = 2.1 + level * 0.18;
    this.maxForce = 0.11 + Math.min(level, 8) * 0.012;
    this.targetLocked = false;
    this.spawnScale = 0;
    this.seekForce = createVector(0, 0);
    this.avoidForce = createVector(0, 0);
  }

  update(target, obstacles, now) {
    const dx = this.pos.x - target.pos.x;
    const dy = this.pos.y - target.pos.y;
    this.targetLocked = dx * dx + dy * dy < GAME_CONFIG.raptorLoseDistance ** 2;
    this.seekForce = this.targetLocked ? this.pursue(target) : this.wander();
    this.avoidForce = obstacleAvoidance(this, obstacles, 110);
    this.applyForce(this.avoidForce.magSq() > 0.001 ? this.avoidForce : this.seekForce);
    this.applyForce(boundaryForce(this, 36));
    this.acc.limit(this.maxForce);
    super.update();
    this.spawnScale = Math.min(1, this.spawnScale + 0.06);
    this.lastUpdatedAt = now;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    scale(this.spawnScale);
    if (this.vel.mag() > 0.1) rotate(this.vel.heading());
    noStroke();
    fill('#332b49');
    ellipse(0, 0, this.r * 2.1, this.r * 1.35);
    fill('#76659c');
    triangle(-this.r, 0, -this.r * 1.6, -this.r * 0.35, -this.r * 1.1, this.r * 0.42);
    fill('#d9bd68');
    circle(this.r * 0.25, -this.r * 0.22, 5);
    circle(this.r * 0.25, this.r * 0.22, 5);
    fill('#171421');
    circle(this.r * 0.3, -this.r * 0.22, 2);
    circle(this.r * 0.3, this.r * 0.22, 2);
    fill('#df984b');
    triangle(this.r * 0.75, -3, this.r * 1.35, 0, this.r * 0.75, 3);
    pop();
  }
}
