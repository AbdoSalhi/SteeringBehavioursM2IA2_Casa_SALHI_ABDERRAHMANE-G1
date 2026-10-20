class Zone {
  constructor(type, x, y, r) {
    if (type !== "mare" && type !== "buisson") {
      throw new Error(`Type de zone inconnu : ${type}`);
    }
    if (!Number.isFinite(r) || r <= 0) {
      throw new Error("Le rayon d'une zone doit être un nombre positif.");
    }
    this.type = type;
    this.pos = createVector(x, y);
    this.r = r;
  }

  contains(position) {
    const dx = position.x - this.pos.x;
    const dy = position.y - this.pos.y;
    return dx * dx + dy * dy <= this.r * this.r;
  }

  show() {
    push();
    if (this.type === "mare") {
      noStroke();
      fill(35, 126, 140, 115);
      circle(this.pos.x, this.pos.y, this.r * 2);
      fill(61, 172, 171, 80);
      ellipse(this.pos.x - this.r * 0.12, this.pos.y - this.r * 0.1, this.r * 1.45, this.r * 1.1);
      noFill();
      stroke(143, 222, 205, 115);
      strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        const rayonOndulation = this.r * (0.28 + i * 0.2);
        ellipse(
          this.pos.x + Math.sin(frameCount * 0.025 + i) * this.r * 0.08,
          this.pos.y + Math.cos(frameCount * 0.02 + i) * this.r * 0.06,
          rayonOndulation * 1.5,
          rayonOndulation
        );
      }
    } else {
      noStroke();
      fill(20, 61, 35, 230);
      circle(this.pos.x, this.pos.y, this.r * 2);
      for (let i = 0; i < 9; i++) {
        const angle = TWO_PI * i / 9;
        const distance = this.r * 0.48;
        const leafX = this.pos.x + Math.cos(angle) * distance;
        const leafY = this.pos.y + Math.sin(angle) * distance;
        fill(i % 2 === 0 ? 39 : 51, i % 2 === 0 ? 104 : 119, i % 2 === 0 ? 52 : 59, 235);
        ellipse(leafX, leafY, this.r * 0.9, this.r * 0.62);
        fill(117, 157, 76, 145);
        circle(leafX - this.r * 0.12, leafY - this.r * 0.1, this.r * 0.18);
      }
      fill(28, 77, 40, 245);
      circle(this.pos.x, this.pos.y, this.r * 0.75);
    }

    if (typeof debug !== "undefined" && debug) {
      noFill();
      stroke(this.type === "mare" ? "#8de1dc" : "#c0df83");
      strokeWeight(2);
      circle(this.pos.x, this.pos.y, this.r * 2);
    }
    pop();
  }
}
