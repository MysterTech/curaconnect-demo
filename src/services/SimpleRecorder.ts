/**
 * Simple, reliable audio recorder
 * No complex features - just works!
 */

export interface SimpleRecordingState {
  isRecording: boolean;
  duration: number;
}

export class SimpleRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private onStateChange: ((state: SimpleRecordingState) => void) | null = null;

  /**
   * Start recording
   */
  async start(): Promise<void> {
    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: mimeType || undefined
      });

      this.chunks = [];

      // Handle data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.startTime = Date.now();

      // Update duration every second
      this.durationInterval = setInterval(() => {
        this.notifyStateChange();
      }, 1000);

      this.notifyStateChange();
      console.log('✅ Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      throw new Error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      // Clear duration interval
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      // Handle stop event
      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        
        // Clean up
        this.cleanup();
        
        console.log('✅ Recording stopped, blob size:', blob.size);
        this.notifyStateChange();
        resolve(blob);
      };

      // Stop recording
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        this.cleanup();
        resolve(blob);
      }
    });
  }

  /**
   * Get current recording state
   */
  getState(): SimpleRecordingState {
    const duration = this.mediaRecorder && this.startTime > 0
      ? Math.floor((Date.now() - this.startTime) / 1000)
      : 0;

    return {
      isRecording: this.mediaRecorder !== null && this.mediaRecorder.state === 'recording',
      duration
    };
  }

  /**
   * Get the current buffered audio as a chunk.
   * If flush is true, the internal buffer is cleared so future calls
   * only include new audio data collected after this call.
   */
  getChunk(flush: boolean = true): Blob | null {
    if (this.chunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    const data = flush ? this.chunks.splice(0) : [...this.chunks];
    const blob = new Blob(data, { type: mimeType });
    return blob.size > 0 ? blob : null;
  }

  /**
   * Set state change callback
   */
  setOnStateChange(callback: (state: SimpleRecordingState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = 0;
  }

  /**
   * Notify state change
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }
}
