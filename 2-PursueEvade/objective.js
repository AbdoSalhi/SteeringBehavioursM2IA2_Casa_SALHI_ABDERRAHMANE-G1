const OBJECTIVE_TYPES = {
  manger: {
    label(objective) {
      return `Manger ${objective.cible} poules : ${objective.current}/${objective.cible}`;
    },
    progress(objective) {
      return objective.cible > 0 ? objective.current / objective.cible : 1;
    },
    isDone(objective) {
      return objective.current >= objective.cible;
    },
    isFailed(objective) {
      return !objective.isDone() && objective.temps !== null &&
        objective.elapsedMs >= objective.temps * 1000;
    }
  },
  survivre: {
    label(objective) {
      return `Survivre ${objective.temps} s et manger ${objective.minManger} poules : ` +
        `${objective.current}/${objective.minManger} · ${formatObjectiveTime(objective.elapsedMs)}`;
    },
    progress(objective) {
      const progressionTemps = objective.temps > 0
        ? objective.elapsedMs / (objective.temps * 1000)
        : 1;
      const progressionPoules = objective.minManger > 0
        ? objective.current / objective.minManger
        : 1;
      return Math.min(progressionTemps, progressionPoules);
    },
    isDone(objective) {
      return objective.elapsedMs >= objective.temps * 1000 &&
        objective.current >= objective.minManger;
    },
    isFailed(objective) {
      return objective.energy <= 0 ||
        (objective.elapsedMs >= objective.temps * 1000 &&
          objective.current < objective.minManger);
    }
  },
  enclos: {
    label(objective) {
      return `Rentrer ${objective.cible} poules dans l'enclos : ` +
        `${objective.current}/${objective.cible}`;
    },
    progress(objective) {
      return objective.cible > 0 ? objective.current / objective.cible : 1;
    },
    isDone(objective) {
      return objective.current >= objective.cible;
    },
    isFailed(objective) {
      return !objective.isDone() && objective.temps !== null &&
        objective.elapsedMs >= objective.temps * 1000;
    }
  },
  reine: {
    label(objective) {
      return objective.current > 0 ? "Reine capturée !" : "Capturer la reine";
    },
    progress(objective) {
      return objective.current > 0 ? 1 : 0;
    },
    isDone(objective) {
      return objective.current > 0;
    },
    isFailed(objective) {
      return !objective.isDone() && objective.temps !== null &&
        objective.elapsedMs >= objective.temps * 1000;
    }
  }
};

function formatObjectiveTime(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:` +
    `${String(seconds % 60).padStart(2, "0")}`;
}

class Objective {
  constructor(definition) {
    if (!definition || !OBJECTIVE_TYPES[definition.type]) {
      throw new Error(`Type d'objectif inconnu : ${definition && definition.type}`);
    }
    this.type = definition.type;
    const cibleParDefaut = definition.type === "reine" ? 1 : definition.minManger;
    this.cible = Math.max(
      0,
      Number(definition.cible === undefined ? cibleParDefaut : definition.cible) || 0
    );
    this.temps = definition.temps === undefined ? null : Math.max(0, Number(definition.temps));
    this.minManger = Math.max(0, Number(definition.minManger) || 0);
    this.current = 0;
    this.startedAt = null;
    this.elapsedMs = 0;
    this.energy = 100;
  }

  start(nowMs) {
    this.startedAt = nowMs;
    this.elapsedMs = 0;
  }

  update(nowMs, energy = this.energy) {
    if (this.startedAt !== null) {
      this.elapsedMs = Math.max(0, nowMs - this.startedAt);
    }
    if (Number.isFinite(energy)) {
      this.energy = Math.min(100, Math.max(0, energy));
    }
  }

  addProgress(amount = 1) {
    this.current = Math.min(this.cible, this.current + Math.max(0, Number(amount) || 0));
  }

  label() {
    return OBJECTIVE_TYPES[this.type].label(this);
  }

  progress() {
    const ratio = OBJECTIVE_TYPES[this.type].progress(this);
    return Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  }

  isDone() {
    return OBJECTIVE_TYPES[this.type].isDone(this);
  }

  isFailed() {
    return OBJECTIVE_TYPES[this.type].isFailed(this);
  }
}
