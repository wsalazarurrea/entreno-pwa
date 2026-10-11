/* push-client.js — copia estática usada solo por public/test-push.html (harness de prueba).
   La app real usa la copia bundleada en src/push-client.js; si cambias algo aquí, replica
   el cambio también allá (public/ no pasa por el bundler de Vite). */

// Ruta del mismo dominio (https). Vercel la reenvía al webhook de n8n (ver vercel.json;
// en desarrollo, el proxy de vite.config.js). Llamar directo a http://… desde la app
// publicada en https lo bloquea el navegador por "contenido mixto".
const N8N_WEBHOOK = "/api/rest-timer";
const VAPID_PUBLIC = "BAhTAdSqrI77Q-lirqCCzBcu60cpxlwx1R2BbniB_I0qcoqkPYpia5CHeeoRrE0cU2kFcVsOiIZcKFwjVH9ngnY";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function initPush() {
  if (!("serviceWorker" in navigator)) throw new Error("SW no soportado");
  return navigator.serviceWorker.register("/sw.js");
}

// Debe llamarse desde un gesto del usuario (tap en un botón)
export async function subscribePush() {
  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permiso denegado");
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
    });
  }
  localStorage.setItem("pushSub", JSON.stringify(sub)); // solo la suscripción (no es secreta)
  return sub;
}

export function getSubscription() {
  const raw = localStorage.getItem("pushSub");
  return raw ? JSON.parse(raw) : null;
}

// Programa el aviso: n8n espera `seconds` y luego dispara el push.
// Devuelve true si n8n lo aceptó (sin suscripción, el timer local sigue funcionando igual).
export async function scheduleRest(seconds = 120, payload = { title: "Descanso terminado", body: "¡A la siguiente serie! 💪" }) {
  const subscription = getSubscription();
  if (!subscription) return false;
  try {
    const res = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // scheduledFor: el service worker lo usa para mostrar cuánto se adelantó o atrasó el aviso.
      body: JSON.stringify({ seconds, subscription, payload: { ...payload, scheduledFor: Date.now() + seconds * 1000 } })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return true;
  } catch (e) { console.warn("No se pudo programar el push:", e); return false; }
}
