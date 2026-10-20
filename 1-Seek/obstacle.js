class Obstacle extends Vehicle {
  constructor(x, y, radius = 24) {
    super(x, y);
    this.r = radius;
    this.vel.set(0, 0);
    this.maxSpeed = 0;
    this.maxForce = 0;
  }

  show() {
    push();
    fill('#293244');
    stroke('#e5e9f0');
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}

function obstacleAvoidanceForce(vehicle, obstacles) {
  const speed = vehicle.vel.mag();
  let heading;
  if (speed > 0.001) {
    heading = vehicle.vel.copy().div(speed);
  } else {
    heading = createVector(1, 0);
  }

  const lookAhead = Math.max(60, vehicle.r * 2 + speed * 18);
  let threat = null;

  for (const obstacle of obstacles) {
    const offset = p5.Vector.sub(obstacle.pos, vehicle.pos);
    const forwardDistance = offset.dot(heading);
    if (forwardDistance < 0 || forwardDistance > lookAhead) continue;

    const closestPoint = p5.Vector.add(vehicle.pos, heading.copy().mult(forwardDistance));
    const lateralDistance = p5.Vector.dist(obstacle.pos, closestPoint);
    const clearance = obstacle.r + vehicle.r * 0.55;
    if (lateralDistance >= clearance) continue;

    const danger = (clearance - lateralDistance) / clearance;
    if (!threat || forwardDistance < threat.forwardDistance) {
      threat = { obstacle, forwardDistance, lateralDistance, clearance, danger };
    }
  }

  if (!threat) return createVector(0, 0);

  const offset = p5.Vector.sub(threat.obstacle.pos, vehicle.pos);
  const side = heading.x * offset.y - heading.y * offset.x;
  const turnDirection = side >= 0 ? -1 : 1;
  const desiredVelocity = createVector(-heading.y * turnDirection, heading.x * turnDirection)
    .mult(vehicle.maxSpeed);
  const steering = desiredVelocity.sub(vehicle.vel);
  steering.mult(Math.min(1, threat.danger * 2));
  return steering.limit(vehicle.maxForce);
}

function createRandomObstacles(count, w, h, target, rng = Math.random) {
  if (!Number.isInteger(count) || count < 0 || count > 30) {
    throw new RangeError('Le nombre d’obstacles doit être un entier entre 0 et 30.');
  }

  const obstacles = [];
  for (let index = 0; index < count; index++) {
    const radius = 14 + rng() * 20;
    let position = { x: w / 2, y: h / 2 };
    let validPosition = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      position = {
        x: radius + rng() * Math.max(0, w - radius * 2),
        y: radius + rng() * Math.max(0, h - radius * 2)
      };
      if (p5.Vector.dist(createVector(position.x, position.y), target.pos) > target.r + radius + 50) {
        validPosition = true;
        break;
      }
    }
    if (!validPosition) {
      for (let y = radius; y <= h - radius && !validPosition; y += radius * 2) {
        for (let x = radius; x <= w - radius; x += radius * 2) {
          position = { x, y };
          if (p5.Vector.dist(createVector(x, y), target.pos) > target.r + radius + 50) {
            validPosition = true;
            break;
          }
        }
      }
    }
    obstacles.push(new Obstacle(position.x, position.y, radius));
  }
  return obstacles;
}
