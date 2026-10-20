function targetWanderForce(target) {
  target.wanderAngle += random(-0.04, 0.04);
  const heading = target.vel.heading();
  const circleCenter = createVector(
    target.pos.x + cos(heading) * 40,
    target.pos.y + sin(heading) * 40
  );
  const wanderPoint = createVector(
    circleCenter.x + cos(heading + target.wanderAngle) * 32,
    circleCenter.y + sin(heading + target.wanderAngle) * 32
  );
  return target.seek(wanderPoint);
}

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = 16;
    this.color = 'red';
    this.maxSpeed = 2;
    this.maxForce = 0.05;
    this.wanderAngle = 0;
  }

  update(obstacles = []) {
    const avoidance = obstacleAvoidanceForce(this, obstacles);
    this.applyForce(avoidance.mag() > 0 ? avoidance : targetWanderForce(this));
    super.update();
    this.edges();
  }

  show() {
    push();
    fill(this.color);
    noStroke();
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }

  respawn(w, h) {
    this.pos.set(random(w), random(h));
    this.vel.set(0, 0);
    this.acc.set(0, 0);
  }
}