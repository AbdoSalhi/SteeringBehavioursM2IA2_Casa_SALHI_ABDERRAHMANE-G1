import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) { this.x = x; this.y = y; return this; }
  copy() { return new Vector(this.x, this.y); }
  add(vector) { this.x += vector.x; this.y += vector.y; return this; }
  sub(vector) { this.x -= vector.x; this.y -= vector.y; return this; }
  mult(value) { this.x *= value; this.y *= value; return this; }
  div(value) { this.x /= value; this.y /= value; return this; }
  mag() { return Math.hypot(this.x, this.y); }
  magSq() { return this.x * this.x + this.y * this.y; }
  normalize() { return this.mag() ? this.setMag(1) : this; }
  setMag(value) { const magnitude = this.mag(); return magnitude ? this.mult(value / magnitude) : this; }
  limit(value) { return this.mag() > value ? this.setMag(value) : this; }
  heading() { return Math.atan2(this.y, this.x); }

  static sub(a, b) { return new Vector(a.x - b.x, a.y - b.y); }
  static dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  static fromAngle(angle) { return new Vector(Math.cos(angle), Math.sin(angle)); }
  static angleBetween(a, b) {
    const denominator = a.mag() * b.mag();
    return denominator === 0
      ? 0
      : Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / denominator)));
  }
  static random2D() { return Vector.fromAngle(0.5); }
}

function createScene() {
  let randomState = 123456789;
  const drawCalls = [];
  const context = vm.createContext({
    p5: { Vector },
    createVector: (x, y) => new Vector(x, y),
    constrain: (value, min, max) => Math.min(Math.max(value, min), max),
    map: (value, start1, stop1, start2, stop2) =>
      start2 + ((value - start1) / (stop1 - start1)) * (stop2 - start2),
    random: (min = 1, max) => {
      const rangeStart = max === undefined ? 0 : min;
      const rangeEnd = max === undefined ? min : max;
      randomState = (randomState * 1664525 + 1013904223) % 4294967296;
      return rangeStart + (rangeEnd - rangeStart) * (randomState / 4294967296);
    },
    width: 800,
    height: 600,
    frameCount: 20,
    debug: false,
    frameCount: 20,
    TWO_PI: Math.PI * 2,
    PI: Math.PI,
    HALF_PI: Math.PI / 2,
    sin: Math.sin,
    asin: Math.asin,
    push() { drawCalls.push('push'); },
    pop() { drawCalls.push('pop'); },
    stroke() { drawCalls.push('stroke'); },
    strokeWeight() { drawCalls.push('strokeWeight'); },
    fill() { drawCalls.push('fill'); },
    noStroke() { drawCalls.push('noStroke'); },
    noFill() { drawCalls.push('noFill'); },
    circle() { drawCalls.push('circle'); },
    arc() { drawCalls.push('arc'); },
    ellipse() { drawCalls.push('ellipse'); },
    line() { drawCalls.push('line'); },
    translate() { drawCalls.push('translate'); },
    rotate() { drawCalls.push('rotate'); },
    triangle() { drawCalls.push('triangle'); },
    rect() { drawCalls.push('rect'); },
    textSize() { drawCalls.push('textSize'); },
    text() { drawCalls.push('text'); },
    drawArrow() { drawCalls.push('drawArrow'); },
    drawCalls
  });
  vm.runInContext(readFileSync(new URL('../vehicle.js', import.meta.url), 'utf8'), context);
  vm.runInContext(readFileSync(new URL('../pen.js', import.meta.url), 'utf8'), context);
  vm.runInContext(readFileSync(new URL('../hen.js', import.meta.url), 'utf8'), context);
  vm.runInContext(readFileSync(new URL('../queen.js', import.meta.url), 'utf8'), context);
  return context;
}

test('Hen initialise ses paramètres et applique la fuite vers le snake.head proche', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    const snake = { head: new Vehicle(150, 100) };
    snake.head.vel.set(1, 0);
    hen.applyBehaviors(snake, [], [hen]);
    const firstSpeed = hen.maxSpeed;
    hen.applyBehaviors(snake, [], [hen]);
    ({
      radius: hen.r,
      detection: hen.rayonDetection,
      panic: hen.rayonPanique,
      state: hen.etat,
      speed: firstSpeed,
      repeatSpeed: hen.maxSpeed,
      panicState: hen.enPanique,
      displacement: p5.Vector.dist(hen.pos, new p5.Vector(100, 100))
    });
  `, context);

  assert.equal(result.radius, 12);
  assert.equal(result.detection, 140);
  assert.equal(result.panic, 60);
  assert.equal(result.state, 'flee');
  assert.equal(result.speed, 4);
  assert.equal(result.repeatSpeed, 4, 'la vitesse ne doit pas croître de façon cumulative');
  assert.equal(result.panicState, true);
  assert.ok(result.displacement > 0);
});

test('Hen revient au wander et à sa vitesse normale quand le snake est éloigné', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    hen.vitesseNormale = 3;
    hen.maxSpeed = 3;
    const snake = { head: new Vehicle(500, 500) };
    hen.applyBehaviors(snake, [], [hen]);
    ({
      state: hen.etat,
      speed: hen.maxSpeed,
      panic: hen.enPanique,
      displacement: p5.Vector.dist(hen.pos, new p5.Vector(100, 100))
    });
  `, createScene());
  assert.equal(result.state, 'wander');
  assert.equal(result.speed, 3);
  assert.equal(result.panic, false);
  assert.ok(result.displacement > 0);
});

test('canSee respecte le cône de 110 degrés, la portée et une vitesse non nulle', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    hen.vel.set(1, 0);
    ({
      vision: hen.canSee(createVector(200, 100)),
      derriere: hen.canSee(createVector(0, 100)),
      horsPortee: hen.canSee(createVector(300, 100)),
      portee: hen.porteeVision,
      champ: hen.champVision
    });
  `, createScene());
  assert.equal(result.vision, true);
  assert.equal(result.derriere, false);
  assert.equal(result.horsPortee, false);
  assert.equal(result.portee, 160);
  assert.equal(result.champ, 110);
});

test('canSee protège les vitesses nulles et la poule entend un serpent à moins de 50 px', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    hen.vel.set(0, 0);
    const visible = hen.canSee(createVector(120, 100));
    const snake = { head: new Vehicle(120, 100) };
    snake.head.vel.set(1, 0);
    hen.applyBehaviors(snake, [], [hen]);
    ({ visible, state: hen.etat, finite: Number.isFinite(hen.pos.x) && Number.isFinite(hen.pos.y) });
  `, createScene());
  assert.equal(result.visible, false);
  assert.equal(result.state, 'flee');
  assert.equal(result.finite, true);
});

test('la reine fuit le serpent et dessine sa couronne dorée', () => {
  const context = createScene();
  const result = vm.runInContext(`
    const queen = new Queen(100, 100);
    const snake = { head: new Vehicle(220, 100) };
    snake.head.vel.set(-1, 0);
    queen.applyBehaviors(snake, [], [], [], []);
    queen.show();
    ({
      radius: queen.r,
      speed: queen.maxSpeed,
      state: queen.etat,
      flee: queen.lastForces.flee.mag()
    });
  `, context);
  assert.equal(result.radius, 20);
  assert.equal(result.speed, 2.8);
  assert.equal(result.state, 'flee');
  assert.ok(result.flee > 0);
  assert.ok(context.drawCalls.includes('rect'));
  assert.ok(context.drawCalls.includes('triangle'));
});

test('les gardes suivent la reine, fuient le serpent et se détournent vers les graines', () => {
  const result = vm.runInContext(`
    const queen = new Queen(200, 200);
    queen.vel.set(2, 0);
    const guard = new Hen(100, 200);
    guard.leader = queen;
    guard.applyBehaviors(null, [], [guard], [], []);
    const followState = guard.etat;
    const followX = guard.lastForces.follow.x;

    const seed = { type: 'seed', pos: new p5.Vector(90, 200), r: 8 };
    guard.applyBehaviors(null, [], [guard], [seed], []);
    const seedState = guard.etat;
    const seedTarget = guard.lastForces.targetDecoy === seed;

    const snake = { head: new Vehicle(150, 200) };
    guard.applyBehaviors(snake, [], [guard], [], []);
    ({
      followState,
      followX,
      seedState,
      seedTarget,
      threatState: guard.etat,
      fleeForce: guard.lastForces.flee.mag()
    });
  `, createScene());
  assert.equal(result.followState, 'follow');
  assert.ok(result.followX > 0);
  assert.equal(result.seedState, 'peck');
  assert.equal(result.seedTarget, true);
  assert.equal(result.threatState, 'flee');
  assert.ok(result.fleeForce > 0);
});

test('Hen ignore la tête du serpent lorsqu’elle est cachée dans un buisson', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    const snake = { head: new Vehicle(130, 100) };
    snake.head.hidden = true;
    hen.applyBehaviors(snake, [], [hen]);
    ({ state: hen.etat, fleeForce: hen.lastForces.flee });
  `, createScene());

  assert.equal(result.state, 'wander');
  assert.equal(result.fleeForce, null);
});

test('Hen en fuite reçoit une force d’attraction vers une mare', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    const snake = { head: new Vehicle(130, 100) };
    const pond = {
      type: 'mare',
      pos: new p5.Vector(220, 100),
      contains: () => false
    };
    hen.applyBehaviors(snake, [], [hen], [], [pond]);
    ({
      state: hen.etat,
      pondForce: hen.lastForces.pond,
      finite: Number.isFinite(hen.lastForces.pond.x) &&
        Number.isFinite(hen.lastForces.pond.y)
    });
  `, createScene());

  assert.equal(result.state, 'flee');
  assert.equal(result.finite, true);
  assert.ok(result.pondForce.mag() > 0);
});

test('Hen entrée dans l’enclos reste en wander et utilise ses limites internes', () => {
  const result = vm.runInContext(`
    const pen = new Pen(300, 200, 200, 160, 'left');
    const hen = new Hen(400, 280);
    const snake = { head: new Vehicle(410, 280) };
    hen.applyBehaviors(snake, [], [hen], [], [], pen);
    ({
      inPen: hen.inPen,
      state: hen.etat,
      flee: hen.lastForces.flee,
      boundariesFinite: Number.isFinite(hen.lastForces.boundaries.x) &&
        Number.isFinite(hen.lastForces.boundaries.y),
      updated: hen.pos.x !== 400 || hen.pos.y !== 280
    });
  `, createScene());

  assert.equal(result.inPen, true);
  assert.equal(result.state, 'wander');
  assert.equal(result.flee, null);
  assert.equal(result.boundariesFinite, true);
  assert.equal(result.updated, true);
});

test('Hen cible une graine proche et commence à la picorer', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 100);
    const snake = { head: new Vehicle(600, 500) };
    const seed = { type: 'seed', pos: new p5.Vector(110, 100), r: 8 };
    hen.applyBehaviors(snake, [], [hen], [seed]);
    ({
      state: hen.etat,
      target: hen.targetDecoy === seed,
      pecking: hen.picore,
      forceIsFinite: Number.isFinite(hen.lastForces.decoy.x) &&
        Number.isFinite(hen.lastForces.decoy.y)
    });
  `, createScene());

  assert.equal(result.state, 'peck');
  assert.equal(result.target, true);
  assert.equal(result.pecking, true);
  assert.equal(result.forceIsFinite, true);
});

test('une poule qui fuit alerte les voisines avec un délai de 5 à 20 frames', () => {
  const result = vm.runInContext(`
    const leader = new Hen(100, 100);
    const neighbour = new Hen(230, 100);
    const nextNeighbour = new Hen(350, 100);
    leader.rayonDetection = 20;
    neighbour.rayonDetection = 5;
    nextNeighbour.rayonDetection = 5;
    const hens = [leader, neighbour, nextNeighbour];
    const snake = { head: new Vehicle(105, 100) };
    snake.head.vel.set(1, 0);

    leader.applyBehaviors(snake, [], hens);
    const scheduledDelay = neighbour.alertAtFrame - frameCount;
    const leaderCalls = leader.callFrames;
    let remainedCalm = true;
    for (let elapsed = 1; elapsed < scheduledDelay; elapsed++) {
      frameCount++;
      neighbour.applyBehaviors(null, [], hens);
      remainedCalm = remainedCalm && neighbour.etat !== 'flee';
    }
    frameCount++;
    neighbour.applyBehaviors(null, [], hens);
    const secondDelay = nextNeighbour.alertAtFrame - frameCount;
    for (let elapsed = 1; elapsed < secondDelay; elapsed++) {
      frameCount++;
      nextNeighbour.applyBehaviors(null, [], hens);
    }
    frameCount++;
    nextNeighbour.applyBehaviors(null, [], hens);

    ({
      sourceState: leader.etat,
      neighbourState: neighbour.etat,
      nextState: nextNeighbour.etat,
      scheduledDelay,
      secondDelay,
      leaderCalls,
      remainedCalm,
      finite: hens.every(hen => [hen.pos.x, hen.pos.y, hen.vel.x, hen.vel.y].every(Number.isFinite))
    });
  `, createScene());
  assert.equal(result.sourceState, 'flee');
  assert.equal(result.neighbourState, 'flee');
  assert.equal(result.nextState, 'flee');
  assert.ok(result.scheduledDelay >= 5 && result.scheduledDelay <= 20);
  assert.ok(result.secondDelay >= 5 && result.secondDelay <= 20);
  assert.equal(result.leaderCalls, 40);
  assert.equal(result.remainedCalm, true);
  assert.equal(result.finite, true);
});

test('une poule contourne un obstacle ajouté pendant son déplacement', () => {
  const result = vm.runInContext(`
    const hen = new Hen(100, 200);
    hen.vel.set(2, 0);
    hen.maxSpeed = 2.5;
    hen.vitesseNormale = 2.5;
    const obstacles = [];
    let minClearance = Infinity;
    let finite = true;
    for (let frame = 0; frame < 300; frame++) {
      if (frame === 10) {
        obstacles.push({ pos: new p5.Vector(hen.pos.x + 65, hen.pos.y), r: 30 });
      }
      hen.applyBehaviors(null, obstacles, [hen]);
      if (obstacles.length) {
        const obstacle = obstacles[0];
        const clearance = p5.Vector.dist(hen.pos, obstacle.pos);
        minClearance = Math.min(minClearance, clearance);
      }
      finite = finite && [hen.pos.x, hen.pos.y, hen.vel.x, hen.vel.y].every(Number.isFinite);
    }
    ({ minClearance, required: obstacles[0].r + hen.r, finite });
  `, createScene());
  assert.ok(result.minClearance > result.required - 1, `obstacle clearance was ${result.minClearance}`);
  assert.equal(result.finite, true);
});

test('Hen.spawn choisit un emplacement libre des obstacles et du serpent', () => {
  const result = vm.runInContext(`
    const snake = { head: new Vehicle(400, 300) };
    const obstacles = [{ pos: new p5.Vector(100, 100), r: 50 }];
    const hen = Hen.spawn(obstacles, snake);
    ({
      radius: hen.r,
      obstacleDistance: p5.Vector.dist(hen.pos, obstacles[0].pos),
      snakeDistance: p5.Vector.dist(hen.pos, snake.head.pos)
    });
  `, createScene());
  assert.equal(result.radius, 12);
  assert.ok(result.obstacleDistance >= 62);
  assert.ok(result.snakeDistance >= 152);
});

test('Hen.spawn cherche un autre emplacement si ses essais aléatoires tombent dans un obstacle', () => {
  const result = vm.runInContext(`
    const obstacle = { pos: new p5.Vector(400, 300), r: 80 };
    const hen = Hen.spawn([obstacle], null);
    ({
      x: hen.pos.x,
      y: hen.pos.y,
      obstacleDistance: p5.Vector.dist(hen.pos, obstacle.pos)
    });
  `, createScene());
  assert.ok(result.obstacleDistance >= 92);
});

test('Hen.spawn signale explicitement quand aucun emplacement ne convient', () => {
  const context = createScene();
  assert.throws(
    () => vm.runInContext(`
      Hen.spawn([{ pos: new p5.Vector(400, 300), r: 1000 }], null);
    `, context),
    /Impossible de trouver une position libre/
  );
});

test('Hen.show dessine la poule et limite le cercle de détection au mode debug', () => {
  const context = createScene();
  vm.runInContext('new Hen(100, 100).show();', context);
  assert.equal(context.drawCalls.filter(call => call === 'ellipse').length >= 3, true);
  assert.equal(context.drawCalls.includes('circle'), true);

  context.drawCalls.length = 0;
  vm.runInContext(`
    debug = true;
    const hen = new Hen(100, 100);
    hen.lastForces = {
      avoid: createVector(0.1, 0),
      separate: createVector(0, 0.1),
      boundaries: createVector(0, 0),
      flee: null,
      wander: createVector(-0.1, 0)
    };
    hen.show();
  `, context);
  assert.ok(context.drawCalls.filter(call => call === 'circle').length >= 2);
  assert.ok(context.drawCalls.includes('line'));
  assert.ok(context.drawCalls.includes('arc'));
});
