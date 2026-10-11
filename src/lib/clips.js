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
const status = { ok: 0, failed: 0, lastError: "", mode: "webaudio" };
/** Diagnóstico para "Probar voz": cuántos audios cargaron y el último error. */
export const clipStatus = () => ({ ...status });

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
        // En la app de iPhone, Capacitor entrega los .mp3 sin código HTTP (status 0): es válido.
        if (!res.ok && res.status !== 0) throw new Error(`HTTP ${res.status}`);
        const data = await res.arrayBuffer();
        if (!data.byteLength) throw new Error("archivo vacío");
        const buf = await ctx.decodeAudioData(data);
        status.ok++;
        return trimSilence(ctx, buf);
      } catch (e) {
        status.failed++; status.lastError = `${key}: ${e?.message || e}`;
        cache.delete(key); // reintentar la próxima vez
        return null;
      }
    })());
  }
  return cache.get(key);
}

export function preloadClips(keys){ keys.forEach(k => loadClip(k)); }

let playing = [];
let seq = 0;
let element = null;

export function stopClips(){
  playing.forEach(s => { try { s.stop(); } catch { /* ya terminó */ } });
  playing = [];
  if (element) { try { element.pause(); } catch { /* */ } element = null; }
}

/** Plan B: reproducir con <audio> (sin recorte de silencio) si Web Audio no pudo decodificar. */
async function playWithElements(keys, volume, my){
  status.mode = "audio";
  for (const k of keys) {
    if (my !== seq) return;
    const a = new Audio(`${BASE}${k}.mp3`);
    a.volume = Math.min(1, volume);
    element = a;
    try {
      await a.play();
      await new Promise(r => { a.onended = r; a.onerror = r; a.onpause = r; });
    } catch (e) { status.lastError = `<audio> ${k}: ${e?.message || e}`; return; }
  }
}

/** Reproduce los audios en orden, como una sola frase. */
export async function playClips(keys, { volume = 1 } = {}){
  if (!keys?.length) return;
  const my = ++seq;
  const loaded = await Promise.all(keys.map(loadClip));
  if (my !== seq) return; // llegó otro anuncio mientras cargaba
  stopClips();
  if (loaded.some(b => !b)) return playWithElements(keys, volume, my);
  const bufs = loaded;
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
