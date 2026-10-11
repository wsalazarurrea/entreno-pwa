/* Temporizadores de intervalos (tipo Intervals Pro).

   Timer = {
     id, name, warmup, cooldown,                 // segundos (0 = sin fase)
     mode: "intervals" | "amrap" | "fortime",     // por defecto "intervals"
     capSec,                                      // amrap: duración · fortime: tiempo límite
     workout: ["5 dominadas", …], notes,          // descripción del WOD (opcional)
     steps: [{ id, name, sec, kind: "work" | "rest" }],  // una ronda
     rounds, restRounds,                          // repeticiones de la ronda y descanso entre ellas
     sets, restSets,                              // repeticiones del bloque completo y descanso entre series
     skipLastRest,                                // no terminar cada serie con un descanso
   }

   La ejecución no lleva un contador que "corre": guarda marcas de tiempo y la fase
   actual se calcula a partir del tiempo transcurrido. Así sigue siendo exacta aunque
   iOS congele o cierre la app, y al volver retoma en el punto correcto. */

import { newId } from "../data/routines.js";

const step = (name, sec, kind) => ({ id: newId("p"), name, sec, kind });

export function blankTimer(){
  return { id: newId("t"), name: "", warmup: 0, cooldown: 0, steps: [step("Trabajo", 30, "work"), step("Descanso", 15, "rest")], rounds: 8, restRounds: 0, sets: 1, restSets: 60, skipLastRest: true };
}

export function presetTimers(){
  return [
    { id: newId("t"), name: "Tabata", warmup: 10, cooldown: 0, steps: [step("Trabajo", 20, "work"), step("Descanso", 10, "rest")], rounds: 8, restRounds: 0, sets: 1, restSets: 60, skipLastRest: true },
    { id: newId("t"), name: "HIIT 40/20", warmup: 10, cooldown: 0, steps: [step("Trabajo", 40, "work"), step("Descanso", 20, "rest")], rounds: 10, restRounds: 0, sets: 1, restSets: 60, skipLastRest: true },
    { id: newId("t"), name: "EMOM 10 min", warmup: 10, cooldown: 0, steps: [step("Minuto", 60, "work")], rounds: 10, restRounds: 0, sets: 1, restSets: 60, skipLastRest: true },
    { id: newId("t"), name: "Boxeo 3×1", warmup: 10, cooldown: 0, steps: [step("Round", 180, "work"), step("Descanso", 60, "rest")], rounds: 6, restRounds: 0, sets: 1, restSets: 60, skipLastRest: true },
  ];
}

export function cloneTimer(t){
  return { ...JSON.parse(JSON.stringify(t)), id: newId("t"), steps: t.steps.map(s => ({ ...s, id: newId("p") })) };
}

/** Lista plana de fases con su inicio (segundos desde el comienzo). */
export function buildPhases(t){
  const out = [];
  const push = (p) => { if (p.sec > 0) out.push(p); };
  push({ kind: "warmup", label: (t.warmup || 0) <= 30 ? "Prepárate" : "Calentamiento", sec: t.warmup || 0 });
  if (t.mode === "amrap" || t.mode === "fortime") {
    push({ kind: "work", label: t.mode === "amrap" ? "AMRAP" : "Por tiempo", sec: t.capSec || 0, open: true });
    push({ kind: "cooldown", label: "Vuelta a la calma", sec: t.cooldown || 0 });
    let acc = 0;
    out.forEach(p => { p.start = acc; acc += p.sec; });
    return out;
  }
  const lastWork = Math.max(-1, ...t.steps.map((s, i) => (s.kind === "work" && s.sec > 0 ? i : -1)));
  for (let set = 1; set <= Math.max(1, t.sets); set++) {
    for (let round = 1; round <= Math.max(1, t.rounds); round++) {
      const lastRound = round === Math.max(1, t.rounds);
      t.steps.forEach((s, i) => {
        if (t.skipLastRest && lastRound && i > lastWork && s.kind === "rest") return;
        push({ kind: s.kind, label: s.name || (s.kind === "work" ? "Trabajo" : "Descanso"), sec: s.sec, round, set });
      });
      if (!lastRound) push({ kind: "rest", label: "Descanso entre rondas", sec: t.restRounds || 0, round, set });
    }
    if (set < Math.max(1, t.sets)) push({ kind: "rest", label: "Descanso entre series", sec: t.restSets || 0, set });
  }
  push({ kind: "cooldown", label: "Vuelta a la calma", sec: t.cooldown || 0 });
  let acc = 0;
  out.forEach(p => { p.start = acc; acc += p.sec; });
  return out;
}

export const totalSec = (phases) => phases.reduce((a, p) => a + p.sec, 0);

/** "20s / 10s × 8" — resumen corto de la estructura. */
export function timerSummary(t){
  if (t.mode === "amrap") return `AMRAP ${fmtSec(t.capSec || 0)}`;
  if (t.mode === "fortime") return `Por tiempo · límite ${fmtSec(t.capSec || 0)}`;
  const steps = t.steps.filter(s => s.sec > 0);
  const st = steps.length > 3 ? `${steps.length} intervalos de ${fmtSec(Math.max(...steps.map(s => s.sec)))}` : steps.map(s => fmtSec(s.sec)).join(" / ");
  return `${st} × ${t.rounds}${t.sets > 1 ? ` · ${t.sets} series` : ""}`;
}

/** 20 → "0:20"; 185 → "3:05". */
export function fmtSec(sec){
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/* ---------- Ejecución ---------- */

export function startRun(timer){
  const t = JSON.parse(JSON.stringify(timer));
  return { id: newId("r"), timer: t, startedAt: Date.now(), pausedAt: null, pausedMs: 0, offsetMs: 0, roundsDone: 0, finishedAt: null };
}

/** Estado actual teniendo en cuenta "Terminé" (por tiempo): fija el reloj en finishedAt. */
export function runStatus(run, phases, now = Date.now()){
  const ms = elapsedMs(run, run.finishedAt ?? now);
  const cur = phaseAt(phases, ms);
  return run.finishedAt ? { ...cur, done: true, ms } : { ...cur, ms };
}

/** "Terminé" en un WOD por tiempo. */
export function finishRun(run, now = Date.now()){
  return run.finishedAt ? run : { ...run, finishedAt: run.pausedAt ?? now };
}

/** Resultado del WOD: rondas (AMRAP) o tiempo (por tiempo). */
export function wodResult(run, phases){
  const t = run.timer;
  if (t.mode === "amrap") return { rounds: run.roundsDone || 0 };
  if (t.mode === "fortime") {
    const work = phases.find(p => p.open);
    const ms = elapsedMs(run, run.finishedAt ?? Date.now());
    const timeSec = Math.round(Math.min(work ? work.sec * 1000 : ms, Math.max(0, ms - (work ? work.start * 1000 : 0))) / 1000);
    return { timeSec, capped: !run.finishedAt };
  }
  return null;
}

export function resultLabel(t, r){
  if (!r) return "";
  if (t.mode === "amrap") return `${r.rounds} ${r.rounds === 1 ? "ronda" : "rondas"}`;
  if (t.mode === "fortime") return r.capped ? `Límite alcanzado (${fmtSec(t.capSec)})` : `Tiempo ${fmtSec(r.timeSec)}`;
  return "";
}

export function elapsedMs(run, now = Date.now()){
  return Math.max(0, (run.pausedAt ?? now) - run.startedAt - run.pausedMs + run.offsetMs);
}

/** Fase en curso: { index, phase, elapsedInPhaseMs, remainingMs, done }. */
export function phaseAt(phases, ms){
  const total = totalSec(phases) * 1000;
  if (ms >= total || !phases.length) return { index: phases.length, phase: null, elapsedInPhaseMs: 0, remainingMs: 0, done: true };
  let i = phases.findIndex(p => ms < (p.start + p.sec) * 1000);
  if (i < 0) i = phases.length - 1;
  const p = phases[i];
  const inPhase = ms - p.start * 1000;
  return { index: i, phase: p, elapsedInPhaseMs: inPhase, remainingMs: p.sec * 1000 - inPhase, done: false };
}

export function pauseRun(run, now = Date.now()){ return run.pausedAt ? run : { ...run, pausedAt: now }; }
export function resumeRun(run, now = Date.now()){ return run.pausedAt ? { ...run, pausedMs: run.pausedMs + (now - run.pausedAt), pausedAt: null } : run; }

/** Salta al comienzo de la fase siguiente. */
export function skipPhase(run, phases, now = Date.now()){
  const cur = phaseAt(phases, elapsedMs(run, now));
  return cur.done ? run : { ...run, offsetMs: run.offsetMs + cur.remainingMs };
}

/** Vuelve al inicio de la fase actual (o a la anterior si recién empezó). */
export function backPhase(run, phases, now = Date.now()){
  const ms = elapsedMs(run, now);
  const cur = phaseAt(phases, ms);
  const idx = cur.done ? phases.length : cur.index;
  const target = cur.done || cur.elapsedInPhaseMs < 2000 ? phases[Math.max(0, idx - 1)] : phases[idx];
  return { ...run, offsetMs: run.offsetMs - (ms - target.start * 1000) };
}

/** Duración real (reloj, sin pausas). Si se saltaron fases, es menor que la secuencia completa. */
export function workedSec(run, now = Date.now()){
  const end = run.finishedAt ?? run.pausedAt ?? now;
  return Math.max(0, Math.round((end - run.startedAt - run.pausedMs) / 1000));
}
