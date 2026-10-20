class TrafficCar {
  constructor(start, speed = 2.3) {
    this.pos = start.copy();
    this.vel = createVector(1, 0);
    this.acc = createVector();
    this.maxspeed = speed;
    this.maxforce = 0.2;
    this.dead = false;
    this.target = null;
    this.radius = 12;
  }

  setTarget(vehicle) {
    if (vehicle) {
      this.target = vehicle;
    }
  }

  pursue() {
    if (!this.target || this.target.dead) {
      return;
    }

    const targetPos = this.target.pos.copy();
    const predicted = p5.Vector.add(targetPos, p5.Vector.mult(this.target.vel, 8));
    const desired = p5.Vector.sub(predicted, this.pos);
    desired.setMag(this.maxspeed);
    const steering = p5.Vector.sub(desired, this.vel);
    steering.limit(this.maxforce);
    this.acc.add(steering);
  }

  update() {
    if (this.dead) {
      return;
    }

    this.pursue();
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed);
    this.acc.mult(0);

    if (this.target) {
      const d = p5.Vector.dist(this.pos, this.target.pos);
      if (d < this.radius + 12) {
        this.target.dead = true;
        this.dead = true;
      }
    }
  }

  show() {
    if (this.dead) {
      return;
    }

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    noStroke();
    fill(255, 50, 60, 220);
    beginShape();
    vertex(12, 0);
    vertex(-10, 6);
    vertex(-8, 0);
    vertex(-10, -6);
    endShape(CLOSE);
    pop();
  }
}

function generateTraffic() {
  const cars = [];
  if (!track || !trafficCheckbox || !trafficCheckbox.checked()) {
    return cars;
  }

  const candidates = [];
  speciesStates.forEach((species) => {
    const champion = getChampion(species);
    if (champion) {
      candidates.push(champion);
    }
  });

  const targets = candidates.sort((a, b) => b.score - a.score).slice(0, 3);
  for (let i = 0; i < Math.min(3, targets.length); i++) {
    const angle = (i / Math.max(1, targets.length)) * TWO_PI;
    const start = p5.Vector.add(track.start, p5.Vector.fromAngle(angle + i).mult(120));
    const car = new TrafficCar(start, 2.4 + i * 0.2);
    car.setTarget(targets[i]);
    cars.push(car);
  }
  return cars;
}
