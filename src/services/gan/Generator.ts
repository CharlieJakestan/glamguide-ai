
import * as tf from '@tensorflow/tfjs';
import { GANConfig } from './types';

export class Generator {
  private model: tf.LayersModel;
  private imageSize: number;

  constructor(config: GANConfig) {
    this.imageSize = config.imageSize;
    this.model = this.buildGenerator();
  }

  private buildGenerator(): tf.LayersModel {
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

    x = tf.layers.conv2dTranspose({
      filters: 128,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x) as tf.Tensor;

    x = tf.layers.batchNormalization().apply(x) as tf.Tensor;
    x = tf.layers.reLU().apply(x) as tf.Tensor;

    x = tf.layers.conv2dTranspose({
      filters: 64,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x) as tf.Tensor;

    x = tf.layers.batchNormalization().apply(x) as tf.Tensor;
    x = tf.layers.reLU().apply(x) as tf.Tensor;

    const output = tf.layers.conv2dTranspose({
      filters: 3,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      activation: 'tanh'
    }).apply(x) as tf.Tensor;

    return tf.model({ inputs: input, outputs: output });
  }

  public generate(input: tf.Tensor): tf.Tensor {
    return this.model.predict(input) as tf.Tensor;
  }
}
