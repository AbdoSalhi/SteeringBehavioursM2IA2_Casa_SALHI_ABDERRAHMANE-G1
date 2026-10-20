class Boulder extends BouncingBall {
  constructor(x, y, radius = random(25, 40)) {
    super(x, y);
    this.r = constrain(radius, 25, 40);
    this.maxSpeed = 3;
    this.vel = p5.Vector.random2D().mult(random(1.7, this.maxSpeed));
    this.angle = random(TWO_PI);
    this.rotationSpeed = random(-0.025, 0.025);
  }

  update() {
    super.update();
    this.angle += this.rotationSpeed;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    noStroke();
    fill(0, 0, 0, 65);
    ellipse(4, this.r * 0.75, this.r * 2.3, this.r * 0.72);

    stroke("#302f2a");
    strokeWeight(2);
    fill("#625f55");
    beginShape();
    vertex(-this.r * 0.82, -this.r * 0.08);
    vertex(-this.r * 0.63, -this.r * 0.63);
    vertex(-this.r * 0.12, -this.r * 0.91);
    vertex(this.r * 0.48, -this.r * 0.72);
    vertex(this.r * 0.88, -this.r * 0.16);
    vertex(this.r * 0.72, this.r * 0.56);
    vertex(this.r * 0.18, this.r * 0.83);
    vertex(-this.r * 0.49, this.r * 0.65);
    endShape(CLOSE);

    noStroke();
    fill("#858174");
    ellipse(-this.r * 0.16, -this.r * 0.35, this.r * 0.74, this.r * 0.34);
    fill("#45443e");
    ellipse(this.r * 0.31, this.r * 0.2, this.r * 0.38, this.r * 0.22);
    fill("#393832");
    triangle(
      -this.r * 0.36, this.r * 0.09,
      -this.r * 0.1, this.r * 0.23,
      -this.r * 0.42, this.r * 0.38
    );
    pop();
  }

  static spawn(obstacles = [], vehicles = [], existingBoulders = []) {
    const padding = 44;
    for (let attempt = 0; attempt < 500; attempt++) {
      const radius = random(25, 40);
      const boulder = new Boulder(
        random(padding + radius, width - padding - radius),
        random(padding + radius, height - padding - radius),
        radius
      );
      const overlaps = obstacles.some(obstacle => {
        const dx = boulder.pos.x - obstacle.pos.x;
        const dy = boulder.pos.y - obstacle.pos.y;
        const clearance = boulder.r + obstacle.r + 18;
        return dx * dx + dy * dy < clearance * clearance;
      }) || vehicles.some(vehicle => {
        const dx = boulder.pos.x - vehicle.pos.x;
        const dy = boulder.pos.y - vehicle.pos.y;
        const clearance = boulder.r + vehicle.r + 45;
        return dx * dx + dy * dy < clearance * clearance;
      }) || existingBoulders.some(other => {
        const dx = boulder.pos.x - other.pos.x;
        const dy = boulder.pos.y - other.pos.y;
        const clearance = boulder.r + other.r + 50;
        return dx * dx + dy * dy < clearance * clearance;
      });
      if (!overlaps) {
        return boulder;
      }
    }

    throw new Error("Impossible de trouver une position libre pour un rocher.");
  }
}
