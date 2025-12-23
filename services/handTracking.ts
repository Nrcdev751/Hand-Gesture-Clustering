import { PINCH_THRESHOLD } from '../constants';

// Type definitions for MediaPipe Hands which is loaded via global script
interface Landmark {
  x: number;
  y: number;
  z: number;
}

interface Results {
  multiHandLandmarks: Landmark[][];
  image: any;
}

interface HandsConfig {
  locateFile: (file: string) => string;
}

interface HandsOptions {
  maxNumHands?: number;
  modelComplexity?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

declare global {
  interface Window {
    Hands: new (config: HandsConfig) => HandsInstance;
  }
}

interface HandsInstance {
  setOptions(options: HandsOptions): void;
  onResults(callback: (results: Results) => void): void;
  send(config: { image: HTMLVideoElement }): Promise<void>;
}

export class HandTrackingService {
  private hands: HandsInstance;
  private videoElement: HTMLVideoElement;
  private onResultsCallback: (data: { x: number; y: number; isPinching: boolean; isPresent: boolean }) => void;
  private animationFrameId: number | null = null;
  private isStreaming: boolean = false;

  constructor(videoElement: HTMLVideoElement, onResults: (data: { x: number; y: number; isPinching: boolean; isPresent: boolean }) => void) {
    this.videoElement = videoElement;
    this.onResultsCallback = onResults;

    if (!window.Hands) {
      throw new Error("MediaPipe Hands library not loaded via script tag.");
    }

    // Use the global Hands class loaded from the CDN script
    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.hands.onResults(this.processResults);
  }

  private processResults = (results: Results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.onResultsCallback({ x: 0, y: 0, isPinching: false, isPresent: false });
      return;
    }

    const landmarks = results.multiHandLandmarks[0];
    
    // Index finger tip (ID 8)
    const indexTip = landmarks[8];
    // Thumb tip (ID 4)
    const thumbTip = landmarks[4];

    // Calculate midpoint for cursor position
    const x = (indexTip.x + thumbTip.x) / 2;
    const y = (indexTip.y + thumbTip.y) / 2;

    // Calculate distance for pinch detection (Euclidean distance)
    const distance = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) +
      Math.pow(indexTip.y - thumbTip.y, 2)
    );

    const isPinching = distance < PINCH_THRESHOLD;

    this.onResultsCallback({
      x,
      y,
      isPinching,
      isPresent: true
    });
  };

  public async start() {
    if (this.isStreaming) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      this.videoElement.srcObject = stream;
      
      // Wait for video metadata to ensure dimensions are loaded before playing
      await new Promise<void>((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      this.isStreaming = true;
      this.processFrame();

    } catch (error) {
      console.error("Error accessing camera:", error);
      throw error;
    }
  }

  private processFrame = async () => {
    if (!this.isStreaming) return;

    // Send frame to MediaPipe only if video has data
    if (this.videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
      await this.hands.send({ image: this.videoElement });
    }

    if (this.isStreaming) {
      this.animationFrameId = requestAnimationFrame(this.processFrame);
    }
  }

  public stop() {
    this.isStreaming = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }
}