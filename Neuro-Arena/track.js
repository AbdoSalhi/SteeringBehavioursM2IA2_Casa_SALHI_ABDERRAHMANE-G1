class CircuitTrack {
  constructor(level = currentLevel, seed = trackSeed) {
    this.level = level;
    this.seed = seed;
    this.points = [];
    this.inner = [];
    this.outer = [];
    this.checkpoints = [];
    this.walls = [];
    this.start = createVector();
    this.layer = null;
    this.generate();
  }

  generate() {
    randomSeed(this.seed);
    noiseSeed(this.seed);
    const preset = TRACK_LEVELS[this.level] || TRACK_LEVELS.Moyen;
    const total = 96;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const baseRadius = Math.min(width, height) * 0.24;

    this.points = [];
    this.inner = [];
    this.outer = [];

    for (let i = 0; i < total; i++) {
      const angle = (i / total) * TWO_PI;
      const wave = noise(
        Math.cos(angle) * 0.8 + this.seed * 0.05,
        Math.sin(angle) * 0.8 + this.seed * 0.05
      );
      const radius = baseRadius + wave * preset.noiseMax * 40;
      const x = cx + Math.cos(angle + this.seed * 0.015) * radius;
      const y = cy + Math.sin(angle + this.seed * 0.015) * radius;
      this.points.push(createVector(x, y));

      const nx = Math.cos(angle + HALF_PI);
      const ny = Math.sin(angle + HALF_PI);
      this.inner.push(createVector(x + nx * preset.pathWidth * 0.45, y + ny * preset.pathWidth * 0.45));
      this.outer.push(createVector(x - nx * preset.pathWidth * 0.45, y - ny * preset.pathWidth * 0.45));
    }

    this.checkpoints = [];
    for (let i = 0; i < this.points.length; i++) {
      const a = this.points[i];
      const b = this.points[(i + 1) % this.points.length];
      this.checkpoints.push(new Boundary(a.x, a.y, b.x, b.y));
    }

    this.walls = [];
    for (let i = 0; i < this.points.length; i++) {
      const ia = this.inner[i];
      const ib = this.inner[(i + 1) % this.inner.length];
      const oa = this.outer[i];
      const ob = this.outer[(i + 1) % this.outer.length];
      this.walls.push(new Boundary(ia.x, ia.y, ib.x, ib.y));
      this.walls.push(new Boundary(oa.x, oa.y, ob.x, ob.y));
    }

    if (this.checkpoints.length > 0) {
      this.start = this.checkpoints[0].midpoint();
    }
    this.makeTrackLayer();
  }

  makeTrackLayer() {
    this.layer = createGraphics(width, height);
    this.layer.clear();
    this.layer.noStroke();
    this.layer.fill(25, 30, 45);
    this.layer.beginShape();
    this.outer.forEach((point) => this.layer.vertex(point.x, point.y));
    this.layer.beginContour();
    for (let i = this.inner.length - 1; i >= 0; i--) {
      this.layer.vertex(this.inner[i].x, this.inner[i].y);
    }
    this.layer.endContour();
    this.layer.endShape(CLOSE);

    this.layer.stroke(255, 90);
    this.layer.strokeWeight(1.5);
    for (let i = 0; i < this.checkpoints.length; i++) {
      const point = this.checkpoints[i];
      this.layer.line(point.a.x, point.a.y, point.b.x, point.b.y);
    }

    this.layer.stroke(255, 160);
    this.layer.strokeWeight(3);
    this.layer.noFill();
    this.layer.beginShape();
    this.points.forEach((point) => this.layer.vertex(point.x, point.y));
    this.layer.endShape(CLOSE);
  }

  draw() {
    if (this.layer) {
      image(this.layer, 0, 0);
    }
  }
}

function buildTrack(level = currentLevel, seed = trackSeed) {
  track = new CircuitTrack(level, seed);
  return track;
}
