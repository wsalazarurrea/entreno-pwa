/* Modelo de entrenamientos (state.workouts). Cada entrenamiento guarda sus
   ejercicios y series tal como se hicieron, y todo lo demás (anterior,
   sugerencias, gráficas, récords, racha) se deriva de aquí. Así editar o
   borrar un entrenamiento pasado corrige automáticamente todo el resto.

   Workout = {
     id, source: "app" | "hevy" | "hevy-seed",
     date: "YYYY-MM-DD" (local), startedAt: ms | null, durationSec: number | null,
     title, tag?, accent?, routineId?, notes?, prs?: [{ name, kind, value }],
     exercises: [{ name, unit, note?, rest?, sets: [{ w, r, type }], agg?: { e1rm, tw, vol } }]
   }
   `agg` sólo existe en días importados sin detalle de series (historial base). */

import { newId } from "../data/routines.js";

export const SET_TYPES = {
  normal: { label: "Normal", short: null },
  warmup: { label: "Calentamiento", short: "C", cls: "text-violet" },
  drop: { label: "Drop set", short: "D", cls: "text-teal" },
  failure: { label: "Al fallo", short: "F", cls: "text-coral" },
};

export const normName = (n) => String(n || "").replace(/\s+/g, " ").trim();
export const isWorking = (s) => s.type !== "warmup";
export const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);
const round1 = (x) => Math.round(x * 10) / 10;

export function sortWorkouts(ws){
  return [...ws].sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt || 0) - (a.startedAt || 0));
}

/** Métricas de un ejercicio dentro de un entrenamiento (series de trabajo). */
export function exerciseSummary(ex){
  const sets = (ex.sets || []).filter(isWorking);
  if (!sets.length && ex.agg) return { e1rm: ex.agg.e1rm || 0, tw: ex.agg.tw || 0, vol: ex.agg.vol || 0, nSets: 0, reps: 0, detailed: false };
  let best = 0, tw = 0, vol = 0, reps = 0;
  sets.forEach(s => {
    const w = s.w || 0, r = s.r || 0;
    best = Math.max(best, e1rm(w, r)); tw = Math.max(tw, w); vol += w * r; reps = Math.max(reps, r);
  });
  return { e1rm: round1(best), tw, vol: Math.round(vol), nSets: sets.length, reps, detailed: true };
}

export function workoutStats(w){
  let volume = 0, sets = 0;
  w.exercises.forEach(ex => {
    const s = exerciseSummary(ex);
    volume += s.vol; sets += s.nSets;
  });
  return { volume, sets, exercises: w.exercises.length };
}

/** Última vez que se hizo `name` con series registradas (para la columna
 * "Anterior" y la progresión sugerida). `workouts` ordenados desc. */
export function lastPerformance(workouts, name, excludeId = null){
  for (const w of workouts) {
    if (w.id === excludeId) continue;
    const ex = w.exercises.find(e => e.name === name && (e.sets || []).length);
    if (ex) return { date: w.date, sets: ex.sets, unit: ex.unit };
  }
  return null;
}

/** Puntos por entrenamiento (orden ascendente) para gráficas e historial. */
export function exerciseHistory(workouts, name){
  const out = [];
  for (const w of workouts) {
    w.exercises.forEach(ex => {
      if (ex.name !== name) return;
      const s = exerciseSummary(ex);
      out.push({ date: w.date, workoutId: w.id, title: w.title, sets: ex.sets || [], unit: ex.unit, ...s });
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function exerciseRecords(workouts, name){
  const rec = { maxWeight: null, bestE1rm: null, bestSet: null, bestSession: null, maxReps: null };
  exerciseHistory(workouts, name).forEach(p => {
    if (p.tw > 0 && (!rec.maxWeight || p.tw > rec.maxWeight.value)) rec.maxWeight = { value: p.tw, date: p.date };
    if (p.e1rm > 0 && (!rec.bestE1rm || p.e1rm > rec.bestE1rm.value)) rec.bestE1rm = { value: p.e1rm, date: p.date };
    if (p.vol > 0 && (!rec.bestSession || p.vol > rec.bestSession.value)) rec.bestSession = { value: p.vol, date: p.date };
    p.sets.filter(isWorking).forEach(s => {
      const v = (s.w || 0) * (s.r || 0);
      if (v > 0 && (!rec.bestSet || v > rec.bestSet.value)) rec.bestSet = { value: v, w: s.w, r: s.r, date: p.date };
      if ((s.r || 0) > 0 && (!rec.maxReps || s.r > rec.maxReps.value)) rec.maxReps = { value: s.r, w: s.w, date: p.date };
    });
  });
  return rec;
}

/** Récords que `workout` supera respecto de todos los entrenamientos previos. */
export function detectPRs(previous, workout){
  const prs = [];
  workout.exercises.forEach(ex => {
    const s = exerciseSummary(ex);
    if (!s.detailed || !s.nSets) return;
    const rec = exerciseRecords(previous, ex.name);
    if (!rec.maxWeight && !rec.bestE1rm && !rec.maxReps) return; // primera vez: no es "récord"
    if (s.tw > 0 && s.tw > (rec.maxWeight?.value || 0)) prs.push({ name: ex.name, kind: "weight", value: s.tw });
    if (s.e1rm > 0 && s.e1rm > (rec.bestE1rm?.value || 0) + 0.1) prs.push({ name: ex.name, kind: "e1rm", value: s.e1rm });
    if (!s.tw && s.reps > (rec.maxReps?.value || 0)) prs.push({ name: ex.name, kind: "reps", value: s.reps });
  });
  return prs;
}

export const PR_LABEL = { weight: "Peso máximo", e1rm: "Mejor 1RM estimado", reps: "Más repeticiones" };

/* ---------- Construcción desde el historial base de Hevy ---------- */

function matchRoutine(routines, names){
  let best = null, bestScore = 0;
  routines.forEach(r => {
    const rn = new Set(r.ex.map(e => e.name));
    if (!rn.size) return;
    const overlap = names.filter(n => rn.has(n)).length;
    const score = overlap / Math.max(rn.size, names.length);
    if (score > bestScore) { bestScore = score; best = r; }
  });
  return bestScore >= 0.4 ? best : null;
}

function unitFromRoutines(routines, name, sets){
  for (const r of routines) {
    const e = r.ex.find(x => x.name === name);
    if (e) return e.unit;
  }
  if (sets && sets.length && sets.every(s => s.w == null)) return "bw";
  return /\(Mancuerna\)/i.test(name) ? "kg/mano" : "kg";
}

/** Convierte el historial agregado de Hevy (SEED: totales por día y las
 * series de la última vez de cada ejercicio) en entrenamientos por fecha. */
export function buildSeedWorkouts(seed, routines){
  const byDate = new Map();
  const get = (d) => { if (!byDate.has(d)) byDate.set(d, new Map()); return byDate.get(d); };
  Object.entries(seed.hist || {}).forEach(([rawName, entries]) => {
    const name = normName(rawName);
    entries.forEach(en => get(en.d).set(name, { name, sets: [], agg: { e1rm: en.e1rm, tw: en.tw, vol: en.vol } }));
  });
  Object.entries(seed.last || {}).forEach(([rawName, lp]) => {
    const name = normName(rawName);
    const day = get(lp.date);
    const ex = day.get(name) || { name, sets: [] };
    ex.sets = (lp.sets || []).map(s => ({ w: s.w ?? null, r: s.r ?? null, type: "normal" }));
    day.set(name, ex);
  });
  return [...byDate.entries()].map(([date, exMap]) => {
    const exercises = [...exMap.values()].map(e => ({ ...e, unit: unitFromRoutines(routines, e.name, e.sets) }));
    exercises.sort((a, b) => exerciseSummary(b).vol - exerciseSummary(a).vol);
    const r = matchRoutine(routines, exercises.map(e => e.name));
    return {
      id: `hevy-${date}`, source: "hevy-seed", date, startedAt: null, durationSec: null,
      title: r?.title || "Entrenamiento", tag: r?.tag || null, accent: r?.accent || "violet",
      exercises,
    };
  });
}

/** Migra el estado v1 (history/lastperf/sessions agregados) al modelo de
 * entrenamientos. Las sesiones hechas en la app se reconstruyen con lo que
 * quedó guardado: series de la última vez (lastperf) o, si no, totales. */
export function migrateV1Workouts(s, seed){
  const routines = s.routines || [];
  const workouts = buildSeedWorkouts(seed, routines);
  const seedKeys = new Set();
  Object.entries(seed.hist || {}).forEach(([n, es]) => es.forEach(e => seedKeys.add(`${normName(n)}|${e.d}`)));

  const sessions = s.sessions || [];
  const usedByDate = new Map();
  sessions.forEach((sess, i) => {
    const routine = routines.find(r => r.tag === sess.tag);
    const order = routine ? routine.ex.map(e => e.name) : [];
    const used = usedByDate.get(sess.date) || new Set();
    const exercises = [];
    Object.entries(s.history || {}).forEach(([rawName, entries]) => {
      const name = normName(rawName);
      if (used.has(name)) return;
      const en = (entries || []).find(e => e.d === sess.date && !seedKeys.has(`${name}|${e.d}`));
      if (!en) return;
      // Si hay dos sesiones el mismo día, cada una se queda con los ejercicios de su rutina.
      const sameDayOthers = sessions.filter((o, j) => j !== i && o.date === sess.date).length;
      if (sameDayOthers && order.length && !order.includes(name)) return;
      const lp = (s.lastperf || {})[rawName];
      const sets = lp && lp.date === sess.date ? (lp.sets || []).map(x => ({ w: x.w ?? null, r: x.r ?? null, type: "normal" })) : [];
      exercises.push({ name, unit: unitFromRoutines(routines, name, sets), sets, agg: { e1rm: en.e1rm, tw: en.tw, vol: en.vol } });
      used.add(name);
    });
    usedByDate.set(sess.date, used);
    exercises.sort((a, b) => {
      const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    workouts.push({
      id: newId("w"), source: "app", date: sess.date, startedAt: null, durationSec: sess.durationSec ?? null,
      title: sess.title || "Entrenamiento", tag: sess.tag || null, accent: routine?.accent || "violet",
      routineId: routine?.id, exercises, legacy: true,
    });
  });
  return sortWorkouts(workouts);
}
