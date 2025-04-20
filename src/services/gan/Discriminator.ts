
import * as tf from '@tensorflow/tfjs';
import { GANConfig } from './types';

export class Discriminator {
  private model: tf.LayersModel;
  private imageSize: number;

  constructor(config: GANConfig) {
    this.imageSize = config.imageSize;
    this.model = this.buildDiscriminator();
  }

  private buildDiscriminator(): tf.LayersModel {
    const input = tf.layers.input({ shape: [this.imageSize, this.imageSize, 3] });

    let x = tf.layers.conv2d({
      filters: 64,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(input) as tf.Tensor;

    x = tf.layers.batchNormalization().apply(x) as tf.Tensor;
    x = tf.layers.leakyReLU().apply(x) as tf.Tensor;

    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x) as tf.Tensor;

    x = tf.layers.batchNormalization().apply(x) as tf.Tensor;
    x = tf.layers.leakyReLU().apply(x) as tf.Tensor;

    x = tf.layers.conv2d({
      filters: 256,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x) as tf.Tensor;

    x = tf.layers.batchNormalization().apply(x) as tf.Tensor;
    x = tf.layers.leakyReLU().apply(x) as tf.Tensor;

    x = tf.layers.flatten().apply(x) as tf.Tensor;
    const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(x) as tf.Tensor;

    return tf.model({ inputs: input, outputs: output });
  }

  public discriminate(input: tf.Tensor): tf.Tensor {
    return this.model.predict(input) as tf.Tensor;
  }
}
