
import * as tf from '@tensorflow/tfjs';

export interface GANConfig {
  imageSize: number;
  batchSize?: number;
  latentDim?: number;
}

export interface GANLosses {
  generatorLoss: number;
  discriminatorLoss: number;
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
}
