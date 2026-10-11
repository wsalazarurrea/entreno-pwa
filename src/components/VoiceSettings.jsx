import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { voiceConfig, cheer } from "../lib/voice.js";
import { sampleClips } from "../lib/voicepack.js";
import { playClips } from "../lib/clips.js";
import { speak, unlockSound, cue, spanishLanguages } from "../lib/sound.js";
import { cx } from "../lib/cx.js";

const LANG_NAME = { "es-ES": "España", "es-MX": "México", "es-US": "EE. UU.", "es-AR": "Argentina", "es-CL": "Chile", "es-CO": "Colombia" };

function Toggle({ label, hint, checked, onChange }){
  return (
    <label className="flex items-start justify-between gap-3 py-1.5 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-[14.5px] text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-faint">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-1 w-5 h-5 shrink-0 accent-[#ef6c2e]" />
    </label>
  );
}

function Segmented({ label, value, options, onChange }){
  return (
    <div className="py-1.5">
      <div className="text-[14.5px] text-ink mb-1.5">{label}</div>
      <div className="flex bg-panel2 rounded-xl p-1">
        {options.map(([v, l]) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            className={cx("flex-1 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer", value === v ? "bg-amber text-white shadow-sm" : "text-mut")}>{l}</button>
        ))}
      </div>
    </div>
  );
}

/** Configuración de voz y pitidos del temporizador (se guarda en state.voice). */
export function VoiceSettings({ voice, onChange }){
  const cfg = voiceConfig(voice);
  const set = (patch) => onChange({ ...cfg, ...patch });
  const [langs, setLangs] = useState([cfg.lang]);
  useEffect(() => { spanishLanguages().then(l => setLangs(l.includes(cfg.lang) ? l : [cfg.lang, ...l])); }, [cfg.lang]);
  const toggleWarning = (sec, on) => set({ warnings: on ? [...new Set([...cfg.warnings, sec])].sort((a, b) => b - a) : cfg.warnings.filter(w => w !== sec) });
  const harry = cfg.engine === "harry";
  const test = () => {
    unlockSound();
    if (harry) { if (cfg.beeps) cue("go"); if (cfg.enabled) setTimeout(() => playClips(sampleClips(cfg), { volume: cfg.volume }), 450); return; }
    if (cfg.beeps) cue("go");
    if (cfg.enabled) setTimeout(() => speak(["Trabajo. Ronda 1 de 8.", cheer(cfg, "work"), "Quedan 30 segundos.", cheer(cfg, "push"), "3, 2, 1"].filter(Boolean).join(" "), cfg), 450);
  };

  return (
    <div className="flex flex-col divide-y divide-line">
      <div className="pb-2">
        <Segmented label="Voz" value={cfg.engine} onChange={v => set({ engine: v })}
          options={[["harry", "Harry · inglés 🎙️"], ["system", "Del sistema · español"]]} />
        <div className="text-[12px] text-faint mb-1">{harry ? "Voz humana grabada (ElevenLabs). Funciona sin internet." : "Voz sintética del teléfono, en español."}</div>
        <Toggle label="Voz" hint="Anuncia fases, rondas y tiempos en voz alta." checked={cfg.enabled} onChange={v => set({ enabled: v })} />
        <Toggle label="Pitidos" checked={cfg.beeps} onChange={v => set({ beeps: v })} />
      </div>

      <div className="py-2">
        <Segmented label="Estilo de la voz" value={cfg.style} onChange={v => set({ style: v })}
          options={harry ? [["neutro", "Sin frases"], ["chileno", "Motivador"], ["garabatos", "Con garabatos 🤬"]] : [["neutro", "Neutro"], ["chileno", "Chileno 🇨🇱"], ["garabatos", "Con garabatos 🤬"]]} />
        <div className="text-[12px] text-faint">{harry
          ? (cfg.style === "garabatos" ? "«Let's fucking go!», «Don't you fucking quit!», «Hell yeah, you're a fucking beast!»" : cfg.style === "chileno" ? "«Let's go!», «Push it!», «Don't quit now!», «You're a beast!»" : "Sólo anuncia fases y tiempos.")
          : (cfg.style === "garabatos" ? "«¡Vamos, mierda!», «¡Tú puedes, concha de tu madre!», «¡Aguanta, conchetumare!»" : cfg.style === "chileno" ? "«¡Dale po!», «¡No aflojí!», «¡La raja!», «¡Saca la garra!»" : "Sólo anuncia fases y tiempos.")}</div>
      </div>

      <div className="py-2">
        <Segmented label="Cuenta regresiva al final de cada fase" value={cfg.countdown} onChange={v => set({ countdown: v })}
          options={[["voz", "Voz"], ["pitidos", "Pitidos"], ["ambos", "Ambos"], ["no", "No"]]} />
        {cfg.countdown !== "no" && (
          <Segmented label="Contar desde" value={cfg.countdownFrom} onChange={v => set({ countdownFrom: v })}
            options={[[3, "3 s"], [5, "5 s"], [10, "10 s"]]} />
        )}
      </div>

      <div className="py-2">
        <Toggle label="Anunciar cada fase" hint="«Trabajo», «Descanso», «Por tiempo. ¡Vamos!»" checked={cfg.phaseNames} onChange={v => set({ phaseNames: v })} />
        <Toggle label="Decir la ronda" hint="«Ronda 3 de 8»" checked={cfg.rounds} onChange={v => set({ rounds: v })} />
        <Toggle label="Avisar la mitad" hint="«Mitad» en fases de 30 s o más" checked={cfg.halfway} onChange={v => set({ halfway: v })} />
      </div>

      <div className="py-2">
        <div className="text-[14.5px] text-ink mb-1.5">Avisos antes de terminar cada fase</div>
        <div className="flex gap-2 flex-wrap">
          {[[60, "1 min"], [30, "30 s"], [10, "10 s"]].map(([sec, l]) => {
            const on = cfg.warnings.includes(sec);
            return (
              <button key={sec} type="button" onClick={() => toggleWarning(sec, !on)}
                className={cx("px-3.5 py-1.5 rounded-full text-[13px] font-semibold border cursor-pointer", on ? "bg-amber text-white border-amber" : "bg-panel text-mut border-line")}>{l}</button>
            );
          })}
        </div>
        <Segmented label="En AMRAP, por tiempo y fases largas, decir el tiempo" value={cfg.every} onChange={v => set({ every: v })}
          options={[[60, "Cada 1 min"], [120, "2 min"], [300, "5 min"], [0, "Nunca"]]} />
        <div className="text-[12px] text-faint">Por tiempo: «Van 5 minutos». AMRAP: «Quedan 10 minutos».</div>
      </div>

      <div className="pt-2 flex flex-col gap-2.5">
        {!harry && <div>
          <div className="text-[14.5px] text-ink mb-1.5">Voz en español de</div>
          <select value={cfg.lang} onChange={e => set({ lang: e.target.value })}
            className="w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber">
            {langs.map(l => <option key={l} value={l}>{LANG_NAME[l] ? `${LANG_NAME[l]} (${l})` : l}</option>)}
          </select>
        </div>}
        {!harry && <label className="block">
          <span className="flex justify-between text-[14.5px] text-ink"><span>Velocidad</span><span className="font-mono text-mut">{cfg.rate.toFixed(1)}×</span></span>
          <input type="range" min="0.6" max="1.6" step="0.1" value={cfg.rate} onChange={e => set({ rate: Number(e.target.value) })} className="w-full accent-[#ef6c2e]" />
        </label>}
        <label className="block">
          <span className="flex justify-between text-[14.5px] text-ink"><span>Volumen de la voz</span><span className="font-mono text-mut">{Math.round(cfg.volume * 100)}%</span></span>
          <input type="range" min="0.2" max="1" step="0.1" value={cfg.volume} onChange={e => set({ volume: Number(e.target.value) })} className="w-full accent-[#ef6c2e]" />
        </label>
        <button type="button" onClick={test}
          className="w-full py-3 flex items-center justify-center gap-2 border border-line rounded-xl text-[14px] font-semibold text-ink cursor-pointer bg-panel"><Volume2 size={16} /> Probar voz</button>
      </div>
    </div>
  );
}
