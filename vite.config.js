import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'node:child_process'

// Identifica el build (commit + fecha) para poder reconocer en el teléfono
// qué versión está instalada. Vercel expone el commit por variable de entorno;
// en local se lee de git. "+cambios" = compilado con cambios sin commitear.
function git(cmd){ try{ return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }catch{ return ''; } }
const commit = (process.env.VERCEL_GIT_COMMIT_SHA || git('rev-parse HEAD')).slice(0, 7) || 'desconocido';
const dirty = !process.env.VERCEL_GIT_COMMIT_SHA && git('status --porcelain') !== '';
const subject = process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] || git('log -1 --format=%s');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify({ commit, dirty, subject, builtAt: new Date().toISOString() }),
  },
})
