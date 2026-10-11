/* Fechas en hora LOCAL. Antes se usaba toISOString() (UTC), lo que en Chile
   movía al día siguiente cualquier entreno hecho después de las ~21:00. */

const pad = (n) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" en hora local. */
export function localDate(d = new Date()){
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

/** Date a medianoche local a partir de "YYYY-MM-DD". */
export function parseLocalDate(s){
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n){
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

/** Lunes (local) de la semana de `dateStr`. */
export function mondayOf(dateStr){
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return localDate(d);
}

const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "sáb 11 oct" (y el año si no es el actual). */
export function formatDay(dateStr){
  const d = parseLocalDate(dateStr);
  const base = `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function formatShort(dateStr){
  const d = parseLocalDate(dateStr);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}

/** 754 → "12:34"; 3754 → "1:02:34". */
export function formatClock(sec){
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 3720 → "1 h 2 min"; 540 → "9 min". */
export function formatDuration(sec){
  if (sec == null) return "";
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

/** 90 → "1:30"; 0 → "Apagado". */
export function formatRest(sec){
  if (!sec) return "Apagado";
  return `${Math.floor(sec / 60)}:${pad(sec % 60)}`;
}

/** Tiempos de descanso ofrecidos en los selectores (segundos; 0 = apagado). */
export const REST_OPTIONS = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 210, 240, 270, 300, 360, 420, 480, 540, 600];
