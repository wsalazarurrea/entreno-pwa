/* Traduce los eventos de voz (lib/voice.js → cueFor().event) a la secuencia de
   audios grabados de Harry (src/data/voiceHarry.js, public/voice/harry). */

import { PHRASES, CHEERS, MAX_ROUND, MAX_COUNT, MINUTE_MARKS } from "../data/voiceHarry.js";
import { voiceConfig } from "./voice.js";

const last = {};
/** Frase de ánimo al azar del estilo (sin repetir la anterior); null en estilo "neutro". */
export function cheerKey(cfgIn, kind){
  const { style } = voiceConfig(cfgIn);
  const list = CHEERS[style]?.[kind];
  if (!list?.length) return null;
  const keys = list.map((_, i) => `ch-${style}-${kind}-${i}`);
  const opts = keys.filter(k => k !== last[kind]);
  const k = (opts.length ? opts : keys)[Math.floor(Math.random() * (opts.length || keys.length))];
  last[kind] = k;
  return k;
}

/* Nombres de fase conocidos (plantillas y WOD) → audio; el resto, por tipo de fase. */
const LABELS = {
  "Trabajo": "ph-work", "Descanso": "ph-rest", "Prepárate": "ph-get-ready", "Calentamiento": "ph-warmup",
  "Vuelta a la calma": "ph-cooldown", "Descanso entre rondas": "ph-rest-rounds", "Descanso entre series": "ph-rest-sets",
  "Minuto": "ph-minute", "Round": "ph-fight", "AMRAP 3 min": "ph-amrap3", "Wall balls": "ph-wallballs",
  "Peso muerto sumo + jalón alto": "ph-sdhp", "Saltos al cajón": "ph-boxjumps", "Press de empuje (push press)": "ph-pushpress",
  "Remo (calorías)": "ph-row",
};
export function phaseKey(phase){
  return LABELS[phase.label]
    || (phase.kind === "work" ? "ph-work" : phase.kind === "rest" ? "ph-rest"
      : phase.kind === "warmup" ? (phase.sec <= 30 ? "ph-get-ready" : "ph-warmup") : "ph-cooldown");
}

const minuteKey = (prefix, sec) => (sec % 60 === 0 && MINUTE_MARKS.includes(sec / 60) ? `${prefix}-${sec / 60}` : null);
const ok = (keys) => keys.filter(k => k && k in PHRASES);

export function clipsFor(ev, cfg){
  if (!ev) return [];
  switch (ev.type) {
    case "start": {
      if (ev.phase.open) return ok(ev.mode === "amrap" ? ["open-amrap", cheerKey(cfg, "open")] : ["open-fortime"]);
      const k = [phaseKey(ev.phase)];
      if (ev.showRound) {
        if (ev.lastRound) k.push("last-round");
        else if (ev.round <= MAX_ROUND) { k.push(`round-${ev.round}`); if (ev.rounds <= MAX_ROUND) k.push(`of-${ev.rounds}`); }
      }
      if (ev.phase.kind === "work") k.push(cheerKey(cfg, ev.lastRound ? "last" : "work"));
      else if (ev.phase.kind === "rest" && ev.phase.sec >= 10) k.push(cheerKey(cfg, "rest"));
      return ok(k);
    }
    case "count": return ev.n <= MAX_COUNT ? [`count-${ev.n}`] : [];
    case "warn": {
      const w = ev.sec === 60 ? "warn-60" : ev.sec === 30 ? "warn-30" : ev.sec === 10 ? "warn-10" : minuteKey("left", ev.sec);
      return w ? ok([w, cheerKey(cfg, "push")]) : [];
    }
    case "half": return ok(["halfway", cheerKey(cfg, "push")]);
    case "in": { const m = minuteKey("in", ev.sec); return m ? ok([m, cheerKey(cfg, "work")]) : []; }
    case "left": { const m = minuteKey("left", ev.sec); return m ? ok([m, cheerKey(cfg, "push")]) : []; }
    default: return [];
  }
}

export const finishClips = (cfg) => ok(["fin-time", cheerKey(cfg, "finish")]);
export const roundClips = (cfg, n) => ok([n <= MAX_ROUND ? `round-${n}` : null, cheerKey(cfg, "round")]);
export const sampleClips = (cfg) => ok(["ph-work", "round-3", "of-8", cheerKey(cfg, "work"), "warn-30", cheerKey(cfg, "push")]);

/** Audios que conviene precargar al iniciar un temporizador (para que la cuenta 3-2-1 no se atrase). */
export function preloadKeys(phases, cfgIn){
  const cfg = voiceConfig(cfgIn);
  const keys = new Set(["warn-60", "warn-30", "warn-10", "halfway", "last-round", "fin-time", "open-amrap", "open-fortime"]);
  for (let n = 1; n <= Math.min(MAX_COUNT, cfg.countdownFrom); n++) keys.add(`count-${n}`);
  phases.forEach(p => { keys.add(phaseKey(p)); if (p.round && p.round <= MAX_ROUND) keys.add(`round-${p.round}`); });
  const rounds = Math.max(0, ...phases.map(p => p.round || 0));
  if (rounds >= 2 && rounds <= MAX_ROUND) keys.add(`of-${rounds}`);
  for (const kind of Object.keys(CHEERS[cfg.style] || {})) CHEERS[cfg.style][kind].forEach((_, i) => keys.add(`ch-${cfg.style}-${kind}-${i}`));
  return [...keys].filter(k => k in PHRASES);
}
