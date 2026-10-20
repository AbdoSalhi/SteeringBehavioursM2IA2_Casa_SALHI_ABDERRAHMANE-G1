class Predator extends Vehicle {
  applyBehaviors(target, obstacles, vehicules) {
    let proieLaPlusProche = undefined;
    let distanceLaPlusCourte = Infinity;

    vehicules.forEach(proie => {
      const distance = this.pos.dist(proie.pos);
      if (distance < distanceLaPlusCourte) {
        distanceLaPlusCourte = distance;
        proieLaPlusProche = proie;
      }
    });

    this.proieCiblee = proieLaPlusProche;
    this.pointDePrediction = undefined;

    let pursuitForce = createVector(0, 0);
    if (proieLaPlusProche !== undefined) {
      pursuitForce = this.pursue(proieLaPlusProche);
      this.pointDePrediction = proieLaPlusProche.pos.copy();
      this.pointDePrediction.add(proieLaPlusProche.vel.copy().mult(10));
    }

    let avoidForce = this.avoid(obstacles);
    avoidForce.mult(3);

    pursuitForce.add(avoidForce);
    pursuitForce.limit(this.maxForce);
    this.applyForce(pursuitForce);
  }

  show() {
    this.drawPath();

    push();
    stroke(255);
    strokeWeight(2);
    fill("orangered");
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    triangle(-24, -12, -24, 12, 24, 0);

    if (Vehicle.debug) {
      noFill();
      circle(0, 0, this.r);
    }
    pop();

    if (Vehicle.debug) {
      noFill();
      stroke("orangered");
      circle(this.pos.x, this.pos.y, this.r);

      if (this.proieCiblee !== undefined) {
        line(
          this.pos.x,
          this.pos.y,
          this.proieCiblee.pos.x,
          this.proieCiblee.pos.y
        );
        const vecteurPrediction = p5.Vector.sub(
          this.pointDePrediction,
          this.proieCiblee.pos
        );
        this.drawVector(
          this.proieCiblee.pos,
          vecteurPrediction,
          "orange"
        );
      }
    }
  }
}
