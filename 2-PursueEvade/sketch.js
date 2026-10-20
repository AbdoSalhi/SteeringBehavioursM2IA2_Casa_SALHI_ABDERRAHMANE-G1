let snake;
let eagle = null;
let pen = null;
let queen = null;
let hens = [];
let obstacles = [];
let boulders = [];
const avoidanceObstacles = [];
let zones = [];
let decoys = [];
let score = 0;
let debug = false;
let levelManager;
let selectedLevelIndex = 0;
let menuCards = [];
let hudMessage = "";
let hudMessageUntil = 0;

let pointerTarget;
let respawnQueue = [];
let targetCountSlider;
let targetSizeSlider;
let targetSpeedSlider;
let targetForceSlider;
let snakeForceSlider;
let nextObstacleRadius = 40;
let obstaclePreview;
let decoyPreview;
let desiredHenCount = 12;
let selectedDecoyType = "seed";
let lastDecoyPlacementFrame = -Infinity;
const MAX_DECOYS = 5;
const DECOY_COOLDOWN_FRAMES = 120;
let tuningControls;
let avoidWeightSlider;
let snakeSpeedSlider;
let henDetectionSlider;
let avoidLookAheadSlider;

function setup() {
  const scene = document.getElementById('scene');
  const canvas = createCanvas(windowWidth, windowHeight).parent(scene);
  canvas.elt.addEventListener('contextmenu', event => event.preventDefault());
  pixelDensity(1);

  pointerTarget = createVector(width * 0.5, height * 0.5);
  nextObstacleRadius = random(20, 80);
  obstaclePreview = new Obstacle(0, 0, nextObstacleRadius);
  decoyPreview = new Decoy(selectedDecoyType, 0, 0);
  snake = new Snake(width * 0.5, height * 0.5);

  targetCountSlider = document.getElementById('target-count');
  targetSizeSlider = document.getElementById('target-size');
  targetSpeedSlider = document.getElementById('target-speed');
  targetForceSlider = document.getElementById('target-force');
  snakeForceSlider = document.getElementById('snake-force');

  bindSlider(targetCountSlider, value => resizeHens(value), String);
  bindSlider(targetSizeSlider, value => hens.forEach(hen => hen.r = value), String);
  bindSlider(targetSpeedSlider, value => hens.forEach(hen => {
    const speedMultiplier = levelManager && levelManager.level
      ? levelManager.level.henSpeedMult
      : 1;
    hen.maxSpeed = value * speedMultiplier;
    hen.vitesseNormale = hen.maxSpeed;
  }), String);
  bindSlider(targetForceSlider, value => hens.forEach(hen => hen.maxForce = value), value => value.toFixed(2));
  bindSlider(snakeForceSlider, value => snake.head.maxForce = value, value => value.toFixed(2));
  createTuningControls();
  levelManager = new LevelManager(applyLevel);
}

function draw() {
  drawBackground();

  const controls = document.getElementById('controls');
  const gameVisible = levelManager &&
    (levelManager.state === "jeu" || levelManager.state === "pause");
  controls.style.display = gameVisible ? "flex" : "none";
  if (tuningControls) {
    tuningControls.style('display', gameVisible ? 'grid' : 'none');
  }

  if (!levelManager || levelManager.state === "menu") {
    drawLevelMenu();
    return;
  }
  if (levelManager.state === "intro") {
    drawLevelIntro();
    return;
  }
  if (levelManager.state === "victoire") {
    drawLevelVictory();
    return;
  }
  if (levelManager.state === "defaite") {
    drawLevelDefeat();
    return;
  }
  if (levelManager.state === "fin") {
    drawFinalGame();
    return;
  }

  drawGame();
}

function drawGame() {
  zones.forEach(zone => zone.show());
  if (pen) {
    pen.show();
  }
  obstacles.forEach(obstacle => obstacle.show());
  drawObstaclePreview();
  drawDecoyPreview();
  if (levelManager.state === "jeu") {
    boulders.forEach(boulder => boulder.update());
  }
  refreshAvoidanceObstacles();
  boulders.forEach(boulder => boulder.show());

  if (levelManager.state === "jeu") {
    if (!pen) {
      respawnReadyHens();
    }
    for (const decoy of decoys) {
      decoy.update(avoidanceObstacles);
    }

    snake.head.speedFactor(zones, snake.head.baseMaxSpeed);
    // Les poules se déplacent d'abord et fuient la tête du serpent.
    if (queen && !queen.captured) {
      queen.applyBehaviors(snake, avoidanceObstacles, hens, decoys, zones);
    }
    hens.forEach(hen => {
      hen.applyBehaviors(snake, avoidanceObstacles, hens, decoys, zones, pen);
      if (henInNightHalo(hen)) {
        hen.show();
      }
    });
    if (queen && henInNightHalo(queen)) {
      queen.show();
    }
    for (const decoy of decoys) {
      decoy.consume(hens);
    }
    for (let i = decoys.length - 1; i >= 0; i--) {
      if (decoys[i].isExpired()) {
        decoys.splice(i, 1);
      }
    }
    decoys.forEach(decoy => decoy.show());

    // Le serpent suit le curseur, évite les obstacles et mange les poules touchées.
    snake.head.maxForce = Number(snakeForceSlider.value);
    snake.update(pointerTarget, avoidanceObstacles, decoys, hens, zones);
    if (levelManager.level.energie) {
      snake.updateEnergy(deltaTime / 1000);
    }
    checkBoulderCollisions();

    const guardsEaten = queen && !pen ? snake.eatGuards(hens) : 0;
    const hensEaten = pen || queen ? 0 : snake.eat(hens);
    const decoysEaten = pen ? 0 : snake.eatDecoys(decoys);
    const queenCaptured = queen && !pen ? snake.captureQueen(queen) : false;
    score = snake.score;
    const pointsGagnes = hensEaten + decoysEaten + (queenCaptured ? 1 : 0);
    if (pointsGagnes > 0) {
      levelManager.recordScore(pointsGagnes);
    }
    if (hensEaten > 0) {
      levelManager.recordHenEaten(hensEaten);
      updateScoreOutput();
      for (let i = 0; i < hensEaten; i++) {
        respawnQueue.push(millis() + 1000);
      }
    } else if (decoysEaten > 0) {
      updateScoreOutput();
    }
    if (guardsEaten > 0) {
      hudMessage = `Garde mangé : +${guardsEaten * 10} énergie, aucun point.`;
      hudMessageUntil = millis() + 1600;
    }
    if (queenCaptured) {
      levelManager.recordQueenCaptured();
      updateScoreOutput();
    }

    if (eagle) {
      eagle.applyBehaviors(snake, avoidanceObstacles);
      if (eagle.attackOccurred) {
        levelManager.recordDamage(1);
        hudMessage = "L'aigle attaque ! -4 segments, -30 énergie.";
        hudMessageUntil = millis() + 2000;
      }
      eagle.show();
    }
    if (pen) {
      levelManager.recordPenCount(
        hens.reduce((count, hen) => count + (pen.contains(hen.pos) ? 1 : 0), 0)
      );
    }
    snake.show();
    levelManager.update(
      millis(),
      levelManager.level.energie ? snake.energy : Infinity
    );
  } else {
    decoys.forEach(decoy => decoy.show());
    hens.forEach(hen => {
      if (henInNightHalo(hen)) {
        hen.show();
      }
    });
    if (eagle) {
      eagle.show();
    }
    if (queen) {
      queen.show();
    }
    snake.show();
  }

  drawNightOverlay();
  drawHud();
}

function refreshAvoidanceObstacles() {
  avoidanceObstacles.length = 0;
  avoidanceObstacles.push(...obstacles, ...boulders);
}

function checkBoulderCollisions() {
  for (const boulder of boulders) {
    const dx = snake.head.pos.x - boulder.pos.x;
    const dy = snake.head.pos.y - boulder.pos.y;
    const radius = snake.head.r + boulder.r;
    if (dx * dx + dy * dy < radius * radius &&
      snake.takeDamage(20, 3, millis())) {
      levelManager.recordDamage(1);
      hudMessage = "Un rocher frappe le serpent ! -3 segments, -20 énergie.";
      hudMessageUntil = millis() + 2000;
      return;
    }
  }
}

function drawBackground() {
  background(isNightLevel() ? '#050c18' : '#1d3325');
}

function isNightLevel() {
  return Boolean(levelManager && levelManager.level && levelManager.level.nuit);
}

function henInNightHalo(hen) {
  if (!isNightLevel() || !snake) {
    return true;
  }
  const dx = hen.pos.x - snake.head.pos.x;
  const dy = hen.pos.y - snake.head.pos.y;
  const rayonHalo = 250;
  return dx * dx + dy * dy <= rayonHalo * rayonHalo;
}

function drawNightOverlay() {
  if (!isNightLevel() || !snake || !drawingContext.createRadialGradient) {
    return;
  }

  const { x, y } = snake.head.pos;
  const gradient = drawingContext.createRadialGradient(x, y, 18, x, y, 300);
  gradient.addColorStop(0, 'rgba(160, 190, 255, 0.14)');
  gradient.addColorStop(0.2, 'rgba(75, 110, 190, 0.08)');
  gradient.addColorStop(0.58, 'rgba(4, 10, 24, 0.38)');
  gradient.addColorStop(1, 'rgba(4, 10, 24, 0.96)');
  drawingContext.save();
  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(0, 0, width, height);
  drawingContext.restore();
}

function drawLevelMenu() {
  menuCards = [];
  push();
  textAlign(CENTER, CENTER);
  fill('#f1f4df');
  textSize(34);
  const titleY = Math.max(55, height * 0.15);
  text('Le serpent et les poules', width / 2, titleY);
  fill('#c8d5c8');
  textSize(16);
  const subtitleY = Math.max(95, height * 0.22);
  text('Choisissez un niveau', width / 2, subtitleY);

  const columns = width < 420 ? 1 : 2;
  const gap = height < 500 ? 10 : 18;
  const rows = Math.ceil(LEVELS.length / columns);
  const top = Math.max(110, subtitleY + 25);
  const cardHeight = Math.min(
    112,
    Math.max(64, (height - top - 60 - gap * (rows - 1)) / rows)
  );
  const cardWidth = Math.min(360, (width - 48 - gap * (columns - 1)) / columns);
  const gridWidth = columns * cardWidth + (columns - 1) * gap;
  const left = (width - gridWidth) / 2;

  for (let i = 0; i < LEVELS.length; i++) {
    const column = i % columns;
    const row = Math.floor(i / columns);
    const x = left + column * (cardWidth + gap);
    const y = top + row * (cardHeight + gap);
    const unlocked = levelManager.isUnlocked(i);
    const available = levelManager.canAccess(i);
    menuCards.push({ index: i, x, y, width: cardWidth, height: cardHeight, unlocked, available });
    stroke(unlocked ? '#9ab67c' : '#586357');
    strokeWeight(2);
    fill(unlocked ? '#2d4933' : '#29332d');
    rect(x, y, cardWidth, cardHeight, 12);
    noStroke();
    fill(unlocked ? '#f1f4df' : '#889087');
    textAlign(LEFT, TOP);
    textSize(20);
    const titre = available
      ? `${i + 1}. ${LEVELS[i].nom}`
      : unlocked
        ? `${i + 1}. ${LEVELS[i].nom}`
        : `${i + 1}. 🔒 ${LEVELS[i].nom}`;
    text(titre, x + 18, y + 18);
    textSize(13);
    text(
      available
        ? LEVELS[i].objectif.type === "survivre"
          ? `${LEVELS[i].poules} poules · survivre ${LEVELS[i].objectif.temps} s, manger ${LEVELS[i].objectif.minManger}`
          : LEVELS[i].objectif.type === "reine"
            ? `${LEVELS[i].gardes} gardes · capturer la reine en ${LEVELS[i].objectif.temps} s`
          : LEVELS[i].objectif.type === "enclos"
            ? `${LEVELS[i].poules} poules · rentrer ${LEVELS[i].objectif.cible} en ${LEVELS[i].objectif.temps} s`
          : `${LEVELS[i].poules} poules · ${LEVELS[i].objectif.cible} à manger`
        : unlocked
          ? 'Niveau débloqué, contenu à venir.'
          : 'Terminez le niveau précédent pour le débloquer.',
      x + 18,
      y + 54
    );
    const stars = Number(levelManager.progression.stars[String(i)]) || 0;
    if (unlocked && stars) {
      fill('#f5d36d');
      textSize(18);
      text(`${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, x + 18, y + 78);
    }
  }
  fill('#c8d5c8');
  textAlign(CENTER, CENTER);
  textSize(13);
  text('Cliquez sur un niveau débloqué.', width / 2, Math.min(height - 24, top + rows * (cardHeight + gap) + 10));
  pop();
}

function drawLevelIntro() {
  push();
  textAlign(CENTER, CENTER);
  fill('#f1f4df');
  textSize(36);
  text(`Niveau ${levelManager.levelIndex + 1} : ${levelManager.level.nom}`, width / 2, height * 0.36);
  textSize(20);
  fill('#d8e5cf');
  text(levelManager.objective.label(), width / 2, height * 0.46);
  if (levelManager.level.objectif.temps) {
    fill('#c8d5c8');
    text(`Temps limite : ${levelManager.level.objectif.temps} secondes`, width / 2, height * 0.52);
  }
  fill('#f5d36d');
  textSize(16);
  text('Appuyez sur ENTRÉE pour commencer', width / 2, height * 0.62);
  textSize(13);
  fill('#c8d5c8');
  text('M : menu des niveaux', width / 2, height * 0.68);
  pop();
}

function drawLevelVictory() {
  drawGameSceneFrozen();
  push();
  fill(7, 16, 11, 215);
  noStroke();
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill('#f1f4df');
  textSize(40);
  text('Niveau réussi !', width / 2, height * 0.38);
  fill('#f5d36d');
  textSize(48);
  text(`${'★'.repeat(levelManager.finalStars)}${'☆'.repeat(3 - levelManager.finalStars)}`, width / 2, height * 0.49);
  fill('#d8e5cf');
  textSize(17);
  text(
    levelManager.canAccess(levelManager.levelIndex + 1)
      ? 'ENTRÉE : niveau suivant  |  M : menu'
      : 'ENTRÉE : niveaux débloqués  |  M : menu',
    width / 2,
    height * 0.60
  );
  pop();
}

function drawLevelDefeat() {
  drawGameSceneFrozen();
  push();
  fill(7, 16, 11, 220);
  noStroke();
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill('#f1f4df');
  textSize(40);
  text('Niveau échoué', width / 2, height * 0.42);
  fill('#d8e5cf');
  textSize(17);
  text('R : recommencer  |  M : menu', width / 2, height * 0.54);
  pop();
}

function drawFinalGame() {
  push();
  noStroke();
  fill(7, 16, 11, 235);
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  fill('#f5d36d');
  textSize(46);
  text('La reine est capturée !', width / 2, height * 0.35);
  fill('#f1f4df');
  textSize(24);
  text(`Score total : ${levelManager.finalScore}`, width / 2, height * 0.47);
  fill('#f5d36d');
  textSize(30);
  const totalStars = levelManager.totalStars();
  text(`Étoiles totales : ${totalStars}  ${'★'.repeat(Math.min(totalStars, 30))}`, width / 2, height * 0.55);
  fill('#d8e5cf');
  textSize(17);
  text('ENTRÉE ou M : retour au menu', width / 2, height * 0.67);
  pop();
}

function drawGameSceneFrozen() {
  obstacles.forEach(obstacle => obstacle.show());
  if (pen) {
    pen.show();
  }
  decoys.forEach(decoy => decoy.show());
  hens.forEach(hen => {
    if (henInNightHalo(hen)) {
      hen.show();
    }
  });
  if (eagle) {
    eagle.show();
  }
  snake.show();
  drawNightOverlay();
  drawHud();
}

function drawObstaclePreview() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }
  obstaclePreview.pos.set(mouseX, mouseY);
  obstaclePreview.r = nextObstacleRadius;
  obstaclePreview.show(true);
}

function drawDecoyPreview() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return;
  }
  decoyPreview.pos.set(mouseX, mouseY);
  decoyPreview.show(true);
}

function drawHud() {
  push();
  noStroke();
  fill(8, 17, 12, 205);
  rect(14, 14, 390, 296, 12);
  fill('#f1f4df');
  textAlign(LEFT, TOP);
  textSize(15);
  text(`Niveau ${levelManager.levelIndex + 1} : ${levelManager.level.nom}`, 28, 25);
  textSize(12);
  text(`Score : ${score}   Longueur : ${snake.segments.length + 1}   Poules : ${hens.length}`, 28, 47);
  textSize(11);
  fill('#d8e5cf');
  text(levelManager.objective.label(), 28, 68);
  noStroke();
  fill(40, 55, 43, 230);
  rect(28, 86, 350, 9, 4);
  fill('#9bc878');
  rect(28, 86, 350 * levelManager.objective.progress(), 9, 4);
  textSize(10);
  fill('#c8d5c8');
  text(`Énergie : ${Math.ceil(snake.energy)}/100`, 28, 101);
  fill(40, 55, 43, 230);
  rect(28, 116, 350, 9, 4);
  fill(snake.energy > 30 ? '#e2b64e' : '#df684e');
  rect(28, 116, 350 * snake.energy / 100, 9, 4);
  textSize(10);
  fill('#c8d5c8');
  const tempsRestant = levelManager.objective.temps === null
    ? `Temps : ${formatDuration(levelManager.objective.elapsedMs)}`
    : `Temps restant : ${formatDuration(Math.max(0, levelManager.objective.temps * 1000 - levelManager.objective.elapsedMs))}`;
  const budget = levelManager.obstacleBudgetRemaining === null
    ? 'illimité'
    : String(levelManager.obstacleBudgetRemaining);
  text(`${tempsRestant}   Budget obstacles : ${budget}`, 28, 134);
  text('Souris : guider | clic : obstacle | clic molette/L : leurre', 28, 152);
  text('Maj/clic droit : retirer | C : vider | molette : rayon', 28, 168);
  text('R : recommencer | M : menu | D : debug | Espace : pause', 28, 184);
  text(pen ? 'Le serpent rabat les poules, sans les manger.' : '1 graines | 2 faux serpent | 3 mulot', 28, 200);
  const cooldown = Math.max(
    0,
    (DECOY_COOLDOWN_FRAMES - (frameCount - lastDecoyPlacementFrame)) / 60
  );
  const maxLeurres = levelManager.level.maxDecoys === undefined
    ? MAX_DECOYS
    : levelManager.level.maxDecoys;
  text(`Leurre : ${decoyTypeLabel(selectedDecoyType)} | actifs : ${decoys.length}/${maxLeurres} | délai : ${cooldown.toFixed(1)} s`, 28, 216);
  if (hudMessage && millis() < hudMessageUntil) {
    fill('#ffcf76');
    text(hudMessage, 28, 250);
  }
  if (levelManager.state === "pause") {
    fill(255, 225);
    textAlign(CENTER, CENTER);
    textSize(28);
    text('PAUSE', width / 2, height / 2);
  }
  pop();
}

function mouseClicked() {
  if (levelManager && levelManager.state === "menu") {
    const card = menuCards.find(item =>
      mouseX >= item.x &&
      mouseX <= item.x + item.width &&
      mouseY >= item.y &&
      mouseY <= item.y + item.height
    );
    if (card && card.available) {
      selectedLevelIndex = card.index;
      levelManager.load(card.index);
    }
    return false;
  }
  if (levelManager && levelManager.state !== "jeu") {
    return false;
  }
  if (typeof CENTER !== 'undefined' && mouseButton === CENTER) {
    return false;
  }
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    return false;
  }
  pointerTarget.set(mouseX, mouseY);

  if (mouseButton === RIGHT || keyIsDown(SHIFT)) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (!obstacles[i].levelObstacle && obstacles[i].contains(mouseX, mouseY)) {
        obstacles.splice(i, 1);
        break;
      }
    }
    return false;
  }

  if (snake.containsPoint(mouseX, mouseY, nextObstacleRadius)) {
    return false;
  }

  const henNearClick = hens.some(hen => {
    const dx = hen.pos.x - mouseX;
    const dy = hen.pos.y - mouseY;
    const radius = nextObstacleRadius + hen.r;
    return dx * dx + dy * dy < radius * radius;
  });
  if (!henNearClick) {
    if (levelManager && !levelManager.useObstacleBudget()) {
      hudMessage = "Budget d'obstacles épuisé.";
      hudMessageUntil = millis() + 1500;
    } else {
      obstacles.push(new Obstacle(mouseX, mouseY, nextObstacleRadius));
    }
  }
  return false;
}

function mousePressed() {
  if (levelManager && levelManager.state === "jeu" &&
    typeof CENTER !== 'undefined' && mouseButton === CENTER) {
    pointerTarget.set(mouseX, mouseY);
    placeDecoy();
    return false;
  }
}

function mouseWheel(event) {
  if (levelManager && levelManager.state !== "jeu") {
    return false;
  }
  nextObstacleRadius = constrain(
    nextObstacleRadius + (event.delta > 0 ? -5 : 5),
    20,
    80
  );
  return false;
}

function mouseMoved() {
  if (levelManager && levelManager.state === "jeu" &&
    pointerTarget && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    pointerTarget.set(mouseX, mouseY);
  }
}

function keyPressed() {
  if (!levelManager) {
    if (key === 'c' || key === 'C') {
      obstacles = [];
    }
    return;
  }
  if (key === 'm' || key === 'M') {
    if (levelManager.levelIndex >= 0) {
      selectedLevelIndex = levelManager.levelIndex;
    }
    levelManager.openMenu();
    return;
  }
  if (levelManager.state === "menu") {
    if (keyCode === ENTER || keyCode === RETURN) {
      if (levelManager.canAccess(selectedLevelIndex)) {
        levelManager.load(selectedLevelIndex);
      }
    }
    return;
  }
  if (levelManager.state === "intro") {
    if (keyCode === ENTER || keyCode === RETURN) {
      levelManager.start(millis());
    }
    return;
  }
  if (levelManager.state === "victoire") {
    if (keyCode === ENTER || keyCode === RETURN) {
      const nextIndex = levelManager.levelIndex + 1;
      levelManager.next();
      if (levelManager.state === "intro") {
        selectedLevelIndex = nextIndex;
      }
    }
    return;
  }
  if (levelManager.state === "fin") {
    levelManager.openMenu();
    return;
  }
  if (levelManager.state === "defaite") {
    if (key === 'r' || key === 'R') {
      levelManager.restart();
    }
    return;
  }

  if (key === 'r' || key === 'R') {
    levelManager.restart();
  } else if (key === 'd' || key === 'D') {
    debug = !debug;
  } else if (key === ' ') {
    levelManager.togglePause(millis());
  } else if (key === 'c' || key === 'C') {
    obstacles = obstacles.filter(obstacle => obstacle.levelObstacle);
  }

  if (levelManager.state !== "jeu") {
    return;
  }
  if (key === '1') {
    selectDecoyType("seed");
  } else if (key === '2') {
    selectDecoyType("fakeSnake");
  } else if (key === '3') {
    selectDecoyType("mouse");
  } else if (key === 'l' || key === 'L') {
    pointerTarget.set(mouseX, mouseY);
    placeDecoy();
  }
}

function selectDecoyType(type) {
  if (!levelManager.level.leurres.includes(type)) {
    hudMessage = "Ce leurre n'est pas autorisé dans ce niveau.";
    hudMessageUntil = millis() + 1500;
    return;
  }
  selectedDecoyType = type;
  decoyPreview = new Decoy(type, 0, 0);
}

function decoyTypeLabel(type) {
  if (type === "fakeSnake") {
    return "faux serpent";
  }
  if (type === "mouse") {
    return "mulot";
  }
  return "graines";
}

function placeDecoy() {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height ||
    !levelManager.level.leurres.includes(selectedDecoyType) ||
    decoys.length >= (levelManager.level.maxDecoys || MAX_DECOYS) ||
    frameCount - lastDecoyPlacementFrame < DECOY_COOLDOWN_FRAMES ||
    obstacles.some(obstacle => {
      const dx = mouseX - obstacle.pos.x;
      const dy = mouseY - obstacle.pos.y;
      const radius = obstacle.r + decoyPreview.r;
      return dx * dx + dy * dy < radius * radius;
    })) {
    return false;
  }

  decoys.push(new Decoy(selectedDecoyType, mouseX, mouseY));
  lastDecoyPlacementFrame = frameCount;
  return true;
}

function applyLevel(level, index) {
  boulders = [];
  avoidanceObstacles.length = 0;
  if (!level.leurres.includes(selectedDecoyType)) {
    selectedDecoyType = level.leurres[0] || "seed";
  }
  pen = level.enclos
    ? new Pen(
      level.enclos.x * width,
      level.enclos.y * height,
      level.enclos.w * width,
      level.enclos.h * height,
      level.enclos.ouverture
    )
    : null;
  if (pen) {
    pen.levelDefinition = level.enclos;
  }
  zones = (level.zones || []).map(definition => {
    const zone = new Zone(
      definition.type,
      definition.x * width,
      definition.y * height,
      definition.r * Math.min(width, height)
    );
    zone.levelDefinition = definition;
    return zone;
  });
  obstacles = level.obstacles.map(definition => {
    const obstacle = new Obstacle(
      definition.x * width,
      definition.y * height,
      definition.r
    );
    obstacle.levelObstacle = true;
    obstacle.levelDefinition = definition;
    return obstacle;
  });
  if (pen) {
    for (const post of pen.fencePosts()) {
      obstacles.push(new PenObstacle(post.x, post.y, post.r));
    }
  }
  refreshAvoidanceObstacles();
  decoys = [];
  eagle = level.aigle
    ? new Eagle(width * 0.78, height * 0.22)
    : null;
  queen = level.reine ? new Queen(width * 0.68, height * 0.5) : null;
  hens = [];
  respawnQueue = [];
  score = 0;
  desiredHenCount = level.poules;
  lastDecoyPlacementFrame = -Infinity;
  snake = new Snake(width * 0.5, height * 0.5);
  snake.energyLossPerSecond = level.perteEnergie === undefined
    ? 2
    : level.perteEnergie;
  pointerTarget = createVector(width * 0.5, height * 0.5);
  hudMessage = "";
  hudMessageUntil = 0;

  if (targetCountSlider) {
    targetCountSlider.value = String(level.poules);
    targetCountSlider.disabled = true;
    document.getElementById('target-count-value').value = String(level.poules);
  }
  const speed = Number(targetSpeedSlider.value) * level.henSpeedMult;
  const centreGroupeX = width * 0.7;
  const centreGroupeY = height * 0.5;
  for (let i = 0; i < level.poules; i++) {
    const hen = createHen();
    hen.maxSpeed = speed;
    hen.vitesseNormale = speed;
    if (queen) {
      const angle = TWO_PI * i / level.poules;
      const distance = 62 + (i % 2) * 12;
      hen.pos.set(
        queen.pos.x + Math.cos(angle) * distance,
        queen.pos.y + Math.sin(angle) * distance
      );
      hen.vel.set(-Math.cos(angle) * speed * 0.6, -Math.sin(angle) * speed * 0.6);
      hen.leader = queen;
    } else if (level.groupeSerre) {
      const angle = random(TWO_PI);
      const distance = Math.sqrt(random()) * 55;
      hen.pos.set(
        centreGroupeX + Math.cos(angle) * distance,
        centreGroupeY + Math.sin(angle) * distance
      );
      const direction = random(0, TWO_PI);
      hen.vel.set(Math.cos(direction) * speed * 0.6, Math.sin(direction) * speed * 0.6);
    }
    hens.push(hen);
  }
  if (queen) {
    queen.speedFactor(zones, queen.vitesseNormale);
  }
  const spawnVehicles = [
    snake.head,
    ...hens,
    ...snake.segments.map(pos => ({ pos, r: 8 }))
  ];
  for (let i = 0; i < (level.boulders || 0); i++) {
    boulders.push(Boulder.spawn(obstacles, spawnVehicles, boulders));
  }
  refreshAvoidanceObstacles();
  if (decoyPreview) {
    decoyPreview = new Decoy(selectedDecoyType, 0, 0);
  }
  applyTuningValues();
  updateScoreOutput();
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function bindSlider(slider, apply, format) {
  const synchronize = () => {
    const value = Number(slider.value);
    document.getElementById(`${slider.id}-value`).value = format(value);
    apply(value);
  };
  slider.addEventListener('input', synchronize);
  synchronize();
}

function createTuningControls() {
  tuningControls = createDiv().addClass('tuning-controls');
  tuningControls.attribute('aria-label', 'Réglages de steering');
  tuningControls.parent(document.body);

  avoidWeightSlider = createTuningSlider(
    'Poids évitement',
    1,
    8,
    4,
    0.5,
    value => {
      snake.avoidWeight = value;
      snake.head.avoidWeight = value;
      hens.forEach(hen => hen.avoidWeight = value);
    },
    value => value.toFixed(1)
  );
  snakeSpeedSlider = createTuningSlider(
    'Vitesse max serpent',
    1,
    8,
    4.5,
    0.5,
    value => {
      snake.head.baseMaxSpeed = value;
      snake.head.maxSpeed = value;
    },
    value => value.toFixed(1)
  );
  henDetectionSlider = createTuningSlider(
    'Détection poules',
    60,
    300,
    160,
    10,
    value => hens.forEach(hen => {
      hen.rayonDetection = value;
      hen.porteeVision = value;
    }),
    value => `${value} px`
  );
  avoidLookAheadSlider = createTuningSlider(
    'Vue avoid',
    40,
    200,
    100,
    10,
    value => {
      snake.head.avoidLookAhead = value;
      hens.forEach(hen => hen.avoidLookAhead = value);
    },
    value => `${value} px`
  );
  applyTuningValues();
}

function createTuningSlider(label, minimum, maximum, initial, step, apply, format) {
  const row = createDiv().addClass('tuning-row');
  row.parent(tuningControls);
  createSpan(label).parent(row);

  const slider = createSlider(minimum, maximum, initial, step);
  slider.addClass('tuning-slider');
  slider.attribute('aria-label', label);
  slider.parent(row);

  const output = createSpan(format(initial)).addClass('tuning-value');
  output.parent(row);
  slider.input(() => {
    const value = Number(slider.value());
    output.html(format(value));
    apply(value);
  });
  return slider;
}

function applyTuningValues() {
  if (!snakeSpeedSlider) {
    return;
  }
  const speed = Number(snakeSpeedSlider.value());
  const avoidanceWeight = Number(avoidWeightSlider.value());
  const detection = Number(henDetectionSlider.value());
  const lookAhead = Number(avoidLookAheadSlider.value());

  snake.head.maxSpeed = speed;
  snake.head.baseMaxSpeed = speed;
  snake.head.avoidWeight = avoidanceWeight;
  snake.head.avoidLookAhead = lookAhead;
  snake.avoidWeight = avoidanceWeight;
  hens.forEach(hen => {
    hen.avoidWeight = avoidanceWeight;
    hen.avoidLookAhead = lookAhead;
    hen.rayonDetection = detection;
    hen.porteeVision = detection;
  });
}

function resizeHens(count) {
  if (levelManager && levelManager.level) {
    if (targetCountSlider) {
      targetCountSlider.value = String(desiredHenCount);
      document.getElementById('target-count-value').value = String(desiredHenCount);
    }
    return;
  }
  const desiredCount = constrain(Math.round(Number(count)), 0, 30);
  desiredHenCount = desiredCount;
  while (hens.length > desiredCount) {
    hens.pop();
  }
  while (hens.length < desiredCount) {
    hens.push(createHen());
  }

  if (targetCountSlider) {
    targetCountSlider.value = String(hens.length);
    document.getElementById('target-count-value').value = String(hens.length);
  }
}

function createHen() {
  const hen = Hen.spawn(avoidanceObstacles, snake);
  if (targetSpeedSlider) {
    const speedMultiplier = levelManager && levelManager.level
      ? levelManager.level.henSpeedMult
      : 1;
    hen.maxSpeed = Number(targetSpeedSlider.value) * speedMultiplier;
    hen.vitesseNormale = hen.maxSpeed;
    hen.maxForce = Number(targetForceSlider.value);
    hen.r = Number(targetSizeSlider.value);
  }
  if (henDetectionSlider) {
    hen.rayonDetection = Number(henDetectionSlider.value());
    hen.porteeVision = Number(henDetectionSlider.value());
    hen.avoidWeight = Number(avoidWeightSlider.value());
    hen.avoidLookAhead = Number(avoidLookAheadSlider.value());
  }
  return hen;
}

function respawnReadyHens() {
  const now = millis();
  for (let i = respawnQueue.length - 1; i >= 0; i--) {
    if (respawnQueue[i] <= now) {
      if (hens.length < desiredHenCount) {
        hens.push(createHen());
      }
      respawnQueue.splice(i, 1);
    }
  }
  if (targetCountSlider) {
    targetCountSlider.value = String(hens.length);
    document.getElementById('target-count-value').value = String(hens.length);
  }
}

function updateScoreOutput() {
  const output = document.getElementById('score-count');
  if (output) {
    output.value = String(score);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pointerTarget.set(constrain(pointerTarget.x, 0, width), constrain(pointerTarget.y, 0, height));
  for (const zone of zones) {
    if (zone.levelDefinition) {
      zone.pos.set(
        zone.levelDefinition.x * width,
        zone.levelDefinition.y * height
      );
      zone.r = zone.levelDefinition.r * Math.min(width, height);
    }
  }
  if (pen && pen.levelDefinition) {
    pen.resize(
      pen.levelDefinition.x * width,
      pen.levelDefinition.y * height,
      pen.levelDefinition.w * width,
      pen.levelDefinition.h * height
    );
    obstacles = obstacles.filter(obstacle => !obstacle.penFence);
    for (const post of pen.fencePosts()) {
      obstacles.push(new PenObstacle(post.x, post.y, post.r));
    }
  }
  for (const obstacle of obstacles) {
    if (obstacle.levelDefinition) {
      obstacle.pos.set(
        obstacle.levelDefinition.x * width,
        obstacle.levelDefinition.y * height
      );
    }
  }
}
