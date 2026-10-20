class Obstacle extends Vehicle {
  constructor(x, y, r) {
    super(x, y);
    this.r = constrain(r, 20, 80);
  }

  contains(x, y) {
    return p5.Vector.dist(this.pos, createVector(x, y)) <= this.r;
  }

  show(preview = false) {
    push();
    drawingContext.save();
    drawingContext.shadowColor = preview
      ? 'rgba(165, 205, 160, 0.35)'
      : 'rgba(0, 0, 0, 0.55)';
    drawingContext.shadowBlur = preview ? 12 : 16;
    noStroke();
    fill(preview ? 'rgba(90, 115, 92, 0.35)' : '#35463b');
    circle(this.pos.x, this.pos.y, this.r * 2);

    drawingContext.shadowBlur = 0;
    stroke(preview ? 'rgba(195, 220, 180, 0.6)' : '#82917c');
    strokeWeight(2);
    noFill();
    circle(this.pos.x, this.pos.y, this.r * 2);

    noStroke();
    fill(preview ? 'rgba(190, 210, 170, 0.18)' : 'rgba(190, 210, 170, 0.13)');
    circle(this.pos.x - this.r * 0.22, this.pos.y - this.r * 0.25, this.r * 1.05);
    drawingContext.restore();
    pop();
  }
}
