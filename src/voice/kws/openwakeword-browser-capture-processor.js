class OpenWakeWordCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = Array.isArray(inputs) ? inputs[0] : null;
    const output = Array.isArray(outputs) ? outputs[0] : null;
    const ch0 = Array.isArray(input) ? input[0] : null;
    const out0 = Array.isArray(output) ? output[0] : null;

    if (out0 && out0.length) out0.fill(0);

    if (ch0 && ch0.length) {
      const copy = new Float32Array(ch0.length);
      copy.set(ch0);
      this.port.postMessage({ type: "audio", samples: copy }, [copy.buffer]);
    }

    return true;
  }
}

registerProcessor("oww-capture-processor", OpenWakeWordCaptureProcessor);
