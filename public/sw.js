/* Service Worker — Asistente de Entrenamiento
   Su único trabajo relevante: recibir el push del servidor y mostrar la notificación,
   incluso con la app cerrada o el teléfono bloqueado. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* Lee el entrenamiento en curso que la app guarda en IndexedDB (src/lib/storage.js). */
function readActive(){
  return new Promise((resolve) => {
    let req;
    try { req = indexedDB.open("training-assistant", 1); } catch { return resolve(null); }
    req.onupgradeneeded = () => req.result.createObjectStore("kv"); // misma estructura que storage.js
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      try {
        const g = req.result.transaction("kv", "readonly").objectStore("kv").get("pt_active_v1");
        g.onsuccess = () => { try { resolve(g.result ? JSON.parse(g.result) : null); } catch { resolve(null); } };
        g.onerror = () => resolve(null);
      } catch { resolve(null); }
    };
  });
}

/* ¿El aviso corresponde al descanso vigente? No, si mientras tanto lo cambiaste (±15) u omitiste. */
async function isCurrentRest(scheduledFor){
  const a = await readActive();
  if (!a) return false;
  const near = (t) => t != null && Math.abs(t - scheduledFor) <= 2000;
  if (near(a.restEnd)) return true;
  return !a.restEnd && !a.prevRestSkipped && near(a.prevRestEnd);
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let data = { title: "Descanso terminado", body: "¡A la siguiente serie! 💪" };
    try { if (event.data) data = Object.assign(data, event.data.json()); } catch { /* payload no JSON */ }
    let tag = "rest-timer";
    if (data.test && data.scheduledFor) {
      const hhmmss = (t) => new Date(t).toLocaleTimeString("es-CL", { hour12: false });
      const diff = Math.round((Date.now() - data.scheduledFor) / 1000);
      data.body = `Debía llegar ${hhmmss(data.scheduledFor)} · llegó ${hhmmss(Date.now())} (${diff >= 0 ? "+" : ""}${diff} s)`;
    } else if (data.scheduledFor && !(await isCurrentRest(data.scheduledFor))) {
      // Aviso de un descanso que ya cambiaste u omitiste. iOS exige mostrar algo por cada push
      // (si no, puede revocar los avisos), así que se muestra uno neutro en vez de "Descanso terminado".
      data.title = "Entrenamiento en curso";
      data.body = "Toca para volver a tu entrenamiento.";
      tag = "workout";
    }
    await self.registration.showNotification(data.title, {
      body: data.body,
      tag,
      renotify: true,
      vibrate: [200, 100, 200],   // Android; iOS lo ignora pero no molesta
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: "/" }
    });
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cl) => {
      for (const c of cl) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
