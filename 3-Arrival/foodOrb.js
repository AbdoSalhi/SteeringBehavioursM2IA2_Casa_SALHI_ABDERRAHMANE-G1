class FoodOrb extends Vehicle {
  constructor(x, y, value = 1, tint = null, scatter = false) {
    super(x, y);
    this.steering = createVector(0, 0);
    this.activate(x, y, value, tint, scatter);
  }

  activate(x, y, value = 1, tint = null, scatter = false) {
    this.pos.set(x, y);
    this.vel.set(0, 0);
    this.acc.set(0, 0);
    this.value = value;
    this.r = value > 1 ? 7 : 4;
    this.tint = tint || random(GAME_CONFIG.foodColors);
    this.maxSpeed = scatter ? random(2, 6) : 0;
    this.maxForce = 0.18;
    this.life = scatter ? 90 : Infinity;
    this.spawnAt = millis();
    this.phase = random(TWO_PI);
    this.scattered = scatter;
    this.consumed = false;
    this.inPool = false;
    return this;
  }

  update(player, now) {
    if (this.scattered) {
      if (this.maxSpeed > 0) {
        this.steering.set(this.vel).mult(-0.07).limit(this.maxForce);
        this.applyForce(this.steering);
        this.acc.limit(this.maxForce);
        super.update();
        this.maxSpeed = Math.max(0, this.maxSpeed * 0.965);
      }
      this.life--;
    } else if (player) {
      const dx = player.pos.x - this.pos.x;
      const dy = player.pos.y - this.pos.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < GAME_CONFIG.foodAttractionRadius ** 2 && distanceSq > 0.01) {
        const ratio = Math.sqrt(distanceSq) / GAME_CONFIG.foodAttractionRadius;
        this.steering.set(dx, dy).setMag(0.28 - ratio * 0.245);
        this.applyForce(this.steering);
        this.acc.limit(this.maxForce);
        super.update();
        this.vel.mult(0.82);
      }
    }
    return this.life > 0;
  }

  show() {
    const pulse = activeQuality.glow ? 0.82 + 0.18 * sin(millis() * 0.006 + this.phase) : 1;
    const diameter = this.r * 2 * pulse;
    const glow = activeQuality.glow ? glowSprites.get(this.tint) : null;
    if (glow) {
      if (activeQuality.additive) blendMode(ADD);
      image(glow, this.pos.x - diameter * 2, this.pos.y - diameter * 2, diameter * 4, diameter * 4);
    }
    noStroke();
    fill(this.tint);
    circle(this.pos.x, this.pos.y, diameter);
    if (activeQuality.glow) {
      fill(255, 255, 255, 190);
      circle(this.pos.x - this.r * 0.2, this.pos.y - this.r * 0.2, diameter * 0.35);
    }
    if (activeQuality.additive) blendMode(BLEND);
  }
}

const FOOD_ORB_POOL = [];

function createFoodOrb(x, y, value = 1, tint = null, scatter = false) {
  const orb = FOOD_ORB_POOL.pop();
  return orb ? orb.activate(x, y, value, tint, scatter) : new FoodOrb(x, y, value, tint, scatter);
}

function releaseFoodOrb(orb) {
  if (orb.inPool) return;
  orb.inPool = true;
  orb.consumed = true;
  if (FOOD_ORB_POOL.length < GAME_CONFIG.QUALITY.high.orbs) FOOD_ORB_POOL.push(orb);
}

function createFoodField(count, result = []) {
  result.length = 0;
  for (let index = 0; index < count; index++) {
    const angle = random(TWO_PI);
    const distance = Math.sqrt(random()) * 2400;
    result.push(createFoodOrb(
      constrain(GAME_CONFIG.worldWidth / 2 + cos(angle) * distance, 80, GAME_CONFIG.worldWidth - 80),
      constrain(GAME_CONFIG.worldHeight / 2 + sin(angle) * distance, 80, GAME_CONFIG.worldHeight - 80)
    ));
  }
  return result;
}
