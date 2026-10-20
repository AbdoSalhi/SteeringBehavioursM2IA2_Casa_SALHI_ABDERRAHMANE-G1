const BOT_FOOD_BUFFER = [];

class SnakeBot extends Snake {
  constructor(x, y, index) {
    super(x, y);
    this.name = random(GAME_CONFIG.botNames);
    this.name += ` ${index + 1}`;
    this.color = random(GAME_CONFIG.botColors);
    this.skin = random(['circle', 'stripes']);
    this.botId = index;
    const initialTargetRadius = GAME_CONFIG.botWanderRadius * 2 / 3;
    this.aiTarget = createVector(x + random(-initialTargetRadius, initialTargetRadius), y + random(-initialTargetRadius, initialTargetRadius));
    this.targetRefreshAt = 0;
    this.isBot = true;
    this.kills = 0;
    this.boosting = false;
    this.cachedSteering = createVector(0, 0);
    this.threatDirection = createVector(0, 0);
    this.vel.set(random(-1, 1), random(-1, 1)).setMag(this.maxSpeed);
    for (const segment of this.segments) segment.visible = true;
  }

  chooseTarget(now, foods, largerSnakes, grid) {
    if (now < this.targetRefreshAt) return;
    this.targetRefreshAt = now + random(GAME_CONFIG.botTargetMinMs, GAME_CONFIG.botTargetMaxMs);
    let threat = null;
    let threatDistance = GAME_CONFIG.botThreatRadius * GAME_CONFIG.botThreatRadius;
    let prey = null;
    let preyDistance = GAME_CONFIG.botPreyRadius * GAME_CONFIG.botPreyRadius;
    for (const other of largerSnakes) {
      if (other === this || other.dead) continue;
      const dx = other.pos.x - this.pos.x;
      const dy = other.pos.y - this.pos.y;
      const distance = dx * dx + dy * dy;
      if (distance < threatDistance && other.length > this.length * GAME_CONFIG.botThreatLengthRatio) {
        threat = other;
        threatDistance = distance;
      } else if (distance < preyDistance && this.length > other.length * GAME_CONFIG.botPreyLengthRatio) {
        prey = other;
        preyDistance = distance;
      }
    }
    if (threat) {
      this.threatDirection.set(this.pos).sub(threat.pos);
      if (this.threatDirection.magSq() < 1) this.threatDirection.set(1, 0);
      this.threatDirection.setMag(420);
      this.aiTarget.set(this.pos).add(this.threatDirection);
      return;
    }
    if (prey) {
      this.aiTarget.set(
        prey.pos.x + prey.vel.x * GAME_CONFIG.botCutLeadFrames,
        prey.pos.y + prey.vel.y * GAME_CONFIG.botCutLeadFrames
      );
      return;
    }

    let nearest = null;
    let nearestDistance = Infinity;
    grid.queryInto(this.pos, GAME_CONFIG.botFoodRadius, BOT_FOOD_BUFFER);
    for (const orb of BOT_FOOD_BUFFER) {
      if (orb.consumed) continue;
      const dx = orb.pos.x - this.pos.x;
      const dy = orb.pos.y - this.pos.y;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance && distance < GAME_CONFIG.botFoodRadius * GAME_CONFIG.botFoodRadius) {
        nearest = orb;
        nearestDistance = distance;
      }
    }
    if (nearest) {
      this.aiTarget.set(nearest.pos);
      return;
    }
    this.aiTarget.set(
      constrain(this.pos.x + random(-GAME_CONFIG.botWanderRadius, GAME_CONFIG.botWanderRadius), 100, GAME_CONFIG.worldWidth - 100),
      constrain(this.pos.y + random(-GAME_CONFIG.botWanderRadius, GAME_CONFIG.botWanderRadius), 100, GAME_CONFIG.worldHeight - 100)
    );
  }

  updateBot(now, foods, largerSnakes, grid, currentFrame = frameCount) {
    if (currentFrame % activeQuality.botDecisionFrames === this.botId % activeQuality.botDecisionFrames) {
      this.chooseTarget(now, foods, largerSnakes, grid);
      const boundary = Math.min(
        this.pos.x,
        this.pos.y,
        GAME_CONFIG.worldWidth - this.pos.x,
        GAME_CONFIG.worldHeight - this.pos.y
      );
      this.boosting = boundary > 180 && this.vel.magSq() < this.maxSpeed * this.maxSpeed * 0.5625 && random() < 0.003;
      this.cachedSteering.set(0, 0);
      this.cachedSteering.add(worldBoundaryForce(this, 180));
      const avoidance = obstacleAvoidance(this, obstacles, 130).mult(GAME_CONFIG.obstacleWeight);
      this.cachedSteering.add(avoidance).limit(this.maxForce);
    }
    this.applyForce(this.cachedSteering);
    this.acc.limit(this.maxForce);
    this.update(this.aiTarget);
  }
}
