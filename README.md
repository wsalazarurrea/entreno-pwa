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

Ver `n8n-rest-timer.json` (workflow de n8n a importar). La app llama a `/api/rest-timer` en su propio dominio y Vercel lo reenvía al webhook de n8n (`vercel.json`; en desarrollo, el proxy de `vite.config.js`). No llamar al webhook por `http://` directo desde la app: el navegador lo bloquea por contenido mixto.

Limitaciones de iOS: requiere instalar la PWA desde el ícono (Compartir → Agregar a inicio), no funciona desde una pestaña de Safari; precisión de ±unos segundos; requiere red al momento del disparo.

## App de iPhone (Capacitor, sin cuenta de Apple pagada)

La misma app web empaquetada como app nativa (`ios/`, Capacitor 8 con Swift Package Manager). En nativo:
avisos de descanso **locales** (se reprograman con −15/+15/Omitir, sin n8n) y registro de cada entrenamiento
en **Apple Salud / Fitness** como "Fuerza tradicional" (plugin propio en `native/health-workout`).

- **Compilar:** cada push a `master` dispara `.github/workflows/ios.yml` (macOS de GitHub). Publica
  `Entreno.ipa` en la release `ios-latest`: `https://github.com/wsalazarurrea/entreno-pwa/releases/download/ios-latest/Entreno.ipa`.
  El IPA va con firma ad-hoc sólo para llevar el entitlement de HealthKit.
- **Instalar:** con [SideStore](https://docs.sidestore.io) (iLoader en Windows + LocalDevVPN en el iPhone) y un Apple ID
  gratuito: en SideStore → My Apps → `+` → elegir `Entreno.ipa`. La firma gratuita dura 7 días; SideStore la renueva
  desde el iPhone (con LocalDevVPN conectado). Los datos de la app se conservan al renovar.
- **Pasar los datos desde la PWA:** en la web, Ajustes → Exportar respaldo; en la app, Ajustes → Restaurar respaldo.
- **Icono:** `design/icon.svg` → `node scripts/render-icons.cjs` (requiere `playwright-core` y Edge/Chrome).
- Tras cambiar dependencias de Capacitor: `npm run build && npx cap sync ios`.
