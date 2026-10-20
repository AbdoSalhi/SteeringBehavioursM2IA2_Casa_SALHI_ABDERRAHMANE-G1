// Une cible pilotée par l'utilisateur, sans timer ni locomotion autonome.
class MouseTarget extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.r = SeekPopulation.ARRIVAL_RADIUS;
  }

  show() {
    push();
    fill('red');
    noStroke();
    circle(this.pos.x, this.pos.y, this.r * 2);
    pop();
  }
}
