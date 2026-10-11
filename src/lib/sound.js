/* Pitidos y voz para el temporizador de intervalos. iOS sólo deja sonar audio y
   voz después de un toque del usuario: llamar unlockSound() dentro de un onClick. */

let ctx = null;

export function unlockSound(){
  try {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); }
    if (ctx.state === "suspended") ctx.resume();
    // Un buffer vacío "desbloquea" la salida de audio en iOS.
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch { /* sin audio */ }
  try { if ("speechSynthesis" in window) { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; window.speechSynthesis.speak(u); } } catch { /* sin voz */ }
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

export function speak(text){
  try {
    if (!("speechSynthesis" in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES"; u.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* sin voz */ }
}
