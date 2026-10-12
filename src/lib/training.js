import { storage } from "./storage.js";
import { SEED } from "../data/seedHistory.js";
import { DEFAULT_ROUTINES, cloneRoutines, newId } from "../data/routines.js";
import { findExercise, unitForEquipment } from "../data/exercises.js";
import { localDate } from "./dates.js";
import { presetTimers } from "./intervals.js";
import { PLAN_ID, buildDefinicion12 } from "../data/plans/definicion12.js";
import {
  buildSeedWorkouts, migrateV1Workouts, sortWorkouts, lastPerformance, isWorking,
  detectPRs, workoutStats, normName,
} from "./workouts.js";

export const DEFAULT_REST_SECONDS = 120;
export const DEFAULT_PROGRAM_NAME = "Mi entrenamiento";
export const STATE_VERSION = 2;

const STATE_KEY = "pt_state_v1";
const ACTIVE_KEY = "pt_active_v1";
const TIMER_RUN_KEY = "pt_timer_run_v1";

export async function loadState(){ try{ const r=await storage.get(STATE_KEY); return r?JSON.parse(r.value):null; }catch{ return null; } }
export async function saveState(s){ try{ await storage.set(STATE_KEY, JSON.stringify(s)); }catch(e){ console.error(e); } }

/* El entrenamiento en curso se guarda aparte y en cada cambio: si iOS cierra
   la app en segundo plano, al volver se retoma exactamente donde quedó. */
export async function loadActive(){ try{ const r=await storage.get(ACTIVE_KEY); return r?JSON.parse(r.value):null; }catch{ return null; } }
export async function saveActive(a){ try{ await storage.set(ACTIVE_KEY, JSON.stringify(a)); }catch(e){ console.error(e); } }
export async function clearActive(){ try{ await storage.delete(ACTIVE_KEY); }catch(e){ console.error(e); } }

/* Temporizador de intervalos en curso (mismo motivo: sobrevivir a que iOS cierre la app). */
export async function loadTimerRun(){ try{ const r=await storage.get(TIMER_RUN_KEY); return r?JSON.parse(r.value):null; }catch{ return null; } }
export async function saveTimerRun(run){ try{ await storage.set(TIMER_RUN_KEY, JSON.stringify(run)); }catch(e){ console.error(e); } }
export async function clearTimerRun(){ try{ await storage.delete(TIMER_RUN_KEY); }catch(e){ console.error(e); } }

export function seedState(){
  const routines = cloneRoutines(DEFAULT_ROUTINES);
  return migrateState({
    version: STATE_VERSION, programName: DEFAULT_PROGRAM_NAME, restSeconds: DEFAULT_REST_SECONDS,
    routines, workouts: sortWorkouts(buildSeedWorkouts(SEED, routines)), customExercises: [], timers: presetTimers(),
  }).state;
}

/** Perfil activo (cada rutina pertenece a un perfil). */
export const activeProfile = (s) => s.profiles?.find(p => p.id === s.activeProfileId) || s.profiles?.[0] || null;

/** Rellena campos nuevos en estados guardados por versiones anteriores, para
 * no perder el historial del usuario al añadir funciones. v1 → v2 convierte
 * history/lastperf/sessions en entrenamientos con detalle (se guarda una
 * copia de lo anterior en _v1backup por si hiciera falta recuperarlo). */
export function migrateState(s){
  if(!s) return { state:s, changed:false };
  const n = { ...s }; let changed = false;
  if(!Array.isArray(n.routines) || !n.routines.length){ n.routines = cloneRoutines(DEFAULT_ROUTINES); changed = true; }
  if(typeof n.restSeconds !== "number"){ n.restSeconds = DEFAULT_REST_SECONDS; changed = true; }
  if(!n.programName){ n.programName = DEFAULT_PROGRAM_NAME; changed = true; }
  if(!n.version || n.version < 2){
    n.workouts = migrateV1Workouts(n, SEED);
    n._v1backup = { history: n.history, lastperf: n.lastperf, sessions: n.sessions };
    delete n.history; delete n.lastperf; delete n.sessions;
    n.version = STATE_VERSION; changed = true;
  }
  if(!Array.isArray(n.workouts)){ n.workouts = []; changed = true; }
  if(!Array.isArray(n.customExercises)){ n.customExercises = []; changed = true; }
  if(!Array.isArray(n.timers)){ n.timers = presetTimers(); changed = true; }
  // Perfiles: agrupan rutinas con un mismo fin. Las rutinas sin perfil van al primero.
  if(!Array.isArray(n.profiles) || !n.profiles.length){ n.profiles = [{ id:"pf-main", name:n.programName || DEFAULT_PROGRAM_NAME }]; changed = true; }
  const ids = new Set(n.profiles.map(p => p.id));
  if(n.routines.some(r => !ids.has(r.profileId))){ n.routines = n.routines.map(r => ids.has(r.profileId) ? r : { ...r, profileId:n.profiles[0].id }); changed = true; }
  if(!ids.has(n.activeProfileId)){ n.activeProfileId = n.profiles[0].id; changed = true; }
  // Plan de definición de 12 semanas: se carga una vez, en su propio perfil, y queda activo.
  const imported = n.importedPlans || [];
  if(!imported.includes(PLAN_ID)){
    const plan = buildDefinicion12();
    n.profiles = [...n.profiles, plan.profile];
    n.routines = [...n.routines, ...plan.routines];
    n.activeProfileId = plan.profile.id;
    n.importedPlans = [...imported, PLAN_ID]; changed = true;
  }
  return { state:n, changed };
}

/* ---------- Progresión ---------- */

export function incFor(ex, custom = []){
  if(ex.unit==="bw") return 0;
  if(ex.unit==="kg/mano" || /Mancuerna/.test(ex.name)) return 2;
  const eq = findExercise(ex.name, custom)?.equipment;
  if(eq==="Cable" || /Cable|Aperturas|Elevación Lateral|Vuelos|Tirón/.test(ex.name)) return 2.5;
  return 5;
}

/** Sugerencia de carga a partir de la última vez (`last` = lastPerformance). */
export function suggestion(ex, last, custom = []){
  const inc = incFor(ex, custom);
  const sets = (last?.sets || []).filter(isWorking);
  if(ex.unit==="bw"){
    if(sets.length && sets.every(s=>(s.r||0)>=ex.hi)) return {w:0, kind:"up", msg:`superaste ${ex.hi} reps a peso corporal → añade lastre`};
    return {w:0, kind:"hold", msg:`peso corporal · busca +1 rep (meta ${ex.hi})`};
  }
  const working = sets.filter(s=>s.w!=null);
  if(!working.length) return {w:ex.start||0, kind:"start", msg: ex.start ? `arranque sugerido ${ex.start} kg` : "primera vez: elige un peso cómodo"};
  const w = Math.max(...working.map(s=>s.w||0));
  const atTop = working.filter(s=>(s.w||0)===w);
  const allHi = atTop.length>0 && atTop.every(s=>(s.r||0)>=ex.hi);
  if(allHi) return {w:+(w+inc).toFixed(1), kind:"up", msg:`cerraste ${ex.hi} reps en todas → sube a ${+(w+inc).toFixed(1)} kg`};
  return {w, kind:"hold", msg:`mantén ${w} kg y suma reps (meta ${ex.hi})`};
}

/* ---------- Entrenamiento en curso ---------- */

export const parseNum = (v) => {
  if(v===""||v==null) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const str = (v) => (v==null ? "" : String(v));
const blankSet = () => ({ key:newId("s"), w:"", r:"", type:"normal", done:false });

/** Arma un ejercicio de sesión. `def` = { name, unit, lo, hi, start, sets, rest, note }. */
export function makeSessionExercise(def, state, presetSets = null){
  const custom = state.customExercises || [];
  const known = findExercise(def.name, custom);
  const ex = {
    key: newId("e"),
    name: def.name,
    unit: def.unit || (known ? unitForEquipment(known.equipment) : "kg"),
    lo: def.lo ?? 8, hi: def.hi ?? 12, start: def.start ?? 0,
    rest: def.rest ?? null,
    note: def.note || "",
    userNote: def.userNote || "",
    ...(def.agg ? { agg: def.agg } : {}),
  };
  const sets = presetSets || Array.from({ length: Math.max(1, def.sets || 3) }, blankSet);
  return { ...ex, sets };
}

/** Valores sugeridos (en gris) de una serie: peso sugerido y reps de la vez
 * anterior. `last` = lastPerformance del ejercicio, `sug` = suggestion. */
export function placeholderFor(ex, si, last, sug){
  const prevSet = last?.sets?.[si] || null;
  const set = ex.sets[si];
  let pw = "", pr = "";
  if(set.type==="warmup"){
    if(prevSet?.type==="warmup"){ pw = str(prevSet.w); pr = str(prevSet.r); }
  } else if(ex.unit!=="bw"){
    pw = sug.w ? str(sug.w) : str(prevSet?.w);
  }
  if(set.type!=="warmup"){
    if(sug.kind==="up" || !prevSet) pr = str(ex.lo || "");
    else pr = str(prevSet.r);
  }
  return { pw, pr, prevSet };
}

export function sessionFromRoutine(routine, state){
  return {
    id: newId("a"), mode:"live", routineId: routine.id, title: routine.title, tag: routine.tag, accent: routine.accent,
    startedAt: Date.now(), notes:"", restEnd:null, restTotal:0,
    exercises: routine.ex.map(e => makeSessionExercise(e, state)),
  };
}

export function emptySession(){
  return { id:newId("a"), mode:"live", routineId:null, title:"Entrenamiento libre", tag:null, accent:"amber", startedAt:Date.now(), notes:"", restEnd:null, restTotal:0, exercises:[] };
}

/** "Repetir" (mode live, series vacías con lo de esa vez como referencia) o
 * "Editar" (mode edit, series cargadas y marcadas). */
export function sessionFromWorkout(w, state, mode){
  const routine = (state.routines||[]).find(r => r.id === w.routineId);
  const exercises = w.exercises.map(ex => {
    const rEx = routine?.ex.find(e => e.name === ex.name);
    const def = { ...(rEx||{}), name:ex.name, unit:ex.unit, agg: mode==="edit" ? ex.agg : undefined, rest:ex.rest ?? rEx?.rest ?? null, note:rEx?.note || "", userNote: mode==="edit" ? (ex.note||"") : "", sets: ex.sets?.length || 3 };
    const preset = mode==="edit"
      ? (ex.sets||[]).map(s => ({ key:newId("s"), w:str(s.w), r:str(s.r), type:s.type||"normal", done:true }))
      : (ex.sets?.length ? ex.sets.map(s => ({ ...blankSet(), type:s.type||"normal" })) : null);
    return makeSessionExercise(def, state, preset);
  });
  if(mode==="edit"){
    return { id:newId("a"), mode:"edit", workoutId:w.id, source:w.source, routineId:w.routineId||null, title:w.title, tag:w.tag||null, accent:w.accent||"violet",
      date:w.date, startedAt:w.startedAt, durationSec:w.durationSec, notes:w.notes||"", restEnd:null, restTotal:0, exercises };
  }
  return { id:newId("a"), mode:"live", routineId:w.routineId||null, title:w.title, tag:w.tag||null, accent:w.accent||"amber",
    startedAt:Date.now(), notes:"", restEnd:null, restTotal:0, exercises };
}

/** ¿El entrenamiento cambió la estructura de su rutina (ejercicios, orden, nº de series, descanso)? */
export function sessionDiffersFromRoutine(session, routine){
  if(!routine) return false;
  const a = session.exercises, b = routine.ex;
  if(a.length !== b.length) return true;
  return a.some((e,i) => e.name !== b[i].name || e.sets.filter(isWorking).length !== b[i].sets || (e.rest ?? null) !== (b[i].rest ?? null));
}

export function routineFromSession(session, routine){
  return {
    ...routine,
    ex: session.exercises.map(e => {
      const prev = routine.ex.find(x => x.name === e.name);
      return {
        name: e.name, sets: e.sets.filter(isWorking).length || e.sets.length,
        lo: e.lo, hi: e.hi, start: prev?.start ?? e.start ?? 0, unit: e.unit, note: e.note || "",
        ...(e.rest != null ? { rest: e.rest } : {}),
      };
    }),
  };
}

/** Convierte la sesión en un entrenamiento guardado (sólo series marcadas). */
export function workoutFromSession(session){
  const exercises = session.exercises.map(e => ({
    name: normName(e.name), unit: e.unit,
    ...(e.userNote?.trim() ? { note: e.userNote.trim() } : {}),
    ...(e.rest != null ? { rest: e.rest } : {}),
    sets: e.sets.filter(s => s.done).map(s => {
      const w = parseNum(s.w), r = parseNum(s.r);
      return { w: e.unit==="bw" ? (w || null) : (w ?? 0), r: r ?? 0, type: s.type || "normal" };
    }),
  })).map((e, i) => {
    // Ejercicios del historial base que sólo tienen totales: se conservan al editar.
    const src = session.exercises[i];
    return !e.sets.length && src.agg && !src.sets.length ? { ...e, sets: [], agg: src.agg } : e;
  }).filter(e => e.sets.length || e.agg);
  const live = session.mode !== "edit";
  return {
    id: live ? newId("w") : session.workoutId,
    source: live ? "app" : (session.source || "app"),
    date: live ? localDate(new Date(session.startedAt)) : session.date,
    startedAt: session.startedAt ?? null,
    durationSec: live ? Math.floor((Date.now() - session.startedAt) / 1000) : (session.durationSec ?? null),
    title: session.title?.trim() || "Entrenamiento", tag: session.tag || null, accent: session.accent || "amber",
    routineId: session.routineId || null,
    ...(session.notes?.trim() ? { notes: session.notes.trim() } : {}),
    exercises,
  };
}

/** Guarda la sesión: agrega/reemplaza el entrenamiento, detecta récords y,
 * si se pidió, actualiza la rutina con los cambios hechos durante la sesión. */
export function commitSession(session, state, { updateRoutine = false } = {}){
  const workout = workoutFromSession(session);
  const others = state.workouts.filter(w => w.id !== workout.id);
  const previous = others.filter(w => w.date < workout.date || (w.date === workout.date && (w.startedAt||0) < (workout.startedAt||0)));
  workout.prs = detectPRs(previous, workout);
  const workouts = sortWorkouts([...others, workout]);

  let routines = state.routines;
  const routine = routines.find(r => r.id === session.routineId);
  if(updateRoutine && routine) routines = routines.map(r => r.id === routine.id ? routineFromSession(session, routine) : r);

  const ns = { ...state, workouts, routines };
  const stats = workoutStats(workout);
  const nextHints = session.mode === "edit" ? [] : session.exercises
    .filter(e => workout.exercises.some(x => x.name === normName(e.name)))
    .map(e => `${e.name}: ${suggestion(e, lastPerformance(workouts, normName(e.name)), state.customExercises).msg}`);
  const summary = { title: workout.title, tag: workout.tag, accent: workout.accent, date: workout.date, durationSec: workout.durationSec, ...stats, prs: workout.prs, nextHints, edited: session.mode === "edit" };
  return { state: ns, summary, workout };
}
