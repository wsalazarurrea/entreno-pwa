# Asistente de Entrenamiento — PWA

Vite + React. Registro de entrenamiento con progresión sugerida, historial (IndexedDB) y aviso de descanso en segundo plano vía Web Push (n8n + VAPID propio).

## Desarrollo

```
npm install
npm run dev
```

## Build / deploy

```
npm run build
```

Genera `dist/` con `sw.js`, `manifest.webmanifest`, `push-client.js` y los íconos servidos en la raíz. Listo para desplegar en Vercel (proyecto estático de Vite, sin configuración extra).

## Push en segundo plano (iPhone)

Ver `n8n-rest-timer.json` (workflow de n8n a importar) y `public/push-client.js` (`N8N_WEBHOOK` debe apuntar a la Production URL del webhook una vez activado el workflow).

Limitaciones de iOS: requiere instalar la PWA desde el ícono (Compartir → Agregar a inicio), no funciona desde una pestaña de Safari; precisión de ±unos segundos; requiere red al momento del disparo.
