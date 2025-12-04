import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

export interface BarcodeScanResult {
  code: string;
  format: string;
}

export interface BarcodeScannerOptions {
  onResult: (result: BarcodeScanResult) => void;
  onError: (error: Error) => void;
}

export class BarcodeScanner {
  private reader: BrowserMultiFormatReader;
  private videoElement: HTMLVideoElement | null = null;
  private isScanning = false;

  constructor() {
    this.reader = new BrowserMultiFormatReader();
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    options: BarcodeScannerOptions
  ): Promise<void> {
    if (this.isScanning) {
      return;
    }

    this.videoElement = videoElement;
    this.isScanning = true;

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });

      // Set video source
      videoElement.srcObject = stream;
      videoElement.play();

      // Start continuous scanning
      this.reader.decodeFromVideoDevice(
        null, // Use default device
        videoElement,
        (result, error) => {
          if (result) {
            options.onResult({
              code: result.getText(),
              format: result.getBarcodeFormat().toString(),
            });
          }
          if (error && !(error instanceof NotFoundException)) {
            options.onError(error);
          }
        }
      );
    } catch (error) {
      this.isScanning = false;
      options.onError(
        error instanceof Error ? error : new Error('Failed to access camera')
      );
    }
  }

  stopScanning(): void {
    if (!this.isScanning) {
      return;
    }

    this.reader.reset();

    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }

    this.isScanning = false;
    this.videoElement = null;
  }

  isActive(): boolean {
    return this.isScanning;
  }
}
