import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export class HandController {
  constructor(videoElement, onResultsCallback) {
    this.videoElement = videoElement;
    this.onResultsCallback = onResultsCallback;
    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onResults.bind(this));

    this.camera = new Camera(this.videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: this.videoElement });
      },
      width: 1280,
      height: 720
    });
  }

  start() {
    this.camera.start();
  }

  onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Process only the first hand for simplicity in this demo first
      const landmarks = results.multiHandLandmarks[0];
      
      // Calculate Pinch Distance (Thumb Tip [4] to Index Tip [8])
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      
      // Distance calculation in 3D (though Z is relative depth)
      const pinchDistance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
        Math.pow(thumbTip.y - indexTip.y, 2) +
        Math.pow(thumbTip.z - indexTip.z, 2)
      );

      // Wrist height (y increases downwards in normalized coords: 0 top, 1 bottom)
      const wrist = landmarks[0];
      const wristHeight = 1 - wrist.y; // Invert so higher hand = higher value

      // Orientation (simple flip check, maybe check Little Finger tip X vs Thumb tip X)
      const isFlipped = landmarks[20].x < landmarks[4].x; // Crude check

      this.onResultsCallback({
        pinchDistance,
        wristHeight,
        isFlipped,
        rawLandmarks: landmarks
      });
    } else {
        // No hands detected
        this.onResultsCallback(null);
    }
  }
}
