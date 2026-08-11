// Web Audio API Sound Effects Synthesizer for Yu-Gi-Oh Card Game

let audioCtx: AudioContext | null = null;
let bgmInterval: ReturnType<typeof setInterval> | null = null;
let isMuted: boolean = false;
let isBgmPlaying: boolean = false;

export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    initAudioContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (isMuted && isBgmPlaying) {
    stopBgm();
  }
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

// 1. DRAW CARD SOUND
export function playSoundDraw() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// 2. SUMMON SOUND
export function playSoundSummon() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.3);

  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(120, now);
  sub.frequency.exponentialRampToValueAtTime(40, now + 0.25);
  subGain.gain.setValueAtTime(0.6, now);
  subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start();
  sub.stop(now + 0.25);
}

// 3. ATTACK SOUND
export function playSoundAttack() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.25);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.28);

  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start();
}

// 4. DEFENSE BLOCK SOUND
export function playSoundDefenseBlock() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1400, now);
  osc1.frequency.exponentialRampToValueAtTime(700, now + 0.3);

  gain1.gain.setValueAtTime(0.5, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start();
  osc1.stop(now + 0.3);
}

// 5. DAMAGE IMPACT SOUND
export function playSoundDamage() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.55);
}

// 6. CARD DESTRUCTION SOUND
export function playSoundDestroy() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const bufferSize = ctx.sampleRate * 0.25;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.25);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start();
}

// 7. TRAP ACTIVATION & SHIELD SOUNDS
export function playSoundTrapActivate() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Mystical 4-note ascending chime
  const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    const startTime = now + idx * 0.05;
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.4);
  });

  // Resonant barrier hum
  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.type = 'triangle';
  hum.frequency.setValueAtTime(300, now);
  hum.frequency.exponentialRampToValueAtTime(600, now + 0.35);

  humGain.gain.setValueAtTime(0.5, now);
  humGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  hum.connect(humGain);
  humGain.connect(ctx.destination);
  hum.start();
  hum.stop(now + 0.4);
}

export function playSoundMirrorForce() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Sweeping barrier beam
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.35);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(now + 0.4);
}

// 8. BGM MUSIC SYNTHESIZER
export function toggleBgm(): boolean {
  if (isBgmPlaying) {
    stopBgm();
    return false;
  } else {
    startBgm();
    return true;
  }
}

export function startBgm() {
  if (isMuted) return;
  const ctx = initAudioContext();
  if (!ctx) return;

  isBgmPlaying = true;
  let step = 0;
  const scale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

  bgmInterval = setInterval(() => {
    if (!isBgmPlaying || isMuted) return;
    const currentCtx = initAudioContext();
    if (!currentCtx) return;

    const freq = scale[step % scale.length];
    const osc = currentCtx.createOscillator();
    const gain = currentCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, currentCtx.currentTime);

    const filter = currentCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000 + (step % 4) * 400, currentCtx.currentTime);

    gain.gain.setValueAtTime(0.04, currentCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, currentCtx.currentTime + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(currentCtx.destination);

    osc.start();
    osc.stop(currentCtx.currentTime + 0.2);

    step++;
  }, 220);
}

export function stopBgm() {
  isBgmPlaying = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}
