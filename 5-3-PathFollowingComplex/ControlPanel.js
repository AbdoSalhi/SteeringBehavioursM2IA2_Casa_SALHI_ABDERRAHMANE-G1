// Panneau DOM : chaque entrée met CONFIG à jour sans relancer le sketch.
class ControlPanel {
  constructor() {
    this.root = createDiv();
    this.root.addClass("control-panel");
    this.root.id("control-panel");
    this.controls = new Map();
    this.toggleButton = createButton("Masquer (H)");
    this.toggleButton.addClass("panel-toggle");
    this.toggleButton.mousePressed(() => this.toggle());
    this.errorLine = null;
    this._build();
    this.setVisible(CONFIG.general.showPanel);
  }

  _section(title, initiallyOpen = false) {
    const section = createElement("details");
    section.addClass("control-section");
    if (initiallyOpen) section.attribute("open", "");
    section.parent(this.root);
    const summary = createElement("summary", title);
    summary.parent(section);
    return section;
  }

  _row(parent, title, control, readout = null) {
    const row = createDiv();
    row.addClass("control-row");
    row.parent(parent);
    const label = createSpan(title);
    label.parent(row);
    control.parent(row);
    if (readout) readout.parent(row);
    return row;
  }

  _slider(parent, title, path, minValue, maxValue, step, suffix = "") {
    const value = this._get(path);
    const control = createSlider(minValue, maxValue, value, step);
    const readout = createSpan(`${value}${suffix}`);
    readout.addClass("control-readout");
    this._row(parent, title, control, readout);
    this.controls.set(path, { control, readout, suffix });
    control.input(() => {
      const nextValue = Number(control.value());
      readout.html(`${nextValue}${suffix}`);
      this._set(path, nextValue);
    });
    return control;
  }

  _checkbox(parent, title, path) {
    const control = createCheckbox("", this._get(path));
    this._row(parent, title, control);
    control.changed(() => this._set(path, control.checked()));
    return control;
  }

  _select(parent, title, path, options) {
    const control = createSelect();
    for (const [value, label] of options) control.option(label, value);
    control.selected(this._get(path));
    this._row(parent, title, control);
    control.changed(() => this._set(path, control.value()));
    return control;
  }

  _color(parent, title, path) {
    const control = createColorPicker(this._get(path));
    this._row(parent, title, control);
    control.input(() => this._set(path, control.value()));
    return control;
  }

  _button(parent, title, action, extraClass = "") {
    const button = createButton(title);
    button.addClass("control-action");
    if (extraClass) button.addClass(extraClass);
    button.parent(parent);
    button.mousePressed(action);
    return button;
  }

  _get(path) {
    return path.split(".").reduce((value, part) => value[part], CONFIG);
  }

  _set(path, value) {
    const parts = path.split(".");
    const key = parts.pop();
    const target = parts.reduce((node, part) => node[part], CONFIG);
    target[key] = value;
    configurationChanged(path, value);
  }

  _build() {
    const header = createDiv();
    header.addClass("panel-heading");
    header.parent(this.root);
    createSpan("Steering • Serpents")
      .addClass("panel-title")
      .parent(header);

    const snake = this._section("A · Serpent", true);
    this._slider(snake, "Nombre", "snake.count", 1, 30, 1);
    this._slider(snake, "Segments", "snake.segments", 10, 80, 1);
    this._slider(snake, "Épaisseur", "snake.thickness", 4, 40, 1, " px");
    this._slider(snake, "Amplitude", "snake.waveAmplitude", 0, 24, 0.5, " px");
    this._slider(snake, "Fréquence d'ondulation", "snake.waveFrequency", 0.1, 1.5, 0.01);
    this._slider(snake, "Vitesse d'ondulation", "snake.waveSpeed", 0, 0.5, 0.005);
    this._slider(snake, "Taille de tête", "snake.headSize", 0.6, 1.8, 0.05);
    this._slider(snake, "Taille des yeux", "snake.eyeSize", 0.5, 2, 0.05);
    this._select(snake, "Motif", "snake.scaleStyle", [
      ["none", "Aucun"],
      ["diamonds", "Losanges"],
      ["stripes", "Rayures"],
      ["dots", "Points"]
    ]);
    this._slider(snake, "Intensité du motif", "snake.patternIntensity", 0, 1, 0.01);
    this._checkbox(snake, "Palette aléatoire par serpent", "snake.randomPalette");
    this._slider(snake, "Teinte", "snake.hue", 0, 359, 1, "°");
    this._slider(snake, "Saturation", "snake.saturation", 0, 100, 1, "%");
    this._slider(snake, "Luminosité", "snake.brightness", 20, 100, 1, "%");
    this._color(snake, "Couleur unique", "snake.color");
    this._checkbox(snake, "Langue visible", "snake.tongueVisible");
    this._slider(snake, "Fréquence de langue", "snake.tongueFrequency", 0.2, 8, 0.1, " /s");
    this._checkbox(snake, "Ombre visible", "snake.shadowVisible");
    this._slider(snake, "Intensité de l'ombre", "snake.shadowIntensity", 0, 60, 1, "%");
    this._button(snake, "Randomiser l'apparence", randomizeSnakeAppearance);

    const circuit = this._section("B · Circuit", true);
    this._select(circuit, "Forme", "circuit.shape", [
      ["circle", "Cercle"],
      ["ellipse", "Ovale / ellipse"],
      ["infinity", "Huit (∞)"],
      ["star", "Étoile"],
      ["roundedRect", "Rectangle arrondi"],
      ["spiral", "Spirale fermée"],
      ["free", "Forme libre aléatoire"]
    ]);
    this._slider(circuit, "Échelle", "circuit.scale", 0.35, 1.2, 0.01);
    this._slider(circuit, "Rayon de piste", "circuit.radius", 4, 60, 1, " px");
    this._slider(circuit, "Points de contrôle", "circuit.controlPoints", 8, 60, 1);
    this._slider(circuit, "Irrégularité (forme libre)", "circuit.irregularity", 0, 0.4, 0.01);
    this._button(circuit, "Nouveau circuit aléatoire", randomizeCircuit);
    this._checkbox(circuit, "Éditer les points (glisser)", "circuit.editMode");
    const editHint = createP("Double-clic : ajouter · clic droit : supprimer");
    editHint.addClass("panel-hint");
    editHint.parent(circuit);
    this._checkbox(circuit, "Afficher le circuit", "circuit.visible");
    this._color(circuit, "Couleur de la ligne", "circuit.color");
    this._color(circuit, "Couleur de la piste", "circuit.roadColor");
    this._slider(circuit, "Épaisseur de la ligne", "circuit.lineWidth", 0.5, 8, 0.5, " px");

    const behavior = this._section("C · Comportements");
    this._slider(behavior, "Vitesse max.", "behaviors.maxSpeed", 0.2, 10, 0.1);
    this._slider(behavior, "Force max.", "behaviors.maxForce", 0.01, 1, 0.01);
    this._slider(behavior, "Poids path following", "behaviors.pathWeight", 0, 5, 0.05);
    this._slider(behavior, "Poids séparation", "behaviors.separationWeight", 0, 5, 0.05);
    this._slider(behavior, "Poids wander", "behaviors.wanderWeight", 0, 5, 0.05);
    this._slider(behavior, "Poids souris", "behaviors.mouseWeight", 0, 5, 0.05);
    this._slider(behavior, "Anticipation du chemin", "behaviors.prediction", 2, 80, 1, " px");
    this._checkbox(behavior, "Activer wander", "behaviors.wanderEnabled");
    this._checkbox(behavior, "Activer séparation", "behaviors.separationEnabled");
    this._checkbox(behavior, "Suivre le pointeur", "behaviors.mouseEnabled");

    const backgroundSection = this._section("D · Fond");
    this._checkbox(backgroundSection, "Afficher le fond animé", "background.visible");
    this._slider(backgroundSection, "Vitesse", "background.speed", 0, 0.08, 0.001);
    this._slider(backgroundSection, "Échelle du bruit", "background.noiseScale", 0.005, 0.15, 0.001);
    this._slider(backgroundSection, "Saturation", "background.saturation", 0, 100, 1, "%");
    this._slider(backgroundSection, "Luminosité", "background.brightness", 10, 100, 1, "%");
    this._select(backgroundSection, "Palette", "background.palette", [
      ["aurora", "Aurore"],
      ["ocean", "Océan"],
      ["sunset", "Coucher de soleil"],
      ["neon", "Néon"]
    ]);

    const general = this._section("E · Général");
    this._button(general, "Pause / reprise", togglePause);
    this._button(general, "Réinitialiser la simulation", resetSimulation);
    this._button(general, "Sauvegarder la config", () =>
      saveJSON(CONFIG, "steering-serpents-config.json")
    );
    this._button(general, "Charger une config JSON", () => this.fileInput.elt.click());
    this._button(general, "Réinitialiser aux valeurs par défaut", resetConfiguration);
    this.fileInput = createFileInput((file) => this._readConfigFile(file));
    this.fileInput.addClass("config-file-input");
    this.fileInput.attribute("accept", ".json,application/json");
    this.fileInput.parent(general);
    this.errorLine = createP("");
    this.errorLine.addClass("panel-hint panel-error");
    this.errorLine.parent(general);
    this.fpsLine = createDiv("FPS —");
    this.fpsLine.addClass("fps-readout");
    this.fpsLine.parent(general);
  }

  _readConfigFile(file) {
    if (!file || !file.data) {
      this._showMessage("Choisis un fichier JSON valide.");
      return;
    }
    try {
      let rawData = file.data;
      if (rawData.startsWith("data:")) {
        const header = rawData.slice(0, rawData.indexOf(","));
        const payload = rawData.slice(rawData.indexOf(",") + 1);
        rawData = header.includes(";base64")
          ? new TextDecoder().decode(
              Uint8Array.from(atob(payload), (character) =>
                character.charCodeAt(0)
              )
            )
          : decodeURIComponent(payload);
      }
      const imported = JSON.parse(rawData);
      applyImportedConfiguration(imported);
      this._showMessage("Configuration chargée.");
    } catch (error) {
      this._showMessage(`Import impossible : ${error.message}`);
    }
  }

  refreshControl(path, value) {
    const entry = this.controls.get(path);
    if (!entry) return;
    entry.control.value(value);
    entry.readout.html(`${value}${entry.suffix}`);
  }

  _showMessage(message) {
    this.errorLine.html(message);
  }

  updateFps(fps) {
    if (!CONFIG.general.showFps) {
      this.fpsLine.hide();
      return;
    }
    this.fpsLine.html(`FPS ${fps.toFixed(0)}`);
    this.fpsLine.show();
  }

  toggle() {
    CONFIG.general.showPanel = !CONFIG.general.showPanel;
    this.setVisible(CONFIG.general.showPanel);
  }

  setVisible(visible) {
    if (visible) {
      this.root.show();
      this.toggleButton.html("Masquer (H)");
    } else {
      this.root.hide();
      this.toggleButton.html("Contrôles (H)");
    }
  }

  remove() {
    this.root.remove();
    this.toggleButton.remove();
  }
}
