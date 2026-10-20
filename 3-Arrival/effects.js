class EffectParticle extends Vehicle {
  constructor() {
    super(-1000, -1000);
    this.active = false;
    this.life = 0;
    this.maxLife = 1;
    this.tint = '#ffffff';
    this.size = 3;
    this.r = 2;
    this.drag = createVector(0, 0);
  }

  activate(x, y, tint, speed, lifetime) {
    this.pos.set(x, y);
    const angle = random(TWO_PI);
    const magnitude = random(speed * 0.35, speed);
    this.vel.set(cos(angle) * magnitude, sin(angle) * magnitude);
    this.acc.set(0, 0);
    this.tint = tint;
    this.life = this.maxLife = lifetime;
    this.size = this.r = random(2, 6);
    this.active = true;
  }

  update() {
    if (!this.active) return;
    this.drag.set(this.vel).mult(-0.03);
    this.applyForce(this.drag);
    super.update();
    this.life--;
    if (this.life <= 0) this.active = false;
  }

  show() {
    if (!this.active || !isWorldPointVisible(this.pos.x, this.pos.y, this.size)) return;
    const glow = activeQuality.glow ? glowSprites.get(this.tint) : null;
    if (glow) {
      if (activeQuality.additive) blendMode(ADD);
      image(glow, this.pos.x - this.size, this.pos.y - this.size, this.size * 2, this.size * 2);
    }
    noStroke();
    fill(this.tint + hex(Math.floor(255 * this.life / this.maxLife)).slice(-2));
    circle(this.pos.x, this.pos.y, this.size * this.life / this.maxLife);
    if (activeQuality.additive) blendMode(BLEND);
  }
}

class ParticleSystem {
  constructor(poolSize) {
    this.pool = Array.from({ length: poolSize }, () => new EffectParticle());
    this.nextParticle = 0;
  }

  burst(x, y, tint, count = 12, speed = 4, lifetime = 38) {
    const scaledCount = Math.ceil(count * activeQuality.effectScale);
    for (let index = 0; index < scaledCount; index++) {
      let particle = null;
      for (let attempt = 0; attempt < this.pool.length; attempt++) {
        const candidate = this.pool[this.nextParticle];
        this.nextParticle = (this.nextParticle + 1) % this.pool.length;
        if (!candidate.active) {
          particle = candidate;
          break;
        }
      }
      if (!particle) break;
      particle.activate(x, y, tint, speed, lifetime);
    }
  }

  resizePool(size) {
    if (this.pool.length === size) return;
    const nextPool = [];
    for (let index = 0; index < this.pool.length && nextPool.length < size; index++) {
      if (this.pool[index].active) nextPool.push(this.pool[index]);
    }
    while (nextPool.length < size) nextPool.push(new EffectParticle());
    this.pool = nextPool;
    this.nextParticle = 0;
  }

  clear() {
    for (const particle of this.pool) particle.active = false;
  }

  update() {
    for (const particle of this.pool) particle.update();
  }

  show() {
    for (const particle of this.pool) particle.show();
  }
}

class FloatingMessage {
  constructor(x, y, text, tint) {
    this.activate(x, y, text, tint);
  }

  activate(x, y, text, tint) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.tint = tint;
    this.life = 55;
    this.active = true;
    return this;
  }

  update() {
    this.y -= 0.55;
    this.life--;
  }

  show() {
    push();
    textAlign(CENTER, CENTER);
    textSize(15);
    noStroke();
    fill(this.tint + hex(Math.floor(255 * this.life / 55)).slice(-2));
    text(this.text, this.x, this.y);
    pop();
  }
}

class Shockwave extends Vehicle {
  constructor(x, y, tint, duration = 38, speed = 18) {
    super(x, y);
    this.tint = tint;
    this.life = duration;
    this.maxLife = duration;
    this.expansionSpeed = speed;
    this.radius = 0;
  }

  update() {
    this.radius += this.expansionSpeed;
    this.life--;
  }

  show() {
    if (this.life <= 0) return;
    push();
    if (activeQuality.additive) blendMode(ADD);
    noFill();
    stroke(this.tint);
    strokeWeight(Math.max(1, 5 * this.life / this.maxLife));
    circle(this.pos.x, this.pos.y, this.radius * 2);
    if (activeQuality.additive) blendMode(BLEND);
    pop();
  }
}

function createBackgroundStars(count) {
  const result = [];
  for (let index = 0; index < count; index++) {
    result.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      phase: random(TWO_PI),
      depth: random(0.015, 0.05)
    });
  }
  return result;
}

function drawAnimatedBackground() {
  const colorMix = constrain(mouseY / Math.max(height, 1), 0, 1) * 0.35;
  background(
    lerp(7, 20, colorMix),
    lerp(21, 40, colorMix),
    lerp(26, 56, colorMix)
  );
  if (backgroundTexture) image(backgroundTexture, 0, 0, width, height);
  noStroke();
  const parallaxX = mouseX - width / 2;
  const visibleStarCount = activeQuality === GAME_CONFIG.QUALITY.low ? 20
    : activeQuality === GAME_CONFIG.QUALITY.medium ? 36 : 60;
  for (let index = 0; index < visibleStarCount; index++) {
    const star = stars[index];
    const x = (star.x + parallaxX * star.depth + width) % width;
    const y = (star.y + sin(frameCount * 0.025 + star.phase) * 2 + height) % height;
    fill(170, 220, 230, 90 + 100 * (sin(frameCount * 0.04 + star.phase) + 1) / 2);
    circle(x, y, star.size);
  }
}
