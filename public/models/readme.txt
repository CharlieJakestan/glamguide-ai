
# Face Detection Models

This directory should contain face-api.js model files required for facial detection and analysis.

## Important Note

If you're seeing errors loading these files, don't worry! We've implemented a CDN fallback that will automatically load the models from the official face-api.js repository.

If you want to serve the models locally for better performance, download the following files from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

And place them in this directory:

Required model files:
- tiny_face_detector_model-shard1
- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-shard1
- face_landmark_68_model-weights_manifest.json
- face_recognition_model-shard1
- face_recognition_model-shard2
- face_recognition_model-weights_manifest.json

The application will first try to load models from this local directory, and if that fails, it will automatically use the CDN version as a fallback.
