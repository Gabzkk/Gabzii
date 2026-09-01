import './style.css';
import * as THREE from 'three';
import { Wave } from './Wave.js';
import { HandController } from './Hands.js';

const canvas = document.querySelector('#webgl');
const videoElement = document.querySelector('#video-feed');
const statusElement = document.querySelector('#status');

// State
let amplitude = 1;
let frequency = 0.5;
let colorShift = 0.6;
let targetAmplitude = 1;
let targetFrequency = 0.5;
let targetColorShift = 0.6;

const wave = new Wave(canvas);
const handController = new HandController(videoElement, (data) => {
  if (data) {
    statusElement.innerText = `Pinch: ${data.pinchDistance.toFixed(2)} | Height: ${data.wristHeight.toFixed(2)} | Flipped: ${data.isFlipped}`;
    
    // Smooth the target values
    // data.pinchDistance is roughly 0 to 0.3 or so
    targetAmplitude = data.pinchDistance * 10; 
    
    // data.wristHeight is roughly 0 to 1
    targetFrequency = data.wristHeight * 3; 

    // Clamp values
    targetAmplitude = Math.max(0.1, Math.min(targetAmplitude, 5));
    targetFrequency = Math.max(0.1, Math.min(targetFrequency, 3));
    
    // Update color shift if flipped
    if (data.isFlipped) {
        targetColorShift += 0.05;
    }
  } else {
    statusElement.innerText = "No hand detected. Using auto-mode.";
    // Auto-mode logic if no hand
    targetAmplitude = 1 + Math.sin(Date.now() * 0.001) * 0.5;
    targetFrequency = 0.5 + Math.cos(Date.now() * 0.0005) * 0.2;
  }
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();

  // Smooth transition (Lerp)
  amplitude += (targetAmplitude - amplitude) * 0.1;
  frequency += (targetFrequency - frequency) * 0.1;
  colorShift += (targetColorShift - colorShift) * 0.1;

  wave.update(time, amplitude, frequency, colorShift);
}

// Start everything
handController.start();
animate();
