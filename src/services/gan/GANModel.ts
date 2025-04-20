
import * as tf from '@tensorflow/tfjs';
import { Generator } from './Generator';
import { Discriminator } from './Discriminator';
import { GANConfig, GANLosses } from './types';

export class GANModel {
  public generator: Generator;
  public discriminator: Discriminator;
  private gOptimizer: tf.Optimizer;
  private dOptimizer: tf.Optimizer;

  constructor(config: GANConfig) {
    this.generator = new Generator(config);
    this.discriminator = new Discriminator(config);
    this.gOptimizer = tf.train.adam(0.0002, 0.5);
    this.dOptimizer = tf.train.adam(0.0002, 0.5);
  }

  public async trainStep(realImages: tf.Tensor): Promise<GANLosses> {
    return tf.tidy(() => {
      // Train discriminator
      const dLoss = this.trainDiscriminator(realImages);

      // Train generator
      const gLoss = this.trainGenerator(realImages);

      return {
        generatorLoss: gLoss.dataSync()[0],
        discriminatorLoss: dLoss.dataSync()[0]
      };
    });
  }

  private trainDiscriminator(realImages: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      // Generate fake images
      const fakeImages = this.generator.generate(realImages);

      // Get predictions
      const realOutput = this.discriminator.discriminate(realImages);
      const fakeOutput = this.discriminator.discriminate(fakeImages);

      // Calculate loss - using sigmoidCrossEntropy instead of binaryCrossentropy
      const realLoss = tf.losses.sigmoidCrossEntropy(tf.ones(realOutput.shape), realOutput);
      const fakeLoss = tf.losses.sigmoidCrossEntropy(tf.zeros(fakeOutput.shape), fakeOutput);
      const totalLoss = tf.add(realLoss, fakeLoss);

      return totalLoss;
    });
  }

  private trainGenerator(realImages: tf.Tensor): tf.Tensor {
    return tf.tidy(() => {
      // Generate fake images
      const fakeImages = this.generator.generate(realImages);

      // Get predictions for fake images
      const fakeOutput = this.discriminator.discriminate(fakeImages);

      // Calculate loss (we want the discriminator to think these are real)
      return tf.losses.sigmoidCrossEntropy(tf.ones(fakeOutput.shape), fakeOutput);
    });
  }

  public async save(path: string): Promise<void> {
    await this.generator.model.save(`${path}/generator`);
    await this.discriminator.model.save(`${path}/discriminator`);
  }

  public async load(path: string): Promise<void> {
    this.generator.model = await tf.loadLayersModel(`${path}/generator/model.json`);
    this.discriminator.model = await tf.loadLayersModel(`${path}/discriminator/model.json`);
  }
}
