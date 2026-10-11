/* Genera los audios del paquete de voz (src/data/voiceHarry.js) con ElevenLabs.
   Uso:
     ELEVENLABS_API_KEY=sk_... node scripts/generate-voice.cjs [--key-file ruta] [--only clave1,clave2] [--force]
   - Sólo genera los que falten en public/voice/harry (salvo --force): no gasta créditos dos veces.
   - La clave nunca se guarda en el repositorio. */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const KEY = (process.env.ELEVENLABS_API_KEY || (opt("--key-file") ? fs.readFileSync(opt("--key-file"), "utf8") : "")).trim();
if (!KEY) { console.error("Falta la clave: ELEVENLABS_API_KEY o --key-file"); process.exit(1); }
const only = opt("--only")?.split(",").map(s => s.trim()).filter(Boolean);
const force = args.includes("--force");

(async () => {
  const { PHRASES, VOICE_HARRY: V } = await import(path.join(__dirname, "..", "src", "data", "voiceHarry.js").replace(/\\/g, "/").replace(/^([A-Za-z]):/, "file:///$1:"));
  const outDir = path.join(__dirname, "..", "public", V.dir);
  fs.mkdirSync(outDir, { recursive: true });
  const todo = Object.entries(PHRASES).filter(([k]) => (!only || only.includes(k)) && (force || !fs.existsSync(path.join(outDir, `${k}.mp3`))));
  console.log(`${todo.length} audios por generar con ${V.name} (${V.model})`);
  let credits = 0, done = 0, failed = [];
  for (const [key, text] of todo) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${V.id}?output_format=mp3_44100_64`, {
        method: "POST",
        headers: { "xi-api-key": KEY, "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ text, model_id: V.model, language_code: V.lang, voice_settings: { stability: 0.4, similarity_boost: 0.8 } }),
      });
      const buf = Buffer.from(await res.arrayBuffer());
      if (res.ok) {
        fs.writeFileSync(path.join(outDir, `${key}.mp3`), buf);
        credits += Number(res.headers.get("character-cost") || 0); done++;
        // A 64 kbps, ~8 KB por segundo: sirve para detectar audios con "relleno" inventado.
        console.log(`✓ ${key.padEnd(26)} ${(buf.length / 8000).toFixed(1)} s  «${text}»`);
        break;
      }
      const msg = buf.toString("utf8").slice(0, 200);
      if (res.status === 429 && attempt < 3) { await new Promise(r => setTimeout(r, 3000 * attempt)); continue; }
      console.log(`✗ ${key}: HTTP ${res.status} ${msg}`); failed.push(key);
      if (res.status === 401 || res.status === 402 || /quota|credits/i.test(msg)) { console.log("Se detiene: sin créditos o sin permiso."); attempt = 99; }
      break;
    }
    if (failed.length && /quota|credits|401|402/.test(failed.join())) break;
  }
  console.log(`\nGenerados: ${done} · créditos usados: ${credits}${failed.length ? ` · fallidos: ${failed.join(", ")}` : ""}`);
})();
