import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
export class BarcodeScanner {
    reader;
    videoElement = null;
    isScanning = false;
    constructor() {
        this.reader = new BrowserMultiFormatReader();
    }
    async startScanning(videoElement, options) {
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
            this.reader.decodeFromVideoDevice(null, // Use default device
            videoElement, (result, error) => {
                if (result) {
                    options.onResult({
                        code: result.getText(),
                        format: result.getBarcodeFormat().toString(),
                    });
                }
                if (error && !(error instanceof NotFoundException)) {
                    options.onError(error);
                }
            });
        }
        catch (error) {
            this.isScanning = false;
            options.onError(error instanceof Error ? error : new Error('Failed to access camera'));
        }
    }
    stopScanning() {
        if (!this.isScanning) {
            return;
        }
        this.reader.reset();
        if (this.videoElement && this.videoElement.srcObject) {
            const stream = this.videoElement.srcObject;
            stream.getTracks().forEach((track) => track.stop());
            this.videoElement.srcObject = null;
        }
        this.isScanning = false;
        this.videoElement = null;
    }
    isActive() {
        return this.isScanning;
    }
}
