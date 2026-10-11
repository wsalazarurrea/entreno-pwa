/* Qué anunciar en voz alta (y qué pitido sonar) en cada segundo del temporizador.
   Función pura: recibe la situación del segundo actual y la configuración del usuario. */

export const DEFAULT_VOICE = {
  enabled: true,        // voz
  beeps: true,          // pitidos
  countdown: "voz",     // cuenta regresiva final: "voz" | "pitidos" | "ambos" | "no"
  countdownFrom: 3,     // desde qué segundo contar (3, 5 o 10)
  phaseNames: true,     // anunciar cada fase ("Trabajo", "Descanso")
  rounds: true,         // …y la ronda ("Ronda 3 de 8")
  halfway: false,       // "Mitad" a la mitad de fases de 30 s o más
  warnings: [60, 30],   // "Queda un minuto", "Quedan 30 segundos"…
  every: 60,            // AMRAP / por tiempo / fases largas: anunciar el tiempo cada N segundos (0 = nunca)
  style: "garabatos",   // "neutro" | "chileno" | "garabatos"
  lang: "es-MX",
  rate: 1,
  volume: 1,
};

export const voiceConfig = (v) => ({ ...DEFAULT_VOICE, ...(v || {}) });

/* Frases de ánimo por estilo. "garabatos" suma las chilenas más las de grueso calibre. */
const CHILENO = {
  work: ["¡Vamos, weón!", "¡Dale po!", "¡A darle con todo!", "¡Saca la garra!", "¡Ya po, no te achiquí!", "¡Con todo, cabro!"],
  rest: ["Respira, weón.", "Descansa un poco, campeón.", "Suelta los brazos, que viene más.", "Tranqui, toma aire."],
  push: ["¡No aflojí!", "¡Aguanta, weón!", "¡Tú podí!", "¡Ya queda poco, po!", "¡Saca la garra!"],
  last: ["¡Déjalo todo, weón!", "¡La última, con todo!"],
  open: ["¡A romperla, weón!", "¡Con todo, cabro!"],
  round: ["¡Bacán!", "¡Eso!", "¡Otra más!", "¡Bien ahí!"],
  finish: ["¡La raja!", "¡Erí una máquina, weón!", "¡Bien ahí, campeón!", "¡Bacán, lo lograste!"],
};
const GARABATOS = {
  work: ["¡Vamos, mierda!", "¡Dale con todo, concha de tu madre!", "¡A la chucha el cansancio!", "¡Vamos, weón, mierda!"],
  rest: ["Respira, weón, que esto no ha terminado.", "Descansa, que ahora viene lo más pulento."],
  push: ["¡Tú puedes, concha de tu madre!", "¡No aflojí, mierda!", "¡Aguanta, conchetumare!", "¡Ni cagando te rendí!"],
  last: ["¡Última, mierda! ¡Déjalo todo!", "¡La última, concha de tu madre!"],
  open: ["¡Vamos, mierda!", "¡Dale, conchetumare!"],
  round: ["¡Eso, mierda!", "¡Bien, conchetumare!", "¡Otra más, weón!"],
  finish: ["¡Terminaste, conchetumare! ¡La raja!", "¡Erí una bestia, weón!", "¡Puta que estuvo bueno!"],
};

function bank(style, kind){
  if (style === "chileno") return CHILENO[kind];
  if (style === "garabatos") return [...CHILENO[kind], ...GARABATOS[kind], ...GARABATOS[kind]]; // más peso a los garabatos
  return null;
}
/** Frase de ánimo al azar del estilo configurado ("" en estilo neutro). */
/** Lista de frases del estilo (vacía en "neutro"). */
export function cheerBank(cfgIn, kind){ return bank(voiceConfig(cfgIn).style, kind) || []; }

const lastCheer = {};
export function cheer(cfgIn, kind, rng = Math.random){
  const b = bank(voiceConfig(cfgIn).style, kind);
  if (!b) return "";
  // Evita repetir la misma frase dos veces seguidas.
  const options = b.filter(x => x !== lastCheer[kind]);
  const pick = (options.length ? options : b)[Math.floor(rng() * (options.length || b.length))];
  lastCheer[kind] = pick;
  return pick;
}
const join = (...parts) => parts.filter(Boolean).join(" ");

/** Lo que se dice al terminar el temporizador. */
export function finishSpeech(cfgIn, mode, result){
  const base = mode === "fortime" && result && !result.capped ? `¡Terminado! Tiempo: ${Math.floor(result.timeSec / 60)} minutos ${result.timeSec % 60} segundos.`
    : mode === "amrap" && result ? `¡Tiempo! ${result.rounds} rondas.` : "¡Terminado!";
  return join(base, cheer(cfgIn, "finish") || "Buen trabajo.");
}

/** Lo que se dice al marcar una ronda en AMRAP. */
export function roundSpeech(cfgIn, n){
  return join(`Ronda ${n}.`, cheer(cfgIn, "round"));
}

/** 60 → "un minuto", 120 → "2 minutos", 30 → "30 segundos", 90 → "1 minuto 30". */
export function sayDuration(sec){
  if (sec % 60 === 0) return sec === 60 ? "un minuto" : `${sec / 60} minutos`;
  if (sec < 60) return `${sec} segundos`;
  return `${Math.floor(sec / 60)} minuto${sec >= 120 ? "s" : ""} ${sec % 60}`;
}

/**
 * ctx = { phase, remaining (s), elapsed (s en la fase), started (la fase recién empieza), mode, rounds }
 * Devuelve { speech?, beep? } con lo que corresponde a este segundo.
 */
export function cueFor(ctx, cfgIn){
  const cfg = voiceConfig(cfgIn);
  const { phase, remaining, elapsed, started, mode, rounds } = ctx;
  const say = (s) => (cfg.enabled ? s : undefined);
  const beep = (b) => (cfg.beeps ? b : undefined);

  if (started) {
    let speech;
    if (cfg.phaseNames) {
      if (phase.open) speech = join(mode === "amrap" ? `AMRAP de ${sayDuration(phase.sec)}.` : "Por tiempo.", cheer(cfg, "open") || "¡Vamos!");
      else {
        const lastRound = phase.kind === "work" && phase.round && rounds > 1 && phase.round === rounds;
        speech = phase.label + ".";
        if (cfg.rounds && phase.round && phase.kind === "work" && rounds > 1) speech += lastRound ? " Última ronda." : ` Ronda ${phase.round} de ${rounds}.`;
        if (phase.kind === "work") speech = join(speech, cheer(cfg, lastRound ? "last" : "work"));
        else if (phase.kind === "rest" && phase.sec >= 10) speech = join(speech, cheer(cfg, "rest"));
      }
    }
    return { speech: say(speech), beep: beep(phase.kind === "work" ? "go" : "rest") };
  }

  const countUp = phase.open && mode === "fortime";
  if (cfg.countdown !== "no" && remaining >= 1 && remaining <= cfg.countdownFrom) {
    return {
      speech: cfg.countdown === "voz" || cfg.countdown === "ambos" ? say(String(remaining)) : undefined,
      // Si la voz está apagada, la cuenta "por voz" pasa a pitidos para no quedar en silencio.
      beep: cfg.countdown === "pitidos" || cfg.countdown === "ambos" || !cfg.enabled ? beep("tick") : undefined,
    };
  }

  const longEnough = phase.sec >= remaining + 5;
  if (cfg.warnings.includes(remaining) && remaining > cfg.countdownFrom && longEnough) {
    return { speech: say(join(remaining === 60 ? "Queda un minuto." : `Quedan ${sayDuration(remaining)}.`, cheer(cfg, "push"))) };
  }

  if (cfg.halfway && !phase.open && phase.sec >= 30 && elapsed === Math.floor(phase.sec / 2)) {
    return { speech: say(join("Mitad.", cheer(cfg, "push"))) };
  }

  const timed = phase.open || phase.sec >= 180;
  if (cfg.every > 0 && timed && remaining > cfg.countdownFrom && !cfg.warnings.includes(remaining)) {
    if (countUp && elapsed > 0 && elapsed % cfg.every === 0) return { speech: say(join(elapsed === 60 ? "Va un minuto." : `Van ${sayDuration(elapsed)}.`, cheer(cfg, "work"))) };
    if (!countUp && remaining % cfg.every === 0 && remaining < phase.sec) return { speech: say(join(`Quedan ${sayDuration(remaining)}.`, cheer(cfg, "push"))) };
  }
  return {};
}
