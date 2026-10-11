/* Integraciones de la app nativa de iPhone (Capacitor). En la PWA (navegador)
   isNative es false y estas funciones no hacen nada: ahí siguen el push por
   n8n (push-client.js) y el respaldo por descarga. */

import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { App as CapApp } from "@capacitor/app";
import { AppLauncher } from "@capacitor/app-launcher";
import { HealthWorkout } from "health-workout";

export const isNative = Capacitor.isNativePlatform();

const REST_ID = 1001;
const TEST_ID = 1002;
const hhmmss = (t) => new Date(t).toLocaleTimeString("es-CL", { hour12: false });

export async function initNative(){
  if (!isNative) return;
  document.documentElement.classList.add("native");
  try { await StatusBar.setStyle({ style: Style.Light }); } catch { /* opcional */ }
}

/* ---------- Avisos de descanso (locales, generados en el propio iPhone) ---------- */

export async function notificationPermission(){
  if (!isNative) return "n/a";
  return (await LocalNotifications.checkPermissions()).display;
}

export async function ensureNotificationPermission(){
  if (!isNative) return false;
  let p = await LocalNotifications.checkPermissions();
  if (p.display !== "granted" && p.display !== "denied") p = await LocalNotifications.requestPermissions();
  return p.display === "granted";
}

/** Deja programado exactamente un aviso para el descanso en curso (o ninguno si restEnd es null).
 * Se llama en cada cambio de restEnd, así que −15 / +15 / Omitir quedan reflejados al instante. */
export async function syncRestNotification(restEnd, label){
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] });
    if (!restEnd || restEnd - Date.now() < 1500) return;
    if (!(await ensureNotificationPermission())) return;
    await LocalNotifications.schedule({ notifications: [{
      id: REST_ID,
      title: "Descanso terminado",
      body: [label, `Programado para ${hhmmss(restEnd)}`].filter(Boolean).join("\n"),
      schedule: { at: new Date(restEnd), allowWhileIdle: true },
    }] });
  } catch (e) { console.warn("Aviso de descanso:", e); }
}

export async function testNotification(seconds){
  if (!(await ensureNotificationPermission())) return false;
  const at = Date.now() + seconds * 1000;
  await LocalNotifications.schedule({ notifications: [{
    id: TEST_ID, title: "Prueba de aviso", body: `Programado para ${hhmmss(at)}`, schedule: { at: new Date(at) },
  }] });
  return true;
}

/* ---------- Apple Salud ---------- */

export async function healthAvailable(){
  if (!isNative) return false;
  try { return (await HealthWorkout.isAvailable()).available; } catch { return false; }
}

/** Pide permiso para escribir entrenamientos. Devuelve true si quedó autorizado. */
export async function healthConnect(){
  const r = await HealthWorkout.requestAuthorization();
  return !!r.workouts;
}

/** Calorías activas estimadas: pesas a esfuerzo moderado ≈ 3,5 MET (Compendio de Actividades Físicas). */
export function estimateKcal(durationSec, bodyKg){
  if (!bodyKg || !durationSec) return null;
  return Math.round(3.5 * bodyKg * (durationSec / 3600));
}

/** Guarda un entrenamiento en Salud como "Fuerza tradicional". Devuelve el UUID de Salud. */
export async function saveWorkoutToHealth(w, bodyKg){
  await HealthWorkout.requestAuthorization(); // no vuelve a preguntar si ya respondiste
  const dur = w.durationSec || 3600;
  const start = w.startedAt ?? new Date(`${w.date}T18:00:00`).getTime(); // los importados sin hora: 18:00
  const kcal = estimateKcal(dur, bodyKg);
  const r = await HealthWorkout.saveWorkout({ start, end: start + dur * 1000, id: w.id, ...(kcal ? { energyKcal: kcal } : {}) });
  return r.uuid;
}

/* ---------- Apple Salud vía Atajos (instalación gratuita) ----------
   Con firma gratuita (SideStore/iLoader) la app no tiene permiso de HealthKit, pero la app
   Atajos sí. La app abre el atajo del usuario pasándole los minutos del entrenamiento; el
   atajo (2 acciones) resta esos minutos a la hora actual y registra "Entrenamiento
   tradicional de fuerza". Al terminar, Atajos vuelve a Entreno por entreno://salud?... */

export const DEFAULT_SHORTCUT = "Entreno a Salud";

export function workoutMinutes(w){
  return Math.max(1, Math.round((w.durationSec || 3600) / 60));
}

export async function sendWorkoutViaShortcut(w, name = DEFAULT_SHORTCUT){
  const back = (k) => encodeURIComponent(`entreno://salud?${k}=1&id=${encodeURIComponent(w.id)}`);
  const url = `shortcuts://x-callback-url/run-shortcut?name=${encodeURIComponent(name || DEFAULT_SHORTCUT)}`
    + `&input=text&text=${workoutMinutes(w)}`
    + `&x-success=${back("ok")}&x-error=${back("error")}&x-cancel=${back("cancel")}`;
  await AppLauncher.openUrl({ url });
}

/** Escucha la vuelta desde Atajos. fn({ id, status: "ok" | "error" | "cancel" }). Devuelve la función para dejar de escuchar. */
export function onShortcutReturn(fn){
  if (!isNative) return () => {};
  const handle = CapApp.addListener("appUrlOpen", ({ url }) => {
    if (!url?.startsWith("entreno://salud")) return;
    const q = new URL(url.replace("entreno://", "https://entreno/")).searchParams;
    fn({ id: q.get("id"), status: q.has("ok") ? "ok" : q.has("cancel") ? "cancel" : "error" });
  });
  return () => { handle.then(h => h.remove()); };
}

/* ---------- Respaldo ---------- */

/** Escribe el respaldo en un archivo temporal y abre la hoja de compartir de iOS. */
export async function shareBackupNative(filename, text){
  const { uri } = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: filename, files: [uri] });
}
