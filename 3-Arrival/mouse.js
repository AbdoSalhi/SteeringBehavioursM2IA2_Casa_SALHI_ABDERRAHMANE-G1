const MOUSE_NEIGHBOR_BUFFER = [];

class Mouse extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.kind = 'normal';
    this.r = 8;
    this.baseSpeed = 2.2;
    this.maxSpeed = this.baseSpeed;
    this.maxForce = 0.12;
    this.vel = p5.Vector.random2D().mult(this.maxSpeed * 0.6);
    this.spawnScale = 0;
    this.captureGrowth = 1;
    this.scoreBonus = 1;
    this.tint = '#aaa39a';
    this.debugFlee = createVector(0, 0);
    this.debugSeparation = createVector(0, 0);
    this.debugCohesion = createVector(0, 0);
    this.debugAlignment = createVector(0, 0);
    this.debugAvoidance = createVector(0, 0);
    this.flockSeparation = createVector(0, 0);
    this.flockAlignment = createVector(0, 0);
    this.flockCohesion = createVector(0, 0);
    this.neighborDirection = createVector(0, 0);
    this.desiredVelocity = createVector(0, 0);
  }

  update(snake, grid, obstacles, now) {
    this.maxSpeed = this.baseSpeed * (1 + Math.max(0, wave - 1) * 0.07);
    const dxToSnake = this.pos.x - snake.pos.x;
    const dyToSnake = this.pos.y - snake.pos.y;
    const distanceSqToSnake = dxToSnake * dxToSnake + dyToSnake * dyToSnake;
    const fleeRadiusSq = GAME_CONFIG.mouseFleeRadius * GAME_CONFIG.mouseFleeRadius;
    this.debugFlee = distanceSqToSnake < fleeRadiusSq
      ? fleeForce(this, snake)
      : this.wander();
    this.debugAvoidance = obstacleAvoidance(this, obstacles, 75);

    if (this.debugAvoidance.magSq() > 0.001) {
      this.applyForce(this.debugAvoidance);
    } else {
      this.applyForce(this.debugFlee.mult(distanceSqToSnake < fleeRadiusSq ? GAME_CONFIG.fleeWeight : 0.45));
      if (magnetUntil > now && distanceSqToSnake < 260 * 260) {
        this.neighborDirection.set(snake.pos.x - this.pos.x, snake.pos.y - this.pos.y);
        if (this.neighborDirection.magSq() > 0.001) {
          this.neighborDirection.setMag(this.maxSpeed * 0.8);
          this.neighborDirection.sub(this.vel).limit(this.maxForce);
          this.applyForce(this.neighborDirection);
        }
      } else {
        this.applyFlocking(grid);
      }
    }
    this.applyForce(boundaryForce(this, 42));
    this.acc.limit(this.maxForce);
    super.update();
    this.spawnScale = Math.min(1, this.spawnScale + 0.08);
  }

  applyFlocking(grid) {
    grid.queryInto(this.pos, GAME_CONFIG.flockRadius, MOUSE_NEIGHBOR_BUFFER);
    this.flockSeparation.set(0, 0);
    this.flockAlignment.set(0, 0);
    this.flockCohesion.set(0, 0);
    let count = 0;
    const flockRadiusSq = GAME_CONFIG.flockRadius * GAME_CONFIG.flockRadius;
    const separationRadiusSq = flockRadiusSq * 0.3025;

    for (const neighbor of MOUSE_NEIGHBOR_BUFFER) {
      if (neighbor === this) continue;
      const dx = this.pos.x - neighbor.pos.x;
      const dy = this.pos.y - neighbor.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > flockRadiusSq || distanceSq < 0.000001) continue;
      count++;
      this.flockAlignment.add(neighbor.vel);
      this.flockCohesion.add(neighbor.pos);
      if (distanceSq < separationRadiusSq) {
        this.neighborDirection.set(dx, dy).mult(1 / Math.sqrt(distanceSq));
        this.flockSeparation.add(this.neighborDirection);
      }
    }

    if (count === 0) return;
    this.flockAlignment.div(count).add(this.pos);
    this.flockCohesion.div(count);
    this.debugAlignment = this.steerTowards(this.flockAlignment, this.debugAlignment);
    this.debugCohesion = this.steerTowards(this.flockCohesion, this.debugCohesion);
    this.flockSeparation.add(this.pos);
    this.debugSeparation = this.flockSeparation.magSq() > 0
      ? this.steerTowards(this.flockSeparation, this.debugSeparation)
      : this.debugSeparation.set(0, 0);
    this.applyForce(this.debugAlignment.mult(GAME_CONFIG.alignmentWeight));
    this.applyForce(this.debugCohesion.mult(GAME_CONFIG.cohesionWeight));
    this.applyForce(this.debugSeparation.mult(GAME_CONFIG.separationWeight));
  }

  steerTowards(target, result) {
    this.desiredVelocity.set(target.x - this.pos.x, target.y - this.pos.y);
    if (this.desiredVelocity.magSq() === 0) return result.set(0, 0);
    this.desiredVelocity.setMag(this.maxSpeed);
    return result.set(this.desiredVelocity).sub(this.vel).limit(this.maxForce);
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    scale(this.spawnScale);
    if (this.vel.mag() > 0.1) rotate(this.vel.heading());
    if (this.kind === 'golden' && activeQuality.glow && activeQuality.additive) {
      blendMode(ADD);
    }
    noStroke();
    fill(this.tint);
    ellipse(0, 0, 17, 11);
    ellipse(6, -1, 8, 7);
    fill(this.kind === 'golden' ? '#fff1ac' : '#c9c2b7');
    ellipse(-4, -6, 6, 7);
    ellipse(1, -6, 6, 7);
    fill('#191817');
    circle(8, -2, 2);
    if (this.kind === 'toxic') {
      fill('#baff74');
      circle(-1, 0, 5);
    } else if (this.kind === 'icy') {
      fill('#c9f4ff');
      circle(1, 0, 4);
    } else if (this.kind === 'magnet') {
      noFill();
      stroke('#e18cff');
      strokeWeight(2);
      arc(0, 0, 17, 17, PI, TWO_PI);
    }
    stroke('#c9c2b7');
    strokeWeight(1.5);
    noFill();
    bezier(-8, 1, -14, 0, -13, 8, -20, 6);
    pop();
    if (activeQuality.additive) blendMode(BLEND);
  }
}

class GoldenMouse extends Mouse {
  constructor(x, y) {
    super(x, y);
    this.kind = 'golden';
    this.baseSpeed = 4.1;
    this.maxSpeed = this.baseSpeed;
    this.captureGrowth = 3;
    this.scoreBonus = 5;
    this.tint = '#ffd84d';
  }
}

class IcyMouse extends Mouse {
  constructor(x, y) {
    super(x, y);
    this.kind = 'icy';
    this.tint = '#91e4ff';
  }
}

class ToxicMouse extends Mouse {
  constructor(x, y) {
    super(x, y);
    this.kind = 'toxic';
    this.tint = '#8dd95b';
    this.captureGrowth = -2;
    this.scoreBonus = 0;
  }
}

class MagnetMouse extends Mouse {
  constructor(x, y) {
    super(x, y);
    this.kind = 'magnet';
    this.tint = '#d69bff';
  }
}

function createMouse(x, y, level) {
  const toxicChance = Math.min(0.42, GAME_CONFIG.toxicBaseChance + Math.max(0, level - 1) * 0.035);
  const roll = random();
  if (roll < GAME_CONFIG.goldenChance) return new GoldenMouse(x, y);
  if (roll < GAME_CONFIG.goldenChance + GAME_CONFIG.magnetChance) return new MagnetMouse(x, y);
  if (roll < GAME_CONFIG.goldenChance + GAME_CONFIG.magnetChance + GAME_CONFIG.icyChance) return new IcyMouse(x, y);
  if (roll < GAME_CONFIG.goldenChance + GAME_CONFIG.magnetChance + GAME_CONFIG.icyChance + toxicChance) {
    return new ToxicMouse(x, y);
  }
  return new Mouse(x, y);
}
