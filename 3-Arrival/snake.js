class Snake extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = GAME_CONFIG.snakeSpeed;
    this.maxForce = GAME_CONFIG.snakeMaxForce;
    this.r = GAME_CONFIG.snakeSize;
    this.color = GAME_CONFIG.snakeColor;
    this.shape = GAME_CONFIG.snakeShape;
    this.spacing = GAME_CONFIG.minSpacing;
    this.segments = [];
    this.trail = Array.from({ length: 12 }, () => ({ x, y }));
    this.trailIndex = 0;
    this.nearestMouse = null;
    this.debugForce = createVector(0, 0);
    this.steeringTarget = createVector(0, 0);
    this.followTarget = createVector(0, 0);
    this.followDirection = createVector(0, 0);
    this.isBot = false;
    this.boosting = false;
    this.name = 'Joueur';
    this.skin = 'circle';
    this.kills = 0;
    this.dead = false;
    this.turnAngle = 0;

    for (let index = 1; index < GAME_CONFIG.initialSegments; index++) {
      this.addSegment(true);
    }
    this.refreshSegmentColors();
  }

  addSegment(initialSegment = false) {
    const tail = this.segments.length > 0 ? this.segments[this.segments.length - 1] : this;
    const direction = tail.vel.copy();
    if (direction.mag() < 0.01) direction.set(1, 0);
    direction.setMag(this.spacing);
    const segmentPosition = initialSegment
      ? createVector(tail.pos.x - direction.x, tail.pos.y - direction.y)
      : tail.pos.copy();
    const segment = new SnakeSegment(segmentPosition.x, segmentPosition.y);
    segment.vel = tail.vel.copy();
    segment.r = GAME_CONFIG.snakeSize;
    this.segments.push(segment);
    this.refreshSegmentColors();
  }

  refreshSegmentColors() {
    const baseColor = color(this.color);
    const tailColor = color('#202a59');
    const denominator = Math.max(this.segments.length * 1.5, 1);
    for (let index = 0; index < this.segments.length; index++) {
      this.segments[index].displayColor = lerpColor(
        baseColor,
        tailColor,
        index / denominator
      ).toString('#rrggbb');
    }
  }

  updateSpacing(target) {
    if (gameState !== 'menu') {
      const desiredSpacing = constrain(
        GAME_CONFIG.slitherSpacing,
        GAME_CONFIG.minSpacing,
        GAME_CONFIG.maxSpacing
      );
      this.spacing = lerp(this.spacing, desiredSpacing, GAME_CONFIG.spacingReturnSpeed);
      return;
    }
    const distanceRatio = constrain(
      p5.Vector.dist(this.pos, target) / Math.max(width * 0.45, 1),
      0,
      1
    );
    const speedRatio = constrain(this.vel.mag() / Math.max(this.maxSpeed, 0.01), 0, 1);
    const stretch = constrain(
      (distanceRatio * 0.6 + speedRatio * 0.4) * GAME_CONFIG.spacingSensitivity,
      0,
      1
    );
    const desiredSpacing = lerp(GAME_CONFIG.minSpacing, GAME_CONFIG.maxSpacing, stretch);
    this.spacing = constrain(
      lerp(this.spacing, desiredSpacing, GAME_CONFIG.spacingReturnSpeed),
      GAME_CONFIG.minSpacing,
      GAME_CONFIG.maxSpacing
    );
  }

  update(target) {
    this.maxSpeed = GAME_CONFIG.snakeSpeed
      * ((this === snake ? dashActive : this.boosting) ? GAME_CONFIG.dashMultiplier : 1)
      * (millis() < slowUntil ? 0.55 : 1);
    this.maxForce = GAME_CONFIG.snakeMaxForce;
    this.r = GAME_CONFIG.snakeSize;
    if (!this.isBot) {
      this.color = GAME_CONFIG.snakeColor;
      this.shape = GAME_CONFIG.snakeShape;
    }
    this.updateSpacing(target);
    this.trailIndex = (this.trailIndex + 1) % this.trail.length;
    this.trail[this.trailIndex].x = this.pos.x;
    this.trail[this.trailIndex].y = this.pos.y;
    if (this === snake) {
      this.nearestMouse = null;
      let nearestDistance = Infinity;
      for (const mouse of mice) {
        const dx = mouse.pos.x - this.pos.x;
        const dy = mouse.pos.y - this.pos.y;
        const distance = dx * dx + dy * dy;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          this.nearestMouse = mouse;
        }
      }
    }
    const targetAngle = Math.atan2(target.y - this.pos.y, target.x - this.pos.x);
    const currentAngle = this.vel.magSq() > 0.01 ? this.vel.heading() : targetAngle;
    const angleDelta = Math.atan2(
      Math.sin(targetAngle - currentAngle),
      Math.cos(targetAngle - currentAngle)
    );
    this.turnAngle = currentAngle + constrain(
      angleDelta,
      -GAME_CONFIG.turnRate,
      GAME_CONFIG.turnRate
    );
    this.steeringTarget.set(
      this.pos.x + cos(this.turnAngle) * GAME_CONFIG.turnLookAhead,
      this.pos.y + sin(this.turnAngle) * GAME_CONFIG.turnLookAhead
    );
    this.debugForce = this.arrive(this.steeringTarget);
    this.applyForce(this.debugForce);
    this.acc.limit(this.maxForce);
    super.update();

    // Les segments poursuivent des points successifs derrière leur prédécesseur par steering.
    let predecessor = this;
    for (let index = 0; index < this.segments.length; index++) {
      const segment = this.segments[index];
      segment.maxSpeed = GAME_CONFIG.snakeSpeed;
      segment.maxForce = this.maxForce;
      segment.r = GAME_CONFIG.snakeSize;
      this.followDirection.set(predecessor.vel);
      if (this.followDirection.magSq() < 0.0001) {
        this.followDirection.set(predecessor.pos.x - target.x, predecessor.pos.y - target.y);
      }
      if (this.followDirection.magSq() < 0.0001) this.followDirection.set(1, 0);
      this.followDirection.setMag(this.spacing);

      this.followTarget.set(predecessor.pos).sub(this.followDirection);
      segment.applyForce(segment.arrive(this.followTarget));
      segment.acc.limit(segment.maxForce);
      segment.update();
      predecessor = segment;
    }
  }

  show() {
    if (activeQuality.trail) {
      push();
      if (activeQuality.additive) blendMode(ADD);
      noFill();
      stroke(this.color);
      for (let index = 1; index < this.trail.length; index++) {
        const current = this.trail[(this.trailIndex - index + this.trail.length) % this.trail.length];
        const previous = this.trail[(this.trailIndex - index + 1 + this.trail.length) % this.trail.length];
        strokeWeight(Math.max(1, this.r * (1 - index / this.trail.length)));
        line(current.x, current.y, previous.x, previous.y);
      }
      pop();
    }

    for (let index = this.segments.length - 1; index >= 0; index--) {
      const segment = this.segments[index];
      if (segment.visible === false) continue;
      if (worldCullingEnabled && !isWorldPointVisible(segment.pos.x, segment.pos.y, segment.r)) continue;
      if (this.isBot && activeQuality.deathStride > 1 && index % activeQuality.deathStride !== 0) continue;
      segment.show(index, this.segments.length, this.color, this.shape, this.skin, this.boosting);
    }

    if (this.headVisible === false) return;
    push();
    translate(this.pos.x, this.pos.y);
    const heading = this.vel.mag() > 0.1 ? this.vel.heading() : 0;
    rotate(heading);
    if (millis() < shieldUntil) {
      noFill();
      stroke('#8df5ff');
      strokeWeight(2);
      circle(0, 0, this.r * 3.4);
    }
    if ((this.boosting || (this === snake && dashActive)) && activeQuality.additive) {
      blendMode(ADD);
    }
    drawSnakeShape(this.shape, 0, 0, this.r * 2, this.color);
    if (activeQuality.additive) blendMode(BLEND);

    // Les yeux restent contrastés et visibles quelle que soit la forme du corps.
    if (eyeSprite) {
      image(eyeSprite, this.r * 0.05, -this.r * 0.92, this.r * 0.9, this.r * 1.84);
    } else {
      noStroke();
      fill('#f4f6e8');
      circle(this.r * 0.35, -this.r * 0.42, this.r * 0.48);
      circle(this.r * 0.35, this.r * 0.42, this.r * 0.48);
      fill('#183b2b');
      circle(this.r * 0.43, -this.r * 0.42, this.r * 0.2);
      circle(this.r * 0.43, this.r * 0.42, this.r * 0.2);
    }
    if (this.name && (!this.isBot || isWorldPointVisible(this.pos.x, this.pos.y, 400))) {
      rotate(-heading);
      textAlign(CENTER, CENTER);
      textSize(13);
      fill(255, 255, 255, 210);
      text(this.name, 0, -this.r * 1.65);
    }
    pop();
  }

  get length() {
    return this.segments.length + 1;
  }
}

class SnakeSegment extends Vehicle {
  show(index, total, snakeColor, shape, skin = 'circle', boosting = false) {
    const diameter = shape === 'tapered'
      ? map(index, 0, Math.max(total - 1, 1), GAME_CONFIG.snakeSize * 2, GAME_CONFIG.snakeSize * 0.8)
      : GAME_CONFIG.snakeSize * 2;
    drawSnakeShape(shape, this.pos.x, this.pos.y, diameter, this.displayColor || snakeColor, skin, index, boosting);
  }
}

function drawSnakeShape(shape, x, y, diameter, snakeColor, skin = 'circle', index = 0, boosting = false) {
  push();
  translate(x, y);
  noStroke();
  const glow = activeQuality.glow ? glowSprites.get(snakeColor) : null;
  if (glow) {
    if (activeQuality.additive) blendMode(ADD);
    image(glow, -diameter * 0.75, -diameter * 0.75, diameter * 1.5, diameter * 1.5);
    if (activeQuality.additive) blendMode(BLEND);
  }
  if (boosting && activeQuality.glow) {
    blendMode(ADD);
  }

  if (shape === 'glow') {
    if (activeQuality.glow && activeQuality.additive) {
      blendMode(ADD);
      fill(snakeColor + '35');
      circle(0, 0, diameter * 1.8);
      blendMode(BLEND);
    }
    fill(snakeColor);
    circle(0, 0, diameter);
  } else if (shape === 'diamond') {
    rotate(QUARTER_PI);
    rectMode(CENTER);
    fill(snakeColor);
    rect(0, 0, diameter * 0.78, diameter * 0.78, diameter * 0.08);
  } else if (shape === 'star') {
    fill(snakeColor);
    drawPolygon(10, diameter / 2, diameter / 4.4);
  } else if (shape === 'hexagon') {
    fill(snakeColor);
    drawPolygon(6, diameter / 2, diameter / 2);
  } else {
    fill(snakeColor);
    circle(0, 0, diameter);
  }
  if (skin === 'stripes') {
    stroke(255, 255, 255, 130);
    strokeWeight(Math.max(1, diameter * 0.08));
    line(-diameter * 0.24, -diameter * 0.24, diameter * 0.24, diameter * 0.24);
    line(-diameter * 0.32, 0, diameter * 0.32, 0);
  }
  if (activeQuality.additive) blendMode(BLEND);
  pop();
}

function drawPolygon(points, outerRadius, innerRadius) {
  beginShape();
  for (let index = 0; index < points; index++) {
    const angle = -HALF_PI + index * TWO_PI / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertex(cos(angle) * radius, sin(angle) * radius);
  }
  endShape(CLOSE);
}
