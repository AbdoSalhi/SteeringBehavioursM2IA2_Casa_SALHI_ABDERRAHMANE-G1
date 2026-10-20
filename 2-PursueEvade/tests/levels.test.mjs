import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function createLevelScene(saved = null) {
  const values = new Map();
  if (saved) {
    values.set('serpentPoulesProgression', JSON.stringify(saved));
  }
  const context = vm.createContext({
    console,
    snake: { segments: new Array(35) },
    localStorage: {
      getItem(key) { return values.get(key) || null; },
      setItem(key, value) { values.set(key, value); }
    }
  });

  for (const file of ['levels.js', 'objective.js', 'level.js']) {
    vm.runInContext(
      readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'),
      context
    );
  }
  return { context, values };
}

test('les niveaux configurent bien les effectifs, vitesses et obstacles attendus', () => {
  const { context } = createLevelScene();
  const levels = vm.runInContext('LEVELS', context);
  assert.equal(levels.length, 10);
  assert.equal(levels[0].nom, 'Le Poulailler');
  assert.equal(levels[0].poules, 6);
  assert.equal(levels[0].henSpeedMult, 0.8);
  assert.equal(levels[0].objectif.cible, 5);
  assert.equal(levels[1].nom, 'Les Rochers');
  assert.equal(levels[1].poules, 10);
  assert.equal(levels[1].budgetObstacles, 5);
  assert.equal(levels[1].objectif.temps, 60);
  assert.equal(levels[1].obstacles.length, 5);
  assert.equal(levels[2].nom, 'Le Troupeau');
  assert.equal(levels[2].poules, 12);
  assert.equal(levels[2].henSpeedMult, 0.95);
  assert.equal(levels[2].budgetObstacles, 4);
  assert.equal(levels[2].objectif.cible, 10);
  assert.equal(levels[2].objectif.temps, 90);
  assert.equal(levels[2].groupeSerre, true);
  assert.equal(levels[4].nom, 'La Mare');
  assert.equal(levels[4].poules, 10);
  assert.equal(levels[4].objectif.cible, 10);
  assert.equal(levels[4].objectif.temps, 80);
  assert.equal(levels[4].zones.length, 2);
  assert.equal(levels[5].nom, "L'Aigle");
  assert.equal(levels[5].poules, 10);
  assert.equal(levels[5].henSpeedMult, 1);
  assert.equal(levels[5].aigle, true);
  assert.equal(levels[5].energie, true);
  assert.equal(levels[5].zones.filter(zone => zone.type === 'buisson').length, 2);
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[5].objectif)),
    { type: 'survivre', temps: 90, minManger: 6 }
  );
  assert.equal(levels[6].nom, 'Le Berger');
  assert.equal(levels[6].poules, 10);
  assert.equal(levels[6].henSpeedMult, 0.9);
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[6].objectif)),
    { type: 'enclos', cible: 8, temps: 120 }
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[6].leurres)),
    ['fakeSnake']
  );
  assert.equal(levels[6].maxDecoys, 2);
  assert.equal(levels[6].energie, undefined);
  assert.equal(levels[7].nom, 'La Nuit');
  assert.equal(levels[7].poules, 12);
  assert.equal(levels[7].henSpeedMult, 1);
  assert.equal(levels[7].budgetObstacles, 5);
  assert.equal(levels[7].nuit, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[7].objectif)),
    { type: 'manger', cible: 10, temps: 100 }
  );
  assert.equal(levels[8].nom, 'La Tempête');
  assert.equal(levels[8].poules, 12);
  assert.equal(levels[8].henSpeedMult, 1.05);
  assert.equal(levels[8].budgetObstacles, 4);
  assert.equal(levels[8].boulders, 4);
  assert.equal(levels[8].energie, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[8].objectif)),
    { type: 'manger', cible: 12, temps: 110 }
  );
  assert.equal(levels[9].nom, 'La Reine');
  assert.equal(levels[9].reine, true);
  assert.equal(levels[9].gardes, 6);
  assert.equal(levels[9].poules, 6);
  assert.equal(levels[9].energie, true);
  assert.equal(levels[9].perteEnergie, 1.25);
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[9].leurres)),
    ['fakeSnake', 'seed']
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(levels[9].objectif)),
    { type: 'reine', temps: 120 }
  );
});

test('Objective enclos suit les poules présentes et échoue à la limite de temps', () => {
  const { context } = createLevelScene();
  const result = vm.runInContext(`
    const objective = new Objective({ type: 'enclos', cible: 8, temps: 120 });
    objective.start(0);
    objective.current = 4;
    objective.update(60000);
    const halfway = {
      label: objective.label(),
      progress: objective.progress(),
      done: objective.isDone(),
      failed: objective.isFailed()
    };
    objective.current = 8;
    const done = objective.isDone();
    objective.current = 4;
    objective.update(120000);
    JSON.stringify({ halfway, done, failed: objective.isFailed() });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    halfway: {
      label: "Rentrer 8 poules dans l'enclos : 4/8",
      progress: 0.5,
      done: false,
      failed: false
    },
    done: true,
    failed: true
  });
});

test('Objective reine réussit à la capture et échoue après 120 secondes', () => {
  const { context } = createLevelScene();
  const result = vm.runInContext(`
    const objective = new Objective({ type: 'reine', temps: 120 });
    objective.start(0);
    objective.update(60000);
    const beforeCapture = {
      label: objective.label(),
      progress: objective.progress(),
      done: objective.isDone(),
      failed: objective.isFailed()
    };
    objective.addProgress(1);
    objective.update(70000);
    const afterCapture = {
      label: objective.label(),
      progress: objective.progress(),
      done: objective.isDone(),
      failed: objective.isFailed()
    };
    const timedOut = new Objective({ type: 'reine', temps: 120 });
    timedOut.start(0);
    timedOut.update(120000);
    JSON.stringify({ beforeCapture, afterCapture, timedOut: timedOut.isFailed() });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    beforeCapture: {
      label: 'Capturer la reine',
      progress: 0,
      done: false,
      failed: false
    },
    afterCapture: {
      label: 'Reine capturée !',
      progress: 1,
      done: true,
      failed: false
    },
    timedOut: true
  });
});

test('Objective survivre exige durée et captures, mais échoue à énergie nulle', () => {
  const { context } = createLevelScene();
  const result = vm.runInContext(`
    const objective = new Objective({
      type: 'survivre',
      temps: 90,
      minManger: 6
    });
    objective.start(0);
    objective.addProgress(3);
    objective.update(45000, 75);
    const halfway = {
      label: objective.label(),
      progress: objective.progress(),
      done: objective.isDone(),
      failed: objective.isFailed()
    };
    objective.addProgress(3);
    objective.update(90000, 25);
    const completed = objective.isDone();

    const exhausted = new Objective({
      type: 'survivre',
      temps: 90,
      minManger: 6
    });
    exhausted.start(0);
    exhausted.update(1000, 0);
    JSON.stringify({ halfway, completed, energyFailure: exhausted.isFailed() });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    halfway: {
      label: 'Survivre 90 s et manger 6 poules : 3/6 · 00:45',
      progress: 0.5,
      done: false,
      failed: false
    },
    completed: true,
    energyFailure: true
  });
});

test('Objective calcule label, progression, réussite et expiration chronométrée', () => {
  const { context } = createLevelScene();
  const result = vm.runInContext(`
    const objective = new Objective({ type: 'manger', cible: 5, temps: 60 });
    objective.start(1000);
    objective.addProgress(2);
    objective.update(31000);
    ({
      label: objective.label(),
      progress: objective.progress(),
      beforeTimeout: objective.isFailed(),
      done: objective.isDone()
    });
  `, context);
  assert.equal(result.label, 'Manger 5 poules : 2/5');
  assert.equal(result.progress, 0.4);
  assert.equal(result.beforeTimeout, false);
  assert.equal(result.done, false);

  const expired = vm.runInContext(`
    const timedObjective = new Objective({ type: 'manger', cible: 1, temps: 60 });
    timedObjective.start(0);
    timedObjective.update(60000);
    timedObjective.isFailed();
  `, context);
  assert.equal(expired, true);
});

test('une réussite à la limite du temps prévaut sur le timeout', () => {
  const { context } = createLevelScene({ maxUnlocked: 1, stars: {} });
  const state = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(1);
    manager.start(0);
    manager.recordHenEaten(8);
    manager.update(60000);
    manager.state;
  `, context);
  assert.equal(state, 'victoire');
});

test('le Berger ne perd pas par énergie alors que les niveaux énergétiques la surveillent', () => {
  const { context } = createLevelScene({ maxUnlocked: 6, stars: {} });
  const states = vm.runInContext(`
    const shepherd = new LevelManager();
    shepherd.load(6);
    shepherd.start(0);
    shepherd.recordPenCount(8);
    shepherd.update(120000, Infinity);

    const eagle = new LevelManager();
    eagle.load(5);
    eagle.start(0);
    eagle.update(1000, 0);
    JSON.stringify({ shepherd: shepherd.state, eagle: eagle.state });
  `, context);
  assert.deepEqual(JSON.parse(states), {
    shepherd: 'victoire',
    eagle: 'defaite'
  });
});

test('le niveau 2 reste verrouillé jusqu’à la victoire et la progression est persistée', () => {
  const { context, values } = createLevelScene();
  const result = vm.runInContext(`
    const manager = new LevelManager();
    const lockedBefore = manager.load(1);
    manager.load(0);
    manager.start(1000);
    manager.recordHenEaten(5);
    manager.update(2000);
    const result = {
      lockedBefore,
      stateAtVictory: manager.state,
      stars: manager.finalStars,
      unlocked: manager.canAccess(1),
      nextLoaded: manager.next(),
      nextState: manager.state,
      nextIndex: manager.levelIndex
    };
    JSON.stringify(result);
  `, context);
  const parsedResult = JSON.parse(result);
  assert.equal(parsedResult.lockedBefore, false);
  assert.equal(parsedResult.stateAtVictory, 'victoire');
  assert.equal(parsedResult.stars, 3);
  assert.equal(parsedResult.unlocked, true);
  assert.equal(parsedResult.nextLoaded, true);
  assert.equal(parsedResult.nextState, 'intro');
  assert.equal(parsedResult.nextIndex, 1);

  const { context: reloaded } = createLevelScene(
    JSON.parse(values.get('serpentPoulesProgression'))
  );
  const persisted = vm.runInContext(
    'new LevelManager().canAccess(1)',
    reloaded
  );
  assert.equal(persisted, true);
});

test('le budget d’obstacles refuse les poses au-delà de la limite', () => {
  const { context } = createLevelScene({ maxUnlocked: 1, stars: {} });
  const budget = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(1);
    const attempts = Array.from({ length: 6 }, () => manager.useObstacleBudget());
    JSON.stringify({ attempts, remaining: manager.obstacleBudgetRemaining });
  `, context);
  assert.deepEqual(JSON.parse(budget), {
    attempts: [true, true, true, true, true, false],
    remaining: 0
  });
});

test('la victoire du niveau 3 débloque le niveau 4 à venir et persiste cette progression', () => {
  const { context, values } = createLevelScene({ maxUnlocked: 2, stars: {} });
  const result = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(2);
    manager.start(1000);
    manager.recordHenEaten(10);
    manager.update(2000);
    JSON.stringify({
      state: manager.state,
      maxUnlocked: manager.progression.maxUnlocked,
      level4Unlocked: manager.isUnlocked(3),
      level4Playable: manager.canAccess(3),
      level5Locked: !manager.canAccess(4)
    });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    state: 'victoire',
    maxUnlocked: 3,
    level4Unlocked: true,
    level4Playable: true,
    level5Locked: true
  });
  assert.equal(JSON.parse(values.get('serpentPoulesProgression')).maxUnlocked, 3);
});

test('la victoire du niveau 5 débloque le niveau 6 après survie et six captures', () => {
  const { context, values } = createLevelScene({ maxUnlocked: 4, stars: {} });
  const result = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(4);
    manager.start(0);
    manager.recordHenEaten(10);
    manager.update(80000, 100);
    const levelSixLoaded = manager.next();
    manager.start(80000);
    manager.recordHenEaten(6);
    manager.update(170000, 50);
    JSON.stringify({
      state: manager.state,
      levelSixLoaded,
      unlocked: manager.canAccess(5),
      maxUnlocked: manager.progression.maxUnlocked
    });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    state: 'victoire',
    levelSixLoaded: true,
    unlocked: true,
    maxUnlocked: 6
  });
  assert.equal(JSON.parse(values.get('serpentPoulesProgression')).maxUnlocked, 6);
});

test('l’énergie nulle entraîne une défaite même si l’objectif de survie est rempli', () => {
  const { context } = createLevelScene({ maxUnlocked: 5, stars: {} });
  const state = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(5);
    manager.start(0);
    manager.recordHenEaten(6);
    manager.update(90000, 0);
    manager.state;
  `, context);
  assert.equal(state, 'defaite');
});

test('le berger gagne quand huit poules sont dans l’enclos et débloque le niveau suivant', () => {
  const { context, values } = createLevelScene({ maxUnlocked: 6, stars: {} });
  const result = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(6);
    manager.start(0);
    manager.recordPenCount(8);
    manager.update(30000, 80);
    JSON.stringify({
      state: manager.state,
      progress: manager.objective.progress(),
      nextUnlocked: manager.canAccess(7),
      stars: manager.finalStars,
      maxUnlocked: manager.progression.maxUnlocked
    });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    state: 'victoire',
    progress: 1,
    nextUnlocked: true,
    stars: 3,
    maxUnlocked: 7
  });
  assert.equal(JSON.parse(values.get('serpentPoulesProgression')).maxUnlocked, 7);
});

test('la victoire de La Nuit débloque La Tempête après douze captures', () => {
  const { context, values } = createLevelScene({ maxUnlocked: 7, stars: {} });
  const result = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(7);
    manager.start(0);
    manager.recordHenEaten(12);
    manager.update(50000, 70);
    JSON.stringify({
      state: manager.state,
      nextUnlocked: manager.canAccess(8),
      maxUnlocked: manager.progression.maxUnlocked
    });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    state: 'victoire',
    nextUnlocked: true,
    maxUnlocked: 8
  });
  assert.equal(JSON.parse(values.get('serpentPoulesProgression')).maxUnlocked, 8);
});

test('capturer la reine termine le jeu et conserve le score et les étoiles totaux', () => {
  const { context, values } = createLevelScene({
    maxUnlocked: 9,
    stars: { 0: 1, 8: 2 }
  });
  const result = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(9);
    manager.start(0);
    manager.recordScore(17);
    manager.recordQueenCaptured();
    manager.update(20000, 80);
    JSON.stringify({
      state: manager.state,
      finalScore: manager.finalScore,
      stars: manager.totalStars(),
      finalStars: manager.finalStars,
      levelStars: manager.progression.stars['9'],
      queenProgress: manager.objective.progress()
    });
  `, context);
  assert.deepEqual(JSON.parse(result), {
    state: 'fin',
    finalScore: 17,
    stars: 6,
    finalStars: 3,
    levelStars: 3,
    queenProgress: 1
  });
  assert.equal(JSON.parse(values.get('serpentPoulesProgression')).stars['9'], 3);
});

test('le temps du niveau ne défile pas pendant une pause', () => {
  const { context } = createLevelScene({ maxUnlocked: 1, stars: {} });
  const state = vm.runInContext(`
    const manager = new LevelManager();
    manager.load(1);
    manager.start(0);
    manager.togglePause(10000);
    manager.togglePause(20000);
    manager.update(69000);
    const beforeActiveTimeout = manager.state;
    manager.update(71000);
    JSON.stringify({ beforeActiveTimeout, afterActiveTimeout: manager.state });
  `, context);
  assert.deepEqual(JSON.parse(state), {
    beforeActiveTimeout: 'jeu',
    afterActiveTimeout: 'defaite'
  });
});
