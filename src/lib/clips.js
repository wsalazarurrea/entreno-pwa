/* Reproductor de los audios grabados (public/voice/harry/*.mp3) con Web Audio:
   - Carga y decodifica cada audio una sola vez y le recorta el silencio del inicio
     y del final, para que "Three!" suene justo en su segundo.
   - Encadena varios audios como una sola frase ("Round three!" + "of eight." + …).
   - Un anuncio nuevo corta el anterior.
   En la app de iPhone suena aunque esté en silencio y se mezcla con la música
   (sesión de audio "playback", AppDelegate). */

import { getAudioContext } from "./sound.js";

const BASE = "/voice/harry/";
const cache = new Map();

function trimSilence(ctx, buf, threshold = 0.015){
  const data = buf.getChannelData(0);
  let s = 0, e = data.length - 1;
  while (s < e && Math.abs(data[s]) < threshold) s++;
  while (e > s && Math.abs(data[e]) < threshold) e--;
  const pad = Math.floor(0.04 * buf.sampleRate);
  s = Math.max(0, s - pad); e = Math.min(data.length - 1, e + pad);
  if (e <= s) return buf;
  const out = ctx.createBuffer(buf.numberOfChannels, e - s + 1, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) out.copyToChannel(buf.getChannelData(c).subarray(s, e + 1), c);
  return out;
}

export function loadClip(key){
  if (!cache.has(key)) {
    cache.set(key, (async () => {
      try {
        const ctx = getAudioContext();
        if (!ctx) return null;
        const res = await fetch(`${BASE}${key}.mp3`);
        if (!res.ok) return null;
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        return trimSilence(ctx, buf);
      } catch { return null; }
    })());
  }
  return cache.get(key);
}

export function preloadClips(keys){ keys.forEach(k => loadClip(k)); }

let playing = [];
let seq = 0;

export function stopClips(){
  playing.forEach(s => { try { s.stop(); } catch { /* ya terminó */ } });
  playing = [];
}

/** Reproduce los audios en orden, como una sola frase. */
export async function playClips(keys, { volume = 1 } = {}){
  if (!keys?.length) return;
  const my = ++seq;
  const bufs = (await Promise.all(keys.map(loadClip))).filter(Boolean);
  if (my !== seq || !bufs.length) return; // llegó otro anuncio mientras cargaba
  stopClips();
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* */ } }
  const gain = ctx.createGain();
  gain.gain.value = volume;
  gain.connect(ctx.destination);
  let t = ctx.currentTime + 0.01;
  for (const b of bufs) {
    const src = ctx.createBufferSource();
    src.buffer = b; src.connect(gain); src.start(t);
    t += b.duration + 0.05;
    playing.push(src);
  }
}
