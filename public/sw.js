/* Service Worker — Asistente de Entrenamiento
   Su único trabajo relevante: recibir el push del servidor y mostrar la notificación,
   incluso con la app cerrada o el teléfono bloqueado. */

self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = { title: "Descanso terminado", body: "¡A la siguiente serie! 💪" };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch { /* payload no JSON */ }
  if (data.test && data.scheduledFor) {
    const hhmmss = (t) => new Date(t).toLocaleTimeString("es-CL", { hour12: false });
    const diff = Math.round((Date.now() - data.scheduledFor) / 1000);
    data.body = `Debía llegar ${hhmmss(data.scheduledFor)} · llegó ${hhmmss(Date.now())} (${diff >= 0 ? "+" : ""}${diff} s)`;
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: "rest-timer",
      renotify: true,
      vibrate: [200, 100, 200],   // Android; iOS lo ignora pero no molesta
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: "/" }
    })
  );
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
