/**
 * Decodes base64 string to Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM data into an AudioBuffer
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Plays raw PCM audio from a base64 string
 */
export async function playRawAudio(
  base64Audio: string, 
  audioContext: AudioContext | null,
  onEnded?: () => void
): Promise<AudioBufferSourceNode | null> {
  if (!base64Audio) return null;

  // Initialize AudioContext if not provided or suspended
  const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  try {
    const bytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(bytes, ctx);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    if (onEnded) {
      source.onended = onEnded;
    }
    
    source.start(0);
    return source;
  } catch (error) {
    console.error("Error playing audio:", error);
    if (onEnded) onEnded();
    return null;
  }
}
