class Obstacle {
  constructor(x, y, r, couleur) {
    this.pos = createVector(x, y);
    this.r = r;
    this.color = couleur;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    stroke(THEME_COLORS.yarnStrand);
    strokeWeight(max(1, this.r * 0.08));
    fill(THEME_COLORS.yarn);
    circle(0, 0, this.r * 2);

    noFill();
    stroke(THEME_COLORS.yarnStrand);
    bezier(
      -this.r * 0.85, -this.r * 0.25,
      -this.r * 0.2, -this.r * 0.95,
      this.r * 0.15, this.r * 0.9,
      this.r * 0.85, this.r * 0.2
    );
    bezier(
      -this.r * 0.7, this.r * 0.5,
      -this.r * 0.2, -this.r * 0.75,
      this.r * 0.3, this.r * 0.75,
      this.r * 0.7, -this.r * 0.5
    );
    bezier(
      -this.r * 0.45, -this.r * 0.75,
      this.r * 0.8, -this.r * 0.25,
      -this.r * 0.8, this.r * 0.1,
      this.r * 0.45, this.r * 0.75
    );
    pop();
  }
}