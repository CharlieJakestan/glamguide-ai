
import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { GANModel } from '@/services/gan/GANModel';
import { GANConfig, TrainingConfig } from '@/services/gan/types';

export const useGAN = (config: GANConfig) => {
  const [model] = useState(() => new GANModel(config));
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const train = useCallback(async (
    images: tf.Tensor,
    trainingConfig: TrainingConfig,
    onProgress?: (epoch: number, losses: { generatorLoss: number; discriminatorLoss: number }) => void
  ) => {
    setIsTraining(true);
    setError(null);

    try {
      for (let epoch = 0; epoch < trainingConfig.epochs; epoch++) {
        const losses = await model.trainStep(images);
        onProgress?.(epoch, losses);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during training');
      console.error('GAN training error:', err);
    } finally {
      setIsTraining(false);
    }
  }, [model]);

  const generate = useCallback((input: tf.Tensor) => {
    try {
      return model.generator.generate(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during generation');
      console.error('GAN generation error:', err);
      return null;
    }
  }, [model]);

  return {
    model,
    train,
    generate,
    isTraining,
    error
  };
};
