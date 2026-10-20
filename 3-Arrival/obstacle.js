class Obstacle extends Vehicle {
  constructor(x, y, radius, kind) {
    super(x, y);
    this.r = radius;
    this.kind = kind;
  }

  show() {
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    if (this.kind === 'tree') {
      fill('#173a2b');
      triangle(-this.r, this.r * 0.5, 0, -this.r, this.r, this.r * 0.5);
      fill('#254b34');
      triangle(-this.r * 0.8, this.r * 0.05, 0, -this.r * 1.4, this.r * 0.8, this.r * 0.05);
      fill('#654631');
      rect(-this.r * 0.13, this.r * 0.25, this.r * 0.26, this.r * 0.65);
    } else {
      fill('#33464a');
      ellipse(0, this.r * 0.2, this.r * 2, this.r * 1.25);
      fill('#53666a');
      ellipse(-this.r * 0.2, -this.r * 0.1, this.r * 1.1, this.r * 0.7);
    }
    pop();
  }
}

function createObstacles(count) {
  const result = [];
  const mapWidth = GAME_CONFIG.worldWidth || width;
  const mapHeight = GAME_CONFIG.worldHeight || height;
  for (let index = 0; index < count; index++) {
    let x = 0;
    let y = 0;
    let attempts = 0;
    do {
      x = random(48, mapWidth - 48);
      y = random(48, mapHeight - 48);
      attempts++;
    } while (attempts < 20 && dist(x, y, mapWidth / 2, mapHeight / 2) < 180);
    result.push(new Obstacle(x, y, random(14, 28), random() < 0.55 ? 'tree' : 'rock'));
  }
  return result;
}
