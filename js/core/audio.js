/**
 * Small procedural sound engine.
 *
 * No audio files: every sound is built from oscillators and a short noise
 * buffer, so the app keeps its "no outside assets" promise. The AudioContext is
 * created on the first real user gesture, which is what browsers require.
 */

import { isSoundOn } from './settings.js';

let ctx = null;
let master = null;
let noiseBuffer = null;
let fanNodes = null;

function audio() {
  if (!isSoundOn()) return null;
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

function makeNoise(context) {
  if (noiseBuffer) return noiseBuffer;
  const seconds = 2;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = 0.97 * last + 0.03 * white; // brown-ish noise reads as "air"
    data[i] = last * 3.2;
  }
  noiseBuffer = buffer;
  return buffer;
}

function tone({ freq = 440, to = null, duration = 0.18, type = 'sine', gain = 0.5, delay = 0, curve = 'exp' } = {}) {
  const context = audio();
  if (!context) return;
  const start = context.currentTime + delay;
  const osc = context.createOscillator();
  const env = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to && to !== freq) {
    if (curve === 'exp') osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    else osc.frequency.linearRampToValueAtTime(to, start + duration);
  }
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.04);
}

function burst({ duration = 0.16, freq = 1200, q = 1, gain = 0.3, delay = 0 } = {}) {
  const context = audio();
  if (!context) return;
  const start = context.currentTime + delay;
  const source = context.createBufferSource();
  source.buffer = makeNoise(context);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = context.createGain();
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(env).connect(master);
  source.start(start);
  source.stop(start + duration + 0.02);
}

export const sfx = {
  /** Quiet wooden tick for buttons and hovers. */
  click() {
    tone({ freq: 320, to: 210, duration: 0.05, type: 'triangle', gain: 0.18 });
    burst({ duration: 0.03, freq: 2600, gain: 0.05 });
  },
  /** Part lands in a bay. */
  pick() {
    tone({ freq: 520, to: 780, duration: 0.09, type: 'sine', gain: 0.3 });
    burst({ duration: 0.05, freq: 1800, gain: 0.08 });
  },
  /** Wrong part, wrong bay, failed check. */
  error() {
    tone({ freq: 190, to: 120, duration: 0.22, type: 'sawtooth', gain: 0.16 });
    tone({ freq: 150, to: 96, duration: 0.26, type: 'square', gain: 0.06, delay: 0.02 });
  },
  /** POST beep of a healthy board. */
  boot() {
    tone({ freq: 660, duration: 0.14, type: 'square', gain: 0.12 });
    tone({ freq: 990, duration: 0.2, type: 'square', gain: 0.09, delay: 0.16 });
  },
  /** Three rising notes for a good rating. */
  success() {
    [523, 659, 784].forEach((freq, index) => {
      tone({ freq, duration: 0.22, type: 'sine', gain: 0.3, delay: index * 0.12 });
    });
  },
  /** Cash register. */
  coin() {
    tone({ freq: 1046, duration: 0.08, type: 'triangle', gain: 0.22 });
    tone({ freq: 1568, duration: 0.16, type: 'triangle', gain: 0.18, delay: 0.07 });
  },
  levelUp() {
    [392, 523, 659, 880].forEach((freq, index) => {
      tone({ freq, duration: 0.24, type: 'triangle', gain: 0.26, delay: index * 0.1 });
    });
  },
  /** Continuous fan whirr for the assembly / boot screen. */
  fanStart() {
    const context = audio();
    if (!context || fanNodes) return;
    const source = context.createBufferSource();
    source.buffer = makeNoise(context);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 1.2);
    source.connect(filter).connect(gain).connect(master);
    source.start();
    fanNodes = { source, gain };
  },
  fanStop() {
    if (!fanNodes || !ctx) return;
    const { source, gain } = fanNodes;
    fanNodes = null;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }, 700);
  },
};

export function unlockAudio() {
  audio();
}
