// Décor de serpent : la physique et les collisions restent celles de Vehicle.
class Snake extends Vehicle {
  constructor(x, y, maxSpeed, maxForce) {
    super(x, y, maxSpeed, maxForce);
    this.bodyHue = (CONFIG.snake.hue + random(130, 230)) % 360;
    this.waveTime = 0;
    this.history = [];
    this.segmentPoints = Array.from(
      { length: CONFIG.snake.segments },
      () => createVector(x, y)
    );
    this.centerPoints = this.segmentPoints.map((point) => point.copy());
    this.leftEdge = this.segmentPoints.map((point) => point.copy());
    this.rightEdge = this.segmentPoints.map((point) => point.copy());
    const heading = this.vel.copy().normalize();
    const initialTrailLength =
      (this.segmentPoints.length - 1) * Math.max(2, CONFIG.snake.thickness * 0.48);
    for (let distance = 0; distance <= initialTrailLength; distance += 2) {
      this.history.push(
        createVector(
          this.pos.x - heading.x * distance,
          this.pos.y - heading.y * distance
        )
      );
    }
  }

  updateSegmentCount() {
    while (this.segmentPoints.length < CONFIG.snake.segments) {
      const tail = this.segmentPoints[this.segmentPoints.length - 1];
      this.segmentPoints.push(tail.copy());
      this.centerPoints.push(tail.copy());
      this.leftEdge.push(tail.copy());
      this.rightEdge.push(tail.copy());
    }
    while (this.segmentPoints.length > CONFIG.snake.segments) {
      this.segmentPoints.pop();
      this.centerPoints.pop();
      this.leftEdge.pop();
      this.rightEdge.pop();
    }
  }

  _rememberHead() {
    if (this.history.length === 0) {
      this.history.push(this.pos.copy());
      return;
    }

    const last = this.history[0];
    const distance = p5.Vector.dist(last, this.pos);
    if (distance < 0.25) return;

    const steps = Math.ceil(distance / 2);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      this.history.unshift(
        createVector(
          last.x + (this.pos.x - last.x) * t,
          last.y + (this.pos.y - last.y) * t
        )
      );
    }

    const maxHistory = Math.ceil(
      CONFIG.snake.segments * CONFIG.snake.thickness * 1.5
    );
    if (this.history.length > maxHistory) {
      this.history.length = maxHistory;
    }
  }

  _updateBody(advanceAnimation) {
    this.updateSegmentCount();
    this._rememberHead();
    if (advanceAnimation) this.waveTime += 1;
    const spacing = Math.max(2, CONFIG.snake.thickness * 0.48);
    const speedRatio = Math.min(1, this.vel.mag() / Math.max(1, this.maxSpeed));
    const amplitude = CONFIG.snake.waveAmplitude * speedRatio;

    this.segmentPoints[0].set(this.pos.x, this.pos.y);
    this.centerPoints[0].set(this.pos.x, this.pos.y);
    let historyIndex = 0;
    let distanceWalked = 0;
    let newer = this.history[0] || this.pos;
    let older = this.history[1] || newer;
    let span = p5.Vector.dist(newer, older);

    for (let i = 1; i < this.segmentPoints.length; i++) {
      const wantedDistance = i * spacing;
      while (
        historyIndex + 1 < this.history.length - 1 &&
        distanceWalked + span < wantedDistance
      ) {
        distanceWalked += span;
        historyIndex++;
        newer = this.history[historyIndex];
        older = this.history[historyIndex + 1];
        span = p5.Vector.dist(newer, older);
      }
      if (span === 0) {
        this.centerPoints[i].set(newer.x, newer.y);
      } else {
        const t = Math.min(1, Math.max(0, (wantedDistance - distanceWalked) / span));
        this.centerPoints[i].set(
          newer.x + (older.x - newer.x) * t,
          newer.y + (older.y - newer.y) * t
        );
      }
    }

    const last = this.centerPoints.length - 1;
    for (let i = 1; i < this.segmentPoints.length; i++) {
      const previous = this.centerPoints[i - 1];
      const next = this.centerPoints[Math.min(last, i + 1)];
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const length = Math.hypot(dx, dy) || 1;
      const progress = i / last;
      const wave =
        amplitude *
        Math.sin(progress * Math.PI) *
        Math.sin(this.waveTime * CONFIG.snake.waveSpeed - i * CONFIG.snake.waveFrequency);
      this.segmentPoints[i].set(
        this.centerPoints[i].x - (dy / length) * wave,
        this.centerPoints[i].y + (dx / length) * wave
      );
    }
    this._updateEdges();
  }

  _updateEdges() {
    const last = this.segmentPoints.length - 1;
    for (let i = 0; i <= last; i++) {
      const previous = this.segmentPoints[Math.max(0, i - 1)];
      const next = this.segmentPoints[Math.min(last, i + 1)];
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const length = Math.hypot(dx, dy) || 1;
      const progress = i / last;
      const halfWidth =
        Math.max(0.5, CONFIG.snake.thickness * 0.5) *
        Math.pow(1 - progress, 0.78);
      this.leftEdge[i].set(
        this.segmentPoints[i].x - (dy / length) * halfWidth,
        this.segmentPoints[i].y + (dx / length) * halfWidth
      );
      this.rightEdge[i].set(
        this.segmentPoints[i].x + (dy / length) * halfWidth,
        this.segmentPoints[i].y - (dx / length) * halfWidth
      );
    }
  }

  _drawBody() {
    const picked = color(CONFIG.snake.color);
    const fixedHue = hue(picked);
    const bodyHue = CONFIG.snake.randomPalette ? this.bodyHue : fixedHue;
    const bodySaturation = CONFIG.snake.randomPalette
      ? CONFIG.snake.saturation
      : saturation(picked);
    const bodyBrightness = CONFIG.snake.randomPalette
      ? CONFIG.snake.brightness
      : brightness(picked);
    const selectedHue =
      this.couleur === "red"
        ? 0
        : this.couleur === "lightgreen"
          ? 120
          : bodyHue;

    push();
    colorMode(HSB, 360, 100, 100, 100);
    noStroke();
    if (CONFIG.snake.shadowVisible) {
      fill(0, 0, 0, CONFIG.snake.shadowIntensity);
      this._drawContour(2, 3);
    }
    fill(selectedHue, bodySaturation, bodyBrightness);
    this._drawContour(0, 0);
    this._drawPattern(selectedHue, bodySaturation, bodyBrightness);
    this._drawBelly(selectedHue);
    this._drawHead(
      selectedHue,
      bodySaturation,
      bodyBrightness,
      this.waveTime * (1000 / 60)
    );
    pop();
  }

  _drawContour(offsetX, offsetY) {
    beginShape();
    curveVertex(
      this.leftEdge[0].x + offsetX,
      this.leftEdge[0].y + offsetY
    );
    for (const point of this.leftEdge) {
      curveVertex(point.x + offsetX, point.y + offsetY);
    }
    curveVertex(
      this.leftEdge[this.leftEdge.length - 1].x + offsetX,
      this.leftEdge[this.leftEdge.length - 1].y + offsetY
    );
    for (let i = this.rightEdge.length - 1; i >= 0; i--) {
      curveVertex(
        this.rightEdge[i].x + offsetX,
        this.rightEdge[i].y + offsetY
      );
    }
    curveVertex(
      this.rightEdge[0].x + offsetX,
      this.rightEdge[0].y + offsetY
    );
    endShape(CLOSE);
  }

  _drawPattern(hueValue, saturationValue, brightnessValue) {
    if (CONFIG.snake.scaleStyle === "none") return;
    const intensity = CONFIG.snake.patternIntensity;
    const step = CONFIG.snake.scaleStyle === "stripes" ? 4 : 2;
    noStroke();
    for (let i = 3; i < this.segmentPoints.length - 2; i += step) {
      const point = this.segmentPoints[i];
      const previous = this.segmentPoints[i - 1];
      const next = this.segmentPoints[i + 1];
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const length = Math.hypot(dx, dy) || 1;
      const tangentX = dx / length;
      const tangentY = dy / length;
      const normalX = -tangentY;
      const normalY = tangentX;
      const progress = i / (this.segmentPoints.length - 1);
      const widthAtPoint =
        CONFIG.snake.thickness * 0.5 * Math.pow(1 - progress, 0.78);
      const size = Math.max(1, widthAtPoint * 0.3);
      fill(
        (hueValue + 24) % 360,
        Math.max(0, saturationValue * 0.72),
        Math.min(100, brightnessValue + 8 + (1 - progress) * 12),
        intensity * 100
      );

      if (CONFIG.snake.scaleStyle === "dots") {
        for (const side of [-0.35, 0.35]) {
          circle(
            point.x + normalX * widthAtPoint * side,
            point.y + normalY * widthAtPoint * side,
            size
          );
        }
      } else if (CONFIG.snake.scaleStyle === "stripes") {
        push();
        translate(point.x, point.y);
        rotate(Math.atan2(dy, dx));
        rectMode(CENTER);
        rect(0, 0, size * 0.7, widthAtPoint * 1.3, size * 0.2);
        pop();
      } else {
        for (const side of [-0.34, 0.34]) {
          const x = point.x + normalX * widthAtPoint * side;
          const y = point.y + normalY * widthAtPoint * side;
          beginShape();
          vertex(x - tangentX * size, y - tangentY * size);
          vertex(x - normalX * size * 0.55, y - normalY * size * 0.55);
          vertex(x + tangentX * size, y + tangentY * size);
          vertex(x + normalX * size * 0.55, y + normalY * size * 0.55);
          endShape(CLOSE);
        }
      }
    }
  }

  _drawBelly(hueValue) {
    const inset = 0.46;
    noStroke();
    fill((hueValue + 16) % 360, 25, 98, 88);
    beginShape();
    for (let i = 0; i < this.segmentPoints.length; i++) {
      const center = this.segmentPoints[i];
      curveVertex(
        center.x + (this.leftEdge[i].x - center.x) * inset,
        center.y + (this.leftEdge[i].y - center.y) * inset
      );
    }
    for (let i = this.segmentPoints.length - 1; i >= 0; i--) {
      const center = this.segmentPoints[i];
      curveVertex(
        center.x + (this.rightEdge[i].x - center.x) * inset,
        center.y + (this.rightEdge[i].y - center.y) * inset
      );
    }
    endShape(CLOSE);
  }

  _drawHead(hueValue, saturationValue, brightnessValue, visualTime) {
    const heading = this.vel.magSq() > 0.001 ? this.vel.heading() : 0;
    const size = CONFIG.snake.thickness * CONFIG.snake.headSize;
    const eyeSize = size * 0.19 * CONFIG.snake.eyeSize;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(heading);
    noStroke();
    fill(hueValue, saturationValue, Math.min(100, brightnessValue + 9));
    ellipse(0, 0, size * 2.15, size * 1.55);
    for (const side of [-1, 1]) {
      fill(0, 0, 100);
      ellipse(size * 0.22, side * size * 0.34, eyeSize * 1.55, eyeSize * 1.8);
      fill(225, 35, 12);
      ellipse(size * 0.3, side * size * 0.34, eyeSize * 0.42, eyeSize * 1.25);
    }

    const period = 1000 / Math.max(0.1, CONFIG.snake.tongueFrequency);
    if (
      CONFIG.snake.tongueVisible &&
      visualTime % period < Math.min(180, period * 0.13)
    ) {
      stroke(350, 85, 95);
      strokeWeight(Math.max(1, size * 0.08));
      line(size * 0.86, 0, size * 1.35, 0);
      line(size * 1.35, 0, size * 1.58, -size * 0.16);
      line(size * 1.35, 0, size * 1.58, size * 0.16);
    }
    pop();
  }

  render(advanceAnimation = true) {
    this._updateBody(advanceAnimation);
    this._drawBody();
  }

  randomizeAppearance() {
    this.bodyHue = (CONFIG.snake.hue + random(130, 230)) % 360;
  }
}
