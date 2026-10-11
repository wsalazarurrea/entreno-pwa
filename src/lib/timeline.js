import { localDate, mondayOf, addDays } from "./dates.js";
import { workoutStats } from "./workouts.js";

/** Semanas consecutivas con al menos un entrenamiento, contadas hacia atrás
 * desde la semana más reciente con actividad (no exige que la semana
 * calendario actual ya tenga una sesión registrada). */
export function computeWeekStreak(workouts){
  if (!workouts.length) return 0;
  const weeks = [...new Set(workouts.map(w => mondayOf(w.date)))].sort().reverse();
  let streak = 1;
  let cursor = weeks[0];
  for (let i = 1; i < weeks.length; i++) {
    cursor = addDays(cursor, -7);
    if (cursor === weeks[i]) streak++;
    else break;
  }
  return streak;
}

export function currentWeekStats(workouts){
  const thisMonday = mondayOf(localDate());
  const week = workouts.filter(w => mondayOf(w.date) === thisMonday);
  return { count: week.length, volume: week.reduce((a, w) => a + workoutStats(w).volume, 0) };
}

/** Set de fechas ("YYYY-MM-DD") entrenadas, para pintar el calendario de racha. */
export function trainedDateSet(workouts){
  return new Set(workouts.map(w => w.date));
}
