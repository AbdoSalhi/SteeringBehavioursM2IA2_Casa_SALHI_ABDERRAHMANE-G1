class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  midpoint() {
    return createVector((this.a.x + this.b.x) * 0.5, (this.a.y + this.b.y) * 0.5);
  }

  show() {
    stroke(255, 180);
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }
}

function distanceToSegment(a, b, x, y) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = x - a.x;
  const apy = y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq === 0) {
    return dist(x, y, a.x, a.y);
  }
  const t = constrain((apx * abx + apy * aby) / abLenSq, 0, 1);
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  return dist(x, y, cx, cy);
}
