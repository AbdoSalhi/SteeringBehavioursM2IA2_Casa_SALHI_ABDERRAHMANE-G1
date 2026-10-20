class TargetFuyante extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 16;
    this.color = '#ff5b5b';
    this.maxSpeed = 2;
    this.maxForce = 0.05;
    this.baseMaxSpeed = this.maxSpeed;
    this.baseMaxForce = this.maxForce;
    this.detectionRadius = 200;
    this.fleeDistance = 300;
    this.enduranceDurationMs = 2500;
    this.staminaRemainingMs = this.enduranceDurationMs;
    this.fleeing = false;
    this.escapeBlocked = false;
    this.detectedPredator = false;
    this.debugMode = false;
    this.wanderAngle = 0;
    this.lastUpdateMs = null;
  }

  nearestPredator(predators) {
    let nearest = null;
    for (const predator of predators) {
      const distance = p5.Vector.dist(this.pos, predator.pos);
      if (!nearest || distance < nearest.distance) nearest = { predator, distance };
    }
    return nearest;
  }

  updateTarget(predators, nowMs, obstacles = []) {
    const elapsed = this.lastUpdateMs === null ? 0 : Math.max(0, nowMs - this.lastUpdateMs);
    this.lastUpdateMs = nowMs;
    const nearest = this.nearestPredator(predators);
    this.detectedPredator = Boolean(nearest && nearest.distance <= this.detectionRadius);

    if (this.fleeing) {
      this.staminaRemainingMs = Math.max(0, this.staminaRemainingMs - elapsed);
      if (!nearest || nearest.distance > this.fleeDistance || this.staminaRemainingMs === 0) {
        this.fleeing = false;
        if (this.staminaRemainingMs === 0) this.escapeBlocked = true;
      }
    } else {
      this.staminaRemainingMs = Math.min(
        this.enduranceDurationMs,
        this.staminaRemainingMs + elapsed
      );
      if (this.escapeBlocked && (!nearest || nearest.distance > this.fleeDistance)) {
        this.escapeBlocked = false;
      }
    }

    if (!this.fleeing && !this.escapeBlocked && this.staminaRemainingMs > 0
        && nearest && nearest.distance <= this.detectionRadius) {
      this.fleeing = true;
    }

    this.maxSpeed = this.fleeing ? this.baseMaxSpeed * 2.5 : this.baseMaxSpeed;
    this.maxForce = this.fleeing ? this.baseMaxForce * 3 : this.baseMaxForce;
    const avoidance = obstacleAvoidanceForce(this, obstacles);
    const steering = avoidance.mag() > 0
      ? avoidance
      : this.fleeing && nearest
        ? this.flee(nearest.predator.pos)
        : targetWanderForce(this);
    this.applyForce(steering);
    this.update();
    this.edges();
  }

  show() {
    push();
    if (this.debugMode) {
      noFill();
      stroke(this.detectedPredator ? 'red' : 'yellow');
      strokeWeight(2);
      circle(this.pos.x, this.pos.y, this.detectionRadius * 2);
    }

    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 2);

    const barWidth = Math.max(32, this.r * 2);
    const barHeight = 6;
    const staminaRatio = this.enduranceDurationMs > 0
      ? constrain(this.staminaRemainingMs / this.enduranceDurationMs, 0, 1)
      : 0;
    const barX = this.pos.x - barWidth / 2;
    const barY = this.pos.y - this.r - 13;
    fill(35, 35, 45);
    rect(barX, barY, barWidth, barHeight, 3);
    fill(this.fleeing ? '#ffb347' : '#70e090');
    rect(barX, barY, barWidth * staminaRatio, barHeight, 3);
    pop();
  }
}
