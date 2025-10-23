/**
 * Gemini Audio Worklet Processor
 *
 * This processor runs in a separate thread to capture raw audio data
 * from the microphone without blocking the main browser thread. It receives
 * Float32 PCM data and forwards it to the main thread via a message port.
 */
class GeminiAudioProcessor extends AudioWorkletProcessor {
  /**
   * The process method is called for each block of audio data.
   * @param {Float32Array[][]} inputs - An array of inputs, each with an array of channels.
   * @returns {boolean} - Returns true to keep the processor alive.
   */
  process(inputs) {
    // We use the first input and the first channel of that input.
    const input = inputs[0];
    if (input.length > 0) {
      const pcmData = input[0];
      // Post the raw Float32Array data back to the main thread for processing.
      if (pcmData.length > 0) {
        this.port.postMessage(pcmData);
      }
    }
    // Return true to indicate the processor should not be terminated.
    return true;
  }
}

registerProcessor('gemini-audio-processor', GeminiAudioProcessor);
