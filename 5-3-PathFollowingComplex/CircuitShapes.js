// Génère des points de contrôle pour des tracés fermés utilisables par Path.
class CircuitShapes {
  static create(shape, pointCount, scale, irregularity) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.5 * scale;
    const count = Math.max(8, pointCount);
    const points = [];

    for (let i = 0; i < count; i++) {
      const angle = (TWO_PI * i) / count;
      let x;
      let y;

      if (shape === "ellipse") {
        x = Math.cos(angle) * baseRadius * 1.22;
        y = Math.sin(angle) * baseRadius * 0.76;
      } else if (shape === "infinity") {
        const denominator = 1 + Math.cos(angle) ** 2;
        x = (baseRadius * 1.45 * Math.sin(angle)) / denominator;
        y =
          (baseRadius * 0.86 * Math.sin(angle) * Math.cos(angle)) /
          denominator;
      } else if (shape === "star") {
        const radius = baseRadius * (i % 2 === 0 ? 1 : 0.48);
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      } else if (shape === "roundedRect") {
        const exponent = 0.42;
        x =
          Math.sign(Math.cos(angle)) *
          Math.pow(Math.abs(Math.cos(angle)), exponent) *
          baseRadius;
        y =
          Math.sign(Math.sin(angle)) *
          Math.pow(Math.abs(Math.sin(angle)), exponent) *
          baseRadius *
          0.74;
      } else if (shape === "spiral") {
        const radialWave = 1 + 0.24 * Math.cos(3 * angle);
        x = Math.cos(angle) * baseRadius * radialWave;
        y = Math.sin(angle) * baseRadius * 0.74 * radialWave;
      } else if (shape === "circle") {
        x = Math.cos(angle) * baseRadius;
        y = Math.sin(angle) * baseRadius;
      } else {
        const radius = baseRadius * (1 + random(-irregularity, irregularity));
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }
      points.push(createVector(centerX + x, centerY + y));
    }
    return points;
  }

  // Interpole une spline périodique afin que le dessin et le suiveur bouclent.
  static interpolateClosed(points, subdivisions = 5) {
    const smoothPoints = [];
    const count = points.length;
    if (count < 3) return points.map((point) => point.copy());

    for (let i = 0; i < count; i++) {
      const p0 = points[(i - 1 + count) % count];
      const p1 = points[i];
      const p2 = points[(i + 1) % count];
      const p3 = points[(i + 2) % count];

      for (let step = 0; step < subdivisions; step++) {
        const t = step / subdivisions;
        const t2 = t * t;
        const t3 = t2 * t;
        const x =
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y =
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        smoothPoints.push(createVector(x, y));
      }
    }
    return smoothPoints;
  }
}

// Édition directe des points de contrôle du circuit.
class CircuitEditor {
  constructor(onChange) {
    this.onChange = onChange;
    this.dragIndex = -1;
  }

  beginDrag(x, y) {
    if (!CONFIG.circuit.editMode) return false;
    this.dragIndex = this._nearestPoint(x, y, 22);
    return true;
  }

  drag(x, y) {
    if (!CONFIG.circuit.editMode) return false;
    if (this.dragIndex >= 0) {
      controlPoints[this.dragIndex].set(x, y);
      this.onChange();
    }
    return true;
  }

  endDrag() {
    this.dragIndex = -1;
  }

  addPoint(x, y) {
    if (!CONFIG.circuit.editMode) return false;
    if (controlPoints.length >= 60) return true;
    const insertionIndex = this._nearestSegment(x, y);
    controlPoints.splice(insertionIndex, 0, createVector(x, y));
    CONFIG.circuit.controlPoints = controlPoints.length;
    this.onChange();
    return true;
  }

  removePoint(x, y) {
    if (!CONFIG.circuit.editMode) return false;
    if (controlPoints.length <= 8) return true;
    const index = this._nearestPoint(x, y, 28);
    if (index >= 0) {
      controlPoints.splice(index, 1);
      CONFIG.circuit.controlPoints = controlPoints.length;
      this.onChange();
    }
    return true;
  }

  drawHandles() {
    if (!CONFIG.circuit.editMode) return;
    push();
    colorMode(RGB, 255);
    stroke(255);
    strokeWeight(1);
    fill(34, 220, 204, 190);
    for (const point of controlPoints) circle(point.x, point.y, 10);
    pop();
  }

  _nearestPoint(x, y, maxDistance) {
    let closestIndex = -1;
    let closestDistance = maxDistance;
    for (let i = 0; i < controlPoints.length; i++) {
      const distance = dist(x, y, controlPoints[i].x, controlPoints[i].y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  _nearestSegment(x, y) {
    let closestIndex = 0;
    let closestDistance = Infinity;
    for (let i = 0; i < controlPoints.length; i++) {
      const first = controlPoints[i];
      const second = controlPoints[(i + 1) % controlPoints.length];
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const lengthSquared = dx * dx + dy * dy || 1;
      const amount = Math.max(
        0,
        Math.min(1, ((x - first.x) * dx + (y - first.y) * dy) / lengthSquared)
      );
      const distance = dist(
        x,
        y,
        first.x + dx * amount,
        first.y + dy * amount
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = (i + 1) % controlPoints.length;
      }
    }
    return closestIndex;
  }
}
