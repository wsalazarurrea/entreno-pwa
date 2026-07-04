/** Reconstruye una línea de tiempo única de días de entreno, combinando el
 * historial importado de Hevy (agregado por ejercicio) con las sesiones
 * registradas dentro de la app — ambos viven en state.history, agrupado por
 * fecha. Esto es lo que hace visibles las "rutinas pasadas". */
export function buildTimeline(state){
  const routines = state.routines || [];
  const routineByTag = new Map(routines.map(r => [r.tag, r]));

  const matchRoutine = (exerciseNames) => {
    let best = null, bestScore = 0;
    routines.forEach(r => {
      const routineNames = new Set(r.ex.map(e => e.name));
      if (!routineNames.size) return;
      const overlap = exerciseNames.filter(n => routineNames.has(n)).length;
      const score = overlap / Math.max(routineNames.size, exerciseNames.length);
      if (score > bestScore) { bestScore = score; best = r; }
    });
    return bestScore >= 0.4 ? best : null;
  };

  const byDate = new Map();
  Object.entries(state.history || {}).forEach(([name, entries]) => {
    (entries || []).forEach(entry => {
      if (!byDate.has(entry.d)) byDate.set(entry.d, []);
      const detail = { name, e1rm: entry.e1rm, topWeight: entry.tw, volume: entry.vol || 0 };
      const lp = state.lastperf[name];
      if (lp && lp.date === entry.d) detail.sets = lp.sets;
      byDate.get(entry.d).push(detail);
    });
  });

  const sessionsByDate = new Map((state.sessions || []).map(s => [s.date, s]));

  const days = [...byDate.entries()].map(([date, exercises]) => {
    const volume = exercises.reduce((a, e) => a + e.volume, 0);
    const app = sessionsByDate.get(date);
    const routine = app ? routineByTag.get(app.tag) : matchRoutine(exercises.map(e => e.name));
    return {
      date,
      exercises: [...exercises].sort((a, b) => b.volume - a.volume),
      volume,
      source: app ? "app" : "hevy",
      tag: app?.tag ?? routine?.tag ?? null,
      title: app?.title ?? routine?.title ?? null,
      accent: routine?.accent ?? "violet",
      durationSec: app?.durationSec ?? null,
      totalSets: app?.totalSets ?? null,
      prs: app?.prs ?? 0,
    };
  });

  return days.sort((a, b) => b.date.localeCompare(a.date));
}

function mondayOf(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

/** Semanas consecutivas con al menos una sesión, contadas hacia atrás desde
 * la semana más reciente con actividad (no exige que la semana calendario
 * actual ya tenga una sesión registrada). */
export function computeWeekStreak(days){
  if (!days.length) return 0;
  const trainedWeeks = [...new Set(days.map(d => mondayOf(d.date)))].sort().reverse();
  let streak = 1;
  const cursor = new Date(trainedWeeks[0] + "T00:00:00");
  for (let i = 1; i < trainedWeeks.length; i++) {
    cursor.setDate(cursor.getDate() - 7);
    if (cursor.toISOString().slice(0, 10) === trainedWeeks[i]) streak++;
    else break;
  }
  return streak;
}

export function currentWeekVolume(days){
  const thisMonday = mondayOf(new Date().toISOString().slice(0, 10));
  return days.filter(d => mondayOf(d.date) === thisMonday).reduce((a, d) => a + d.volume, 0);
}

/** Set de fechas ("YYYY-MM-DD") entrenadas, para pintar el calendario de racha. */
export function trainedDateSet(days){
  return new Set(days.map(d => d.date));
}
