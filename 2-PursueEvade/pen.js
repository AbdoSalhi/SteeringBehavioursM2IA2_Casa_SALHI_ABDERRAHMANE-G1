class Pen {
  constructor(x, y, w, h, opening = "left") {
    if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) {
      throw new Error("Les dimensions de l'enclos doivent être positives.");
    }
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.opening = opening;
    this.openingSize = Math.min(112, h * 0.42);
  }

  contains(position, marge = 0) {
    return position.x >= this.x - marge &&
      position.x <= this.x + this.w + marge &&
      position.y >= this.y - marge &&
      position.y <= this.y + this.h + marge;
  }

  resize(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.openingSize = Math.min(112, h * 0.42);
  }

  boundaries(vehicle, marge = 34) {
    const desired = createVector(0, 0);
    if (vehicle.pos.x < this.x + marge) {
      desired.x = vehicle.maxSpeed;
    } else if (vehicle.pos.x > this.x + this.w - marge) {
      desired.x = -vehicle.maxSpeed;
    }
    if (vehicle.pos.y < this.y + marge) {
      desired.y = vehicle.maxSpeed;
    } else if (vehicle.pos.y > this.y + this.h - marge) {
      desired.y = -vehicle.maxSpeed;
    }

    if (desired.magSq() <= 1e-12) {
      return desired;
    }
    desired.setMag(vehicle.maxSpeed);
    return desired.sub(vehicle.vel).limit(vehicle.maxForce);
  }

  fencePosts(spacing = 18, radius = 7) {
    const posts = [];
    const ouvertureDebut = this.y + (this.h - this.openingSize) / 2;
    const ouvertureFin = ouvertureDebut + this.openingSize;
    const appendWall = (x1, y1, x2, y2, isOpeningWall = false) => {
      const length = Math.hypot(x2 - x1, y2 - y1);
      const count = Math.max(1, Math.ceil(length / spacing));
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        if (isOpeningWall && y > ouvertureDebut - radius && y < ouvertureFin + radius) {
          continue;
        }
        posts.push({ x, y, r: radius });
      }
    };

    appendWall(this.x, this.y, this.x + this.w, this.y);
    appendWall(this.x + this.w, this.y, this.x + this.w, this.y + this.h);
    appendWall(this.x + this.w, this.y + this.h, this.x, this.y + this.h);
    if (this.opening === "left") {
      appendWall(this.x, this.y, this.x, this.y + this.h, true);
    } else {
      appendWall(this.x, this.y, this.x, this.y + this.h);
    }
    return posts;
  }

  show() {
    const ouvertureDebut = this.y + (this.h - this.openingSize) / 2;
    const ouvertureFin = ouvertureDebut + this.openingSize;
    push();
    noFill();
    stroke("#735536");
    strokeWeight(4);
    line(this.x, this.y + 5, this.x + this.w, this.y + 5);
    line(this.x, this.y + this.h - 5, this.x + this.w, this.y + this.h - 5);
    line(this.x + this.w - 5, this.y, this.x + this.w - 5, this.y + this.h);

    if (this.opening === "left") {
      line(this.x + 5, this.y, this.x + 5, ouvertureDebut);
      line(this.x + 5, ouvertureFin, this.x + 5, this.y + this.h);
      line(this.x, this.y + 5, this.x, ouvertureDebut);
      line(this.x, ouvertureFin, this.x, this.y + this.h - 5);
      stroke("#d9c69b");
      strokeWeight(2);
      line(this.x - 5, ouvertureDebut, this.x + 5, ouvertureDebut);
      line(this.x - 5, ouvertureFin, this.x + 5, ouvertureFin);
    } else {
      line(this.x + 5, this.y, this.x + 5, this.y + this.h);
    }
    pop();
  }
}

class PenObstacle {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.r = r;
    this.levelObstacle = true;
    this.penFence = true;
  }

  show() {}
}
