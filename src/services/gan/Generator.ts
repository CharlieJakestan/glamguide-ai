
import * as tf from '@tensorflow/tfjs';
import { GANConfig } from './types';

export class Generator {
  public model: tf.LayersModel;
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
    }).apply(input);

    // TypeScript needs type assertion for the model creation
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.batchNormalization().apply(x);
    if (!x) throw new Error('Layer application failed');
    
    x = tf.layers.leakyReLU().apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.conv2d({
      filters: 128,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.batchNormalization().apply(x);
    if (!x) throw new Error('Layer application failed');
    
    x = tf.layers.leakyReLU().apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.conv2d({
      filters: 256,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.batchNormalization().apply(x);
    if (!x) throw new Error('Layer application failed');
    
    x = tf.layers.leakyReLU().apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.conv2dTranspose({
      filters: 128,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.batchNormalization().apply(x);
    if (!x) throw new Error('Layer application failed');
    
    x = tf.layers.reLU().apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.conv2dTranspose({
      filters: 64,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      useBias: false
    }).apply(x);
    if (!x) throw new Error('Layer application failed');

    x = tf.layers.batchNormalization().apply(x);
    if (!x) throw new Error('Layer application failed');
    
    x = tf.layers.reLU().apply(x);
    if (!x) throw new Error('Layer application failed');

    const output = tf.layers.conv2dTranspose({
      filters: 3,
      kernelSize: 4,
      strides: 2,
      padding: 'same',
      activation: 'tanh'
    }).apply(x);
    if (!output) throw new Error('Layer application failed');

    // Fix the TypeScript error by using a type assertion
    return tf.model({ 
      inputs: input, 
      outputs: output as unknown as tf.SymbolicTensor 
    });
  }

  public generate(input: tf.Tensor): tf.Tensor {
    const prediction = this.model.predict(input as any);
    return (Array.isArray(prediction) ? prediction[0] : prediction) as unknown as tf.Tensor;
  }
}
