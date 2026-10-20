class Fox extends Vehicle {
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());

    noStroke();
    fill('#a9421b');
    ellipse(-22, 0, 32, 20);
    fill('#fff1d6');
    ellipse(-34, 0, 12, 12);

    fill('#bd4b1f');
    ellipse(-3, 0, 42, 25);
    fill('#3e2723');
    rect(-19, 8, 5, 12, 2);
    rect(7, 8, 5, 12, 2);

    fill('#e8752a');
    triangle(5, -8, 13, -21, 20, -7);
    triangle(17, -7, 27, -19, 30, -3);
    ellipse(17, 0, 28, 23);

    fill('#fff1d6');
    ellipse(28, 5, 18, 11);
    fill('#2a1b16');
    circle(22, -3, 3);
    circle(35, 4, 4);
    fill('#2a1b16');
    circle(43, 3, 4);
    pop();
  }
}
