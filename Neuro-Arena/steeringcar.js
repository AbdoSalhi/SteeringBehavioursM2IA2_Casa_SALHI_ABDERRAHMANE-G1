class SteeringCar {
  constructor(start = createVector(0, 0), config = { maxspeed: 5, maxforce: 0.35 }) {
    this.config = config;
    this.pos = start.copy();
    this.vel = createVector(1, 0);
    this.acc = createVector();
    this.maxspeed = config.maxspeed;
    this.maxforce = config.maxforce;
    this.score = 0;
    this.dead = false;
    this.finished = false;
    this.index = 0;
    this.counter = 0;
    this.lapsCompleted = 0;
    this.trail = [];
  }

  applyForce(force) {
    this.acc.add(force);
  }

  avoidWalls() {
    let force = createVector();
    if (!track || !track.walls) {
      return force;
    }

    for (let i = 0; i < track.walls.length; i++) {
      const wall = track.walls[i];
      const segmentDistance = distanceToSegment(wall.a, wall.b, this.pos.x, this.pos.y);
      if (segmentDistance < 60) {
        const close = wall.midpoint();
        const away = p5.Vector.sub(this.pos, close);
        away.normalize();
        away.mult((60 - segmentDistance) * 0.08);
        force.add(away);
      }
    }
    return force.limit(this.maxforce * 1.5);
  }

  update() {
    if (this.dead || this.finished) {
      return;
    }

    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed);
    this.acc.mult(0);
    this.counter++;

    if (this.counter > LIFESPAN) {
      this.dead = true;
    }
  }

  check(checkpoints) {
    if (this.finished) {
      return;
    }

    const goal = checkpoints[this.index];
    const d = distanceToSegment(goal.a, goal.b, this.pos.x, this.pos.y);
    if (d < 8) {
      const previousIndex = this.index;
      this.index = (this.index + 1) % checkpoints.length;
      this.score++;
      if (previousIndex === checkpoints.length - 1 && this.index === 0) {
        this.lapsCompleted++;
      }
      this.counter = 0;
    }
  }

  step() {
    if (!track) {
      return;
    }

    const target = track.checkpoints[this.index].midpoint();
    const desired = p5.Vector.sub(target, this.pos);
    desired.setMag(this.maxspeed);
    const steering = p5.Vector.sub(desired, this.vel);
    steering.limit(this.maxforce);
    const pushAway = this.avoidWalls();
    const force = p5.Vector.add(steering, pushAway);
    force.limit(this.maxforce);
    this.applyForce(force);
    this.update();
    this.check(track.checkpoints);
  }

  show() {
    if (this.dead || this.finished) {
      return;
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    noStroke();
    fill(255, 220);
    beginShape();
    vertex(12, 0);
    vertex(-10, 6);
    vertex(-8, 0);
    vertex(-10, -6);
    endShape(CLOSE);
    pop();
  }
}
