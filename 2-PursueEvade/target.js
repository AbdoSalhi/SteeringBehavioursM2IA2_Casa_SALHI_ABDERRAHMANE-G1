class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(6);

    // propriété de la target
    this.rayonDetection = 100;
    this.decoySalvoSize = 10;
    this.decoyCooldownMs = 10000;
    this.lastDecoySalvoAt = null;
  }

  releaseDecoysIfDetected(pursuer, nowMs) {
    const isDetected = p5.Vector.dist(this.pos, pursuer.pos) <= this.rayonDetection;
    const cooldownElapsed = this.lastDecoySalvoAt === null
      || nowMs - this.lastDecoySalvoAt >= this.decoyCooldownMs;
    if (!isDetected || !cooldownElapsed) return [];

    this.lastDecoySalvoAt = nowMs;
    const heading = this.vel.heading();
    const spread = 0.12;
    const launchRadius = this.r + 8;
    return Array.from({ length: this.decoySalvoSize }, (_, index) => {
      const angle = heading + (index - (this.decoySalvoSize - 1) / 2) * spread;
      const launchOffset = p5.Vector.fromAngle(angle).mult(launchRadius);
      const decoyVelocity = p5.Vector.fromAngle(angle).mult(this.vel.mag());
      return new Decoy(
        this.pos.x + launchOffset.x,
        this.pos.y + launchOffset.y,
        decoyVelocity,
        nowMs
      );
    });
  }

  show() {
    push();
    noFill();
    stroke(100, 160, 255, 55);
    strokeWeight(1);
    circle(this.pos.x, this.pos.y, this.rayonDetection * 2);

    translate(this.pos.x, this.pos.y);
    const scaleFactor = this.r / 10;
    scale(scaleFactor);
    stroke('#fff7e8');
    strokeWeight(1.5);

    stroke('#e8a92e');
    line(-4, 7, -4, 12);
    line(5, 7, 5, 12);
    stroke('#fff7e8');
    fill('#fffaf0');
    ellipse(0, 0, 25, 19);
    fill('#edc77b');
    ellipse(-3, 1, 13, 12);

    noStroke();
    fill('#fffaf0');
    ellipse(8, -8, 14, 14);
    fill('#e44b45');
    circle(4, -16, 5);
    circle(9, -17, 5);
    circle(14, -15, 5);
    fill('#f2b632');
    triangle(13, -7, 21, -5, 13, -3);
    fill('#26201b');
    circle(11, -10, 2);
    pop();
  }
}