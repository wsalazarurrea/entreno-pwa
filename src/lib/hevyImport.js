/* Importa el CSV que exporta Hevy (Ajustes → Exportar y descargar datos →
   Exportar entrenamientos). Columnas esperadas:
   title, start_time, end_time, description, exercise_title, superset_id,
   exercise_notes, set_index, set_type, weight_kg | weight_lbs, reps, ... */

import { localDate } from "./dates.js";
import { normName, sortWorkouts } from "./workouts.js";

function parseCSV(text){
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const MONTHS = { jan:0, ene:0, feb:1, mar:2, apr:3, abr:3, may:4, jun:5, jul:6, aug:7, ago:7, sep:8, set:8, oct:9, nov:10, dec:11, dic:11 };

/** "6 Jul 2025, 18:21" (también meses en español o ISO) → Date local. */
function parseHevyDate(s){
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-zé]+)\.?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon != null) return new Date(+m[3], mon, +m[1], +m[4], +m[5]);
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

const SET_TYPE = { normal: "normal", warmup: "warmup", dropset: "drop", drop: "drop", failure: "failure" };

/** Devuelve { workouts, exercises } o lanza un Error con un mensaje legible. */
export function parseHevyCSV(text){
  const rows = parseCSV(text.replace(/^﻿/, ""));
  if (rows.length < 2) throw new Error("El archivo está vacío.");
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = (n) => head.indexOf(n);
  const iTitle = col("title"), iStart = col("start_time"), iEnd = col("end_time"), iDesc = col("description");
  const iEx = col("exercise_title"), iNotes = col("exercise_notes"), iType = col("set_type"), iReps = col("reps");
  let iW = col("weight_kg"), lbs = false;
  if (iW < 0) { iW = col("weight_lbs"); lbs = iW >= 0; }
  if (iStart < 0 || iEx < 0 || iReps < 0) throw new Error("No parece un CSV de entrenamientos de Hevy (faltan columnas start_time / exercise_title / reps).");

  const byKey = new Map();
  for (const r of rows.slice(1)) {
    const start = parseHevyDate(r[iStart]);
    const exName = normName(r[iEx]);
    if (!start || !exName) continue;
    const key = `${r[iTitle]}|${r[iStart]}`;
    if (!byKey.has(key)) {
      const end = parseHevyDate(r[iEnd]);
      byKey.set(key, {
        id: `hevy-${start.getTime()}`, source: "hevy", date: localDate(start), startedAt: start.getTime(),
        durationSec: end ? Math.max(0, Math.round((end - start) / 1000)) : null,
        title: normName(r[iTitle]) || "Entrenamiento", tag: null, accent: "violet",
        ...(iDesc >= 0 && r[iDesc]?.trim() ? { notes: r[iDesc].trim() } : {}),
        exercises: [], _ex: new Map(),
      });
    }
    const w = byKey.get(key);
    if (!w._ex.has(exName)) {
      const ex = { name: exName, unit: "kg", sets: [], ...(iNotes >= 0 && r[iNotes]?.trim() ? { note: r[iNotes].trim() } : {}) };
      w._ex.set(exName, ex); w.exercises.push(ex);
    }
    const rawW = iW >= 0 && r[iW] !== "" ? parseFloat(r[iW]) : null;
    const weight = rawW == null || isNaN(rawW) ? null : +(lbs ? rawW * 0.453592 : rawW).toFixed(1);
    const reps = parseInt(r[iReps], 10);
    w._ex.get(exName).sets.push({ w: weight, r: isNaN(reps) ? null : reps, type: SET_TYPE[(r[iType] || "").toLowerCase()] || "normal" });
  }

  const workouts = [...byKey.values()].map(({ _ex, ...w }) => {
    w.exercises.forEach(ex => {
      if (ex.sets.every(s => s.w == null)) ex.unit = "bw";
      else if (/\(Mancuerna\)/i.test(ex.name)) ex.unit = "kg/mano";
    });
    return w;
  });
  if (!workouts.length) throw new Error("No se encontraron entrenamientos en el archivo.");
  return sortWorkouts(workouts);
}

/** Combina lo importado con el estado: reemplaza el historial base agregado
 * (hevy-seed) y entrenamientos de Hevy importados antes; conserva lo hecho en la app. */
export function mergeHevyImport(state, imported){
  const kept = state.workouts.filter(w => w.source === "app");
  return { ...state, workouts: sortWorkouts([...kept, ...imported]) };
}
