class LevelManager {
  constructor(onLoad, storageKey = "serpentPoulesProgression") {
    this.onLoad = onLoad;
    this.storageKey = storageKey;
    this.state = "menu";
    this.levelIndex = -1;
    this.level = null;
    this.objective = null;
    this.startedAt = null;
    this.damage = 0;
    this.finalStars = 0;
    this.finalScore = 0;
    this.totalScore = 0;
    this.scoreAtLevelStart = 0;
    this.pauseStartedAt = null;
    this.obstacleBudgetRemaining = null;
    this.storageAvailable = true;
    this.progression = this.readProgression();
  }

  readProgression() {
    const empty = { maxUnlocked: 0, stars: {} };
    try {
      if (typeof localStorage === "undefined") {
        this.storageAvailable = false;
        return empty;
      }
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        return empty;
      }
      const parsed = JSON.parse(saved);
      const savedMaxUnlocked = parsed && Number.isInteger(parsed.maxUnlocked)
        ? Math.min(LEVELS.length - 1, Math.max(0, parsed.maxUnlocked))
        : 0;
      const savedStars = parsed && parsed.stars &&
        typeof parsed.stars === "object" && !Array.isArray(parsed.stars)
        ? parsed.stars
        : {};
      const stars = {};
      for (let i = 0; i < LEVELS.length; i++) {
        const value = Number(savedStars[String(i)]);
        if (Number.isFinite(value) && value > 0) {
          stars[String(i)] = Math.min(3, Math.floor(value));
        }
      }
      return { maxUnlocked: savedMaxUnlocked, stars };
    } catch (error) {
      this.storageAvailable = false;
      console.warn("La progression locale n'a pas pu être lue.", error);
      return empty;
    }
  }

  saveProgression() {
    try {
      if (typeof localStorage === "undefined") {
        this.storageAvailable = false;
        return;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.progression));
    } catch (error) {
      this.storageAvailable = false;
      console.warn("La progression locale n'a pas pu être sauvegardée.", error);
    }
  }

  canAccess(index) {
    return Number.isInteger(index) &&
      index >= 0 &&
      index < LEVELS.length &&
      index <= this.progression.maxUnlocked &&
      LEVELS[index].disponible !== false;
  }

  isUnlocked(index) {
    return Number.isInteger(index) &&
      index >= 0 &&
      index < LEVELS.length &&
      index <= this.progression.maxUnlocked;
  }

  load(index) {
    if (!this.canAccess(index)) {
      return false;
    }
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.objective = new Objective(this.level.objectif);
    this.startedAt = null;
    this.damage = 0;
    this.finalStars = 0;
    this.finalScore = 0;
    this.totalScore = 0;
    this.scoreAtLevelStart = 0;
    this.pauseStartedAt = null;
    this.obstacleBudgetRemaining = this.level.budgetObstacles;
    this.state = "intro";
    if (this.onLoad) {
      this.onLoad(this.level, index);
    }
    return true;
  }

  start(nowMs) {
    if (this.state !== "intro") {
      return false;
    }
    this.startedAt = nowMs;
    this.objective.start(nowMs);
    this.state = "jeu";
    return true;
  }

  update(nowMs, energy = Infinity) {
    if (this.state !== "jeu") {
      return;
    }
    this.objective.update(nowMs, energy);
    if (this.objective.energy <= 0) {
      this.state = "defaite";
    } else if (this.objective.isDone()) {
      this.finish(nowMs);
    } else if (this.objective.isFailed()) {
      this.state = "defaite";
    }
  }

  finish(nowMs) {
    const elapsedMs = Math.max(0, nowMs - this.startedAt);
    const maxTimeMs = this.level.objectif.temps
      ? this.level.objectif.temps * 1000
      : 180000;
    const fastEnough = this.level.objectif.type === "survivre" ||
      elapsedMs <= maxTimeMs * 0.5;
    const objectifCible = this.level.objectif.cible === undefined
      ? this.level.objectif.minManger || 0
      : this.level.objectif.cible;
    const objectifAvecCroissance = this.objective.type === "manger" ||
      this.objective.type === "survivre";
    const expectedLength = 21 + objectifCible * 3;
    const sizeReached = !objectifAvecCroissance ||
      (typeof snake !== "undefined" &&
        snake.segments.length + 1 >= expectedLength);
    const penalties = (fastEnough ? 0 : 1) +
      (sizeReached && this.damage === 0 ? 0 : 1);
    this.finalStars = Math.max(1, 3 - penalties);
    const key = String(this.levelIndex);
    this.progression.stars[key] = Math.max(
      Number(this.progression.stars[key]) || 0,
      this.finalStars
    );
    this.progression.maxUnlocked = Math.max(
      this.progression.maxUnlocked,
      Math.min(LEVELS.length - 1, this.levelIndex + 1)
    );
    this.saveProgression();
    if (this.levelIndex === LEVELS.length - 1) {
      this.finalScore = this.totalScore;
      this.state = "fin";
    } else {
      this.state = "victoire";
    }
  }

  recordScore(amount = 1) {
    const points = Math.max(0, Number(amount) || 0);
    this.totalScore += points;
  }

  recordHenEaten(amount = 1) {
    if (this.state === "jeu" && this.objective) {
      this.objective.addProgress(amount);
    }
  }

  recordPenCount(count) {
    if (this.state === "jeu" && this.objective &&
      this.objective.type === "enclos" && Number.isFinite(count)) {
      this.objective.current = Math.min(
        this.objective.cible,
        Math.max(0, Math.floor(count))
      );
    }
  }

  recordQueenCaptured() {
    if (this.state === "jeu" && this.objective &&
      this.objective.type === "reine") {
      this.objective.addProgress(1);
    }
  }

  totalStars() {
    return Object.values(this.progression.stars).reduce(
      (total, stars) => total + Math.max(0, Number(stars) || 0),
      0
    );
  }

  recordDamage(amount = 1) {
    this.damage += Math.max(0, Number(amount) || 0);
  }

  togglePause(nowMs) {
    if (this.state === "jeu") {
      this.state = "pause";
      this.pauseStartedAt = nowMs;
      return;
    }
    if (this.state === "pause") {
      const pauseDuration = Math.max(0, nowMs - this.pauseStartedAt);
      this.startedAt += pauseDuration;
      this.objective.startedAt += pauseDuration;
      this.state = "jeu";
      this.pauseStartedAt = null;
    }
  }

  useObstacleBudget() {
    if (this.obstacleBudgetRemaining === null) {
      return true;
    }
    if (this.obstacleBudgetRemaining <= 0) {
      return false;
    }
    this.obstacleBudgetRemaining--;
    return true;
  }

  restart() {
    const index = this.levelIndex;
    const scoreToPreserve = this.scoreAtLevelStart;
    const loaded = this.load(index);
    if (loaded) {
      this.totalScore = scoreToPreserve;
      this.scoreAtLevelStart = scoreToPreserve;
    }
    return loaded;
  }

  next() {
    const nextIndex = this.levelIndex + 1;
    if (nextIndex < LEVELS.length && this.canAccess(nextIndex)) {
      const scoreToPreserve = this.totalScore;
      const loaded = this.load(nextIndex);
      if (loaded) {
        this.totalScore = scoreToPreserve;
        this.scoreAtLevelStart = scoreToPreserve;
      }
      return loaded;
    }
    this.state = "menu";
    return false;
  }

  openMenu() {
    this.state = "menu";
  }
}
