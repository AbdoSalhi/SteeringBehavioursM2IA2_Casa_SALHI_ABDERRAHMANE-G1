class Vehicle {
  constructor(brain, config = SPECIES_CONFIG[1], start = createVector(0, 0)) {
    this.config = config;
    this.maxspeed = config.maxspeed;
    this.maxforce = config.maxforce;
    this.sight = SIGHT;
    this.pos = start.copy();
    this.vel = createVector(1, 0);
    this.acc = createVector();
    this.rays = [];
    this.score = 0;
    this.fitness = 0;
    this.dead = false;
    this.finished = false;
    this.index = 0;
    this.counter = 0;
    this.lapsCompleted = 0;
    this.trail = [];
    this.brain = brain ? brain.copy() : new NeuralNetwork(config.nbRays, config.hidden, 2);

    for (let i = 0; i < config.nbRays; i++) {
      const angle = config.nbRays === 1 ? 0 : -config.fov / 2 + i * (config.fov / (config.nbRays - 1));
      this.rays.push(new Ray(this.pos, radians(angle)));
    }
  }

  dispose() {
    if (this.brain && !this.brain.disposed) {
      this.brain.dispose();
    }
    this.brain = null;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  mutate() {
    this.brain.mutate(this.config.mutationRate);
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

    for (let i = 0; i < this.rays.length; i++) {
      this.rays[i].rotate(this.vel.heading());
      this.rays[i].pos = this.pos.copy();
    }
  }

  calculateFitness() {
    this.fitness = 1 + this.score * 10 + this.lapsCompleted * 100;
    return this.fitness;
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

  look(walls, movingHazards = []) {
    const hazards = walls.concat(movingHazards);
    const inputs = [];

    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let record = this.sight;
      let closest = null;

      for (let j = 0; j < hazards.length; j++) {
        const hazard = hazards[j];
        if (hazard instanceof Boundary) {
          const hit = ray.cast(hazard);
          if (hit) {
            const d = p5.Vector.dist(this.pos, hit);
            if (d < record) {
              record = d;
              closest = hit;
            }
          }
        } else if (hazard && typeof hazard.getClosestPoint === "function") {
          const hit = hazard.getClosestPoint(this.pos, ray);
          if (hit) {
            const d = p5.Vector.dist(this.pos, hit);
            if (d < record) {
              record = d;
              closest = hit;
            }
          }
        }
      }

      if (record < 7) {
        this.dead = true;
      }

      inputs.push(constrain(map(record, 0, this.sight, 1, 0), 0, 1));
      if (closest) {
        // Debug visuel si nécessaire, conservé silencieux pour éviter le bruit dans la console.
      }
    }

    const output = this.brain.predict(inputs);
    const angle = map(output[0], 0, 1, -PI, PI) + this.vel.heading();
    const speed = map(output[1], 0, 1, 0, this.maxspeed);
    const desired = p5.Vector.fromAngle(angle).setMag(speed);
    let steering = p5.Vector.sub(desired, this.vel);
    steering.limit(this.maxforce);
    return steering;
  }

  show() {
    if (this.dead || this.finished) {
      return;
    }

    this.trail.push(this.pos.copy());
    if (this.trail.length > 20) {
      this.trail.shift();
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    stroke(255, 200);
    strokeWeight(1.5);
    noFill();
    if (this.trail.length > 1) {
      beginShape();
      this.trail.forEach((point) => {
        vertex(point.x - this.pos.x, point.y - this.pos.y);
      });
      endShape();
    }

    fill(this.config.color[0], this.config.color[1], this.config.color[2]);
    stroke(255, 120);
    beginShape();
    vertex(10, 0);
    vertex(-8, 5);
    vertex(-6, 0);
    vertex(-8, -5);
    endShape(CLOSE);
    pop();
  }
}
