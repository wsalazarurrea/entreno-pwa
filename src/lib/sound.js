/* Pitidos y voz del temporizador.
   - App de iPhone: voz nativa de iOS (AVSpeechSynthesizer, plugin text-to-speech). Suena
     aunque el interruptor de silencio esté activado (sesión de audio "playback", AppDelegate).
   - Web: Web Audio + speechSynthesis del navegador (en iPhone respetan el modo silencio).
   iOS sólo deja sonar audio/voz web después de un toque: llamar unlockSound() en un onClick. */

import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { isNative } from "./native.js";
import { voiceConfig } from "./voice.js";

let ctx = null;

export function unlockSound(){
  try {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); }
    if (ctx.state === "suspended") ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch { /* sin audio */ }
  if (!isNative) {
    try { if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); } } catch { /* sin voz */ }
  }
}

/** Contexto de audio compartido (pitidos y audios grabados). */
export function getAudioContext(){
  try { if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); } } catch { return null; }
  return ctx;
}

export function resumeSound(){ try { if (ctx?.state === "suspended") ctx.resume(); } catch { /* */ } }

function tone(freq, dur, at = 0, vol = 0.5){
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

/** "tick" = cuenta 3-2-1 · "go" = empieza trabajo · "rest" = empieza descanso · "end" = terminado. */
export function cue(kind){
  try {
    if (kind === "tick") tone(880, 0.12);
    else if (kind === "go") { tone(1320, 0.18); tone(1760, 0.32, 0.18); }
    else if (kind === "rest") { tone(660, 0.18); tone(440, 0.32, 0.18); }
    else if (kind === "end") { [0, 0.25, 0.5].forEach((d, i) => tone(880 + i * 220, 0.22, d)); tone(1760, 0.6, 0.75); }
  } catch { /* sin audio */ }
}

let webVoices = [];
function loadWebVoices(){ try { webVoices = window.speechSynthesis?.getVoices() || []; } catch { webVoices = []; } }
if (!isNative && typeof window !== "undefined" && "speechSynthesis" in window) {
  loadWebVoices();
  window.speechSynthesis.onvoiceschanged = loadWebVoices;
}

let nativeEs = null;
if (isNative) spanishLanguagesRaw().then(l => { nativeEs = l; }).catch(() => {});

async function spanishLanguagesRaw(){
  const langs = (await TextToSpeech.getSupportedLanguages()).languages || [];
  return [...new Set(langs.filter(l => /^es[-_]/i.test(l) || l === "es").map(l => l.replace("_", "-")))].sort();
}

/** Habla `text` con la configuración de voz (idioma, velocidad, volumen). Interrumpe lo anterior. */
export function speak(text, cfgIn){
  const cfg = voiceConfig(cfgIn);
  if (!text) return;
  if (isNative) {
    // Si el iPhone no tiene la variante elegida, usar otra de español (nunca la voz en inglés por defecto).
    const lang = nativeEs && !nativeEs.includes(cfg.lang) ? (nativeEs[0] || cfg.lang) : cfg.lang;
    TextToSpeech.speak({ text, lang, rate: cfg.rate, volume: cfg.volume, category: "playback", queueStrategy: 0 }).catch(() => {});
    return;
  }
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = cfg.lang; u.rate = cfg.rate; u.volume = cfg.volume;
    const v = webVoices.find(x => x.lang === cfg.lang) || webVoices.find(x => x.lang?.startsWith(cfg.lang.slice(0, 2)));
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* sin voz */ }
}

export function stopSpeaking(){
  if (isNative) { TextToSpeech.stop().catch(() => {}); return; }
  try { window.speechSynthesis?.cancel(); } catch { /* */ }
}

/** Variantes de español disponibles en este dispositivo (p. ej. es-ES, es-MX). */
export async function spanishLanguages(){
  let langs = [];
  try {
    if (isNative) langs = (await TextToSpeech.getSupportedLanguages()).languages || [];
    else { loadWebVoices(); langs = webVoices.map(v => v.lang); }
  } catch { /* */ }
  const es = [...new Set(langs.filter(l => /^es[-_]/i.test(l) || l === "es").map(l => l.replace("_", "-")))].sort();
  return es.length ? es : ["es-ES", "es-MX", "es-US"];
}
