
class NeuralNetwork {
    constructor(a, b, c, d) {
      // Si on passe un réseau de neurones en paramètre
      // on l'utilise
      // sinon on crée un réseau de neurones
      // avec les paramètres passés: nombre de neurones en entrée, cachés et sortie
      if (a instanceof tf.Sequential) {
        this.model = a;
        this.input_nodes = b;
        this.hidden_nodes = c;
        this.output_nodes = d;
      } else {
        this.input_nodes = a;
        this.hidden_nodes = b;
        this.output_nodes = c;
        this.model = this.createModel();
      }
    }
  
    // On crée une copie du réseau de neurones, utilise peut être pour 
    // implémenter la mutation...
    copy() {
      return tf.tidy(() => {
        const modelCopy = this.createModel();
        const weights = this.model.getWeights();
        const weightCopies = [];
        for (let i = 0; i < weights.length; i++) {
          weightCopies[i] = weights[i].clone();
        }
        modelCopy.setWeights(weightCopies);
        return new NeuralNetwork(modelCopy, this.input_nodes, this.hidden_nodes, this.output_nodes);
      });
    }
  
    // Applique une mutation au "cerveau" de la voiture
    // rate est le taux de mutation
    // On applique la mutation sur les poids du réseau de neurones
    mutate(rate) {
      tf.tidy(() => {
        // On récupère le réseau de neurones
        // Ici les poids
        const weights = this.model.getWeights();
        // On crée un tableau pour les poids mutés
        const mutatedWeights = [];

        // Pour chaque poids
        for (let i = 0; i < weights.length; i++) {
          // On récupère le tenseur
          // qui contient les poids
          // et sa forme
          // et les valeurs
          let tensor = weights[i];
          let shape = weights[i].shape;
          let values = tensor.dataSync().slice();

          // Pour chaque valeur
          for (let j = 0; j < values.length; j++) {
            // On tire un nombre au hasard
            // si ce nombre est inférieur au taux de mutation
            // on ajoute un nombre aléatoire
            if (random(1) < rate) {
              let w = values[j];
              values[j] = w + randomGaussian();
            }
          }

          // On crée un nouveau tenseur avec les valeurs mutées
          let newTensor = tf.tensor(values, shape);
          mutatedWeights[i] = newTensor;
        }
        // On applique les poids mutés au réseau de neurones
        this.model.setWeights(mutatedWeights);
      });
    }
  
    dispose() {
      this.model.dispose();
    }

    exportWeights() {
      const weights = this.model.getWeights();
      return {
        input_nodes: this.input_nodes,
        hidden_nodes: this.hidden_nodes,
        output_nodes: this.output_nodes,
        weights: weights.map(weight => ({
          shape: weight.shape.slice(),
          values: Array.from(weight.dataSync())
        }))
      };
    }

    importWeights(saved) {
      if (
        saved.input_nodes !== this.input_nodes ||
        saved.hidden_nodes !== this.hidden_nodes ||
        saved.output_nodes !== this.output_nodes ||
        !Array.isArray(saved.weights)
      ) {
        throw new Error("L'architecture du cerveau ne correspond pas à l'espèce.");
      }

      const currentWeights = this.model.getWeights();
      if (saved.weights.length !== currentWeights.length) {
        throw new Error("Le nombre de tenseurs du cerveau est invalide.");
      }

      saved.weights.forEach((weight, index) => {
        const expectedShape = currentWeights[index].shape;
        if (
          !Array.isArray(weight.shape) ||
          weight.shape.length !== expectedShape.length ||
          weight.shape.some((value, dimension) => value !== expectedShape[dimension]) ||
          !Array.isArray(weight.values)
        ) {
          throw new Error("La forme des poids du cerveau est invalide.");
        }
      });

      tf.tidy(() => {
        const weights = saved.weights.map(weight =>
          tf.tensor(weight.values, weight.shape)
        );
        this.model.setWeights(weights);
      });
    }
  
    // On prédit la sortie en fonction de l'entrée
    predict(inputs) {
      return tf.tidy(() => {
        // On convertit l'entrée en tenseur
        // et on prédit la sortie
        const xs = tf.tensor2d([inputs]);
        const ys = this.model.predict(xs);

        // On récupère les valeurs de la sortie
        const outputs = ys.dataSync();
        return outputs;
      });
    }
  
    createModel() {
      // On crée un réseau de neurones
      // avec une couche d'entrée, une couche cachée et une couche de sortie
      const model = tf.sequential();

      // couche d'activation classique de type sigmoide
      const hidden = tf.layers.dense({
        units: this.hidden_nodes,
        inputShape: [this.input_nodes],
        activation: 'sigmoid'
      });

      model.add(hidden);

      const output = tf.layers.dense({
        units: this.output_nodes,
        activation: 'sigmoid'
      });
      model.add(output);

      return model;
    }
  }