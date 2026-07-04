/* push-client.js — copia bundleable para la app (importada por src/App.jsx).
   Existe una copia gemela en public/push-client.js para el harness estático
   (public/test-push.html), porque los archivos en public/ no pasan por el
   bundler de Vite y no pueden importarse desde el código de la app.
   Si cambias este archivo, replica el cambio también en public/push-client.js. */

// ⬇️ Pon aquí la Production URL de tu webhook de n8n (paso 4 del README)
const N8N_WEBHOOK = "http://129.121.58.135/webhook/rest-timer";
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

// Programa el aviso: n8n espera `seconds` y luego dispara el push
export async function scheduleRest(seconds = 120) {
  const subscription = getSubscription();
  if (!subscription) return; // sin suscripción, el timer local sigue funcionando igual
  try {
    await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seconds,
        subscription,
        payload: { title: "Descanso terminado", body: "¡A la siguiente serie! 💪" }
      })
    });
  } catch (e) { console.warn("No se pudo programar el push:", e); }
}
