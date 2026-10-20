class NeuralNetwork {
  constructor(inputNodes, hiddenNodes, outputNodes, model) {
    this.disposed = false;
    if (model instanceof tf.Sequential) {
      this.model = model;
      this.inputNodes = inputNodes;
      this.hiddenNodes = hiddenNodes;
      this.outputNodes = outputNodes;
      return;
    }

    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;
    this.model = this.createModel();
  }

  createModel() {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: this.hiddenNodes,
        inputShape: [this.inputNodes],
        activation: "sigmoid"
      })
    );
    model.add(
      tf.layers.dense({
        units: this.outputNodes,
        activation: "sigmoid"
      })
    );
    return model;
  }

  copy() {
    return tf.tidy(() => {
      const newModel = this.createModel();
      const weights = this.model.getWeights();
      const clonedWeights = weights.map((weight) => weight.clone());
      newModel.setWeights(clonedWeights);
      return new NeuralNetwork(this.inputNodes, this.hiddenNodes, this.outputNodes, newModel);
    });
  }

  mutate(rate) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const mutated = [];
      for (let i = 0; i < weights.length; i++) {
        const tensor = weights[i];
        const shape = tensor.shape;
        const values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (random(1) < rate) {
            values[j] += randomGaussian();
          }
        }
        mutated[i] = tf.tensor(values, shape);
      }
      this.model.setWeights(mutated);
    });
  }

  predict(inputs) {
    return tf.tidy(() => {
      const values = tf.tensor2d([inputs]);
      const output = this.model.predict(values);
      const result = Array.from(output.dataSync());
      values.dispose();
      output.dispose();
      return result;
    });
  }

  dispose() {
    if (this.disposed) {
      return;
    }
    if (this.model) {
      this.model.dispose();
    }
    this.disposed = true;
  }
}
