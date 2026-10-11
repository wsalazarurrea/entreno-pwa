import { useEffect, useMemo, useRef, useState } from "react";
import { X, Pause, Play, SkipForward, SkipBack, Volume2, VolumeX, Flag, Plus, Minus, Settings2 } from "lucide-react";
import { buildPhases, totalSec, runStatus, pauseRun, resumeRun, skipPhase, backPhase, finishRun, wodResult, resultLabel, fmtSec } from "../lib/intervals.js";
import { cue, speak, resumeSound, unlockSound, stopSpeaking } from "../lib/sound.js";
import { cueFor, voiceConfig, finishSpeech, roundSpeech } from "../lib/voice.js";
import { keepScreenOn } from "../lib/native.js";
import { clipsFor, finishClips, roundClips, preloadKeys } from "../lib/voicepack.js";
import { playClips, preloadClips, stopClips } from "../lib/clips.js";
import { ConfirmDialog, Sheet } from "./ui/Sheet.jsx";
import { VoiceSettings } from "./VoiceSettings.jsx";

const BG = { work: "#ff5a1f", rest: "#0fbf9f", warmup: "#f5a400", cooldown: "#7b4dff" };

/** Descripción del WOD (movimientos y notas) sobre el fondo de color. */
function WodCard({ timer, compact }){
  if (!timer.workout?.length && !timer.notes) return null;
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl bg-black/15 px-4 py-3 text-left">
      {timer.workout?.map((l, i) => <div key={i} className={compact ? "text-[13.5px] leading-snug" : "text-[15px] leading-snug"}>{l}</div>)}
      {timer.notes && <div className="text-[12.5px] text-white/75 mt-1.5">{timer.notes}</div>}
    </div>
  );
}

/** Pantalla de ejecución del temporizador / WOD. `run` vive en App (persistido); los cambios suben por onChange. */
export function IntervalRunner({ run, onChange, onFinish, onStop, voice, onVoiceChange }){
  const t = run.timer;
  const phases = useMemo(() => buildPhases(t), [t]);
  const total = totalSec(phases);
  const [now, setNow] = useState(Date.now());
  const [muted, setMuted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [settings, setSettings] = useState(false);
  const cfg = voiceConfig(voice);
  const harry = cfg.engine === "harry";
  const say = (keysOrText) => {
    if (harry) playClips(keysOrText, { volume: cfg.volume });
    else speak(keysOrText, cfg);
  };
  const cueRef = useRef({ index: -1, second: null, done: false });
  const wakeRef = useRef(null);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(i); }, []);
  useEffect(() => {
    const acquire = async () => { try { if ("wakeLock" in navigator) wakeRef.current = await navigator.wakeLock.request("screen"); } catch { /* opcional */ } };
    acquire();
    keepScreenOn(true);
    if (voiceConfig(voice).engine === "harry") preloadClips(preloadKeys(buildPhases(run.timer), voice));
    const onVis = () => { if (document.visibilityState === "visible") { acquire(); resumeSound(); setNow(Date.now()); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); keepScreenOn(false); stopSpeaking(); stopClips(); try { wakeRef.current?.release(); } catch { /* */ } };
    // Sólo al abrir el temporizador (precarga con la configuración de ese momento).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cur = runStatus(run, phases, now);
  const paused = !!run.pausedAt;
  const remaining = Math.ceil(cur.remainingMs / 1000);
  const next = phases[cur.index + 1];
  const phase = cur.phase;
  const open = !!phase?.open;                         // AMRAP o por tiempo
  const countUp = open && t.mode === "fortime";
  const shown = countUp ? Math.floor(cur.elapsedInPhaseMs / 1000) : remaining;

  // Voz y pitidos: una vez por segundo se decide qué anunciar (ver lib/voice.js).
  useEffect(() => {
    const c = cueRef.current;
    if (cur.done) {
      if (!c.done) {
        c.done = true;
        if (!muted) {
          if (cfg.beeps) cue("end");
          const said = harry ? finishClips(cfg) : finishSpeech(cfg, t.mode, wodResult(run, phases));
          if (cfg.enabled) setTimeout(() => say(said), 900);
        }
        onFinish();
      }
      return;
    }
    if (paused) return;
    const started = cur.index !== c.index;
    const second = `${cur.index}:${remaining}`;
    if (!started && c.second === second) return;
    const restored = c.index === -1 && cur.elapsedInPhaseMs > 1500; // volviste a la app a mitad de fase
    c.index = cur.index; c.second = second;
    if (muted || restored) return;
    const out = cueFor({ phase, remaining, elapsed: Math.floor(cur.elapsedInPhaseMs / 1000), started, mode: t.mode, rounds: t.rounds }, cfg);
    if (out.beep) cue(out.beep);
    if (harry) { const keys = clipsFor(out.event, cfg); if (keys.length) say(keys); }
    else if (out.speech) say(out.speech);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.index, remaining, cur.done, paused]);

  const toggle = () => { unlockSound(); onChange(r => r.pausedAt ? resumeRun(r) : pauseRun(r)); };
  const addRound = (d) => {
    unlockSound();
    if (d > 0 && !muted && cfg.beeps) cue("tick");
    const n = Math.max(0, (run.roundsDone || 0) + d);
    if (d > 0 && !muted && cfg.enabled && !cur.done) say(harry ? roundClips(cfg, n) : roundSpeech(cfg, n));
    onChange(r => ({ ...r, roundsDone: Math.max(0, (r.roundsDone || 0) + d) }));
  };
  const bg = cur.done ? "#0f0a1a" : BG[phase.kind];
  const pct = total ? Math.min(100, (cur.ms / (total * 1000)) * 100) : 100;
  const result = cur.done ? resultLabel(t, wodResult(run, phases)) : "";

  return (
    <div className="fixed inset-0 z-40 flex flex-col text-white select-none" style={{ background: bg, paddingTop: "var(--sat)", transition: "background .35s" }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => cur.done ? onStop("done") : setConfirm(true)} aria-label="cerrar" className="w-10 h-10 grid place-items-center rounded-full bg-white/15 cursor-pointer"><X size={20} /></button>
        <div className="text-center min-w-0 px-2">
          <div className="font-bold truncate">{t.name || "Intervalos"}</div>
          <div className="text-[12px] text-white/75 font-mono">{countUp ? `límite ${fmtSec(phase.sec)}` : `total restante ${fmtSec(Math.max(0, total - cur.ms / 1000))}`}</div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { unlockSound(); setMuted(m => { if (!m) { stopSpeaking(); stopClips(); } return !m; }); }} aria-label={muted ? "activar sonido" : "silenciar"} className="w-10 h-10 grid place-items-center rounded-full bg-white/15 cursor-pointer">
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button type="button" onClick={() => setSettings(true)} aria-label="configurar voz" className="w-10 h-10 grid place-items-center rounded-full bg-white/15 cursor-pointer"><Settings2 size={19} /></button>
        </div>
      </div>

      <div className="h-1.5 mx-4 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white" style={{ width: `${pct}%` }} /></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
        {cur.done ? (
          <>
            <div className="text-[60px] leading-none mb-3">🏁</div>
            <div className="font-display text-[48px] leading-none text-hot">¡Terminado!</div>
            {result && <div className="mt-3 text-2xl font-bold font-mono">{result}</div>}
            {t.mode === "amrap" && (
              <div className="flex items-center gap-4 mt-4">
                <button type="button" onClick={() => addRound(-1)} aria-label="una ronda menos" className="w-12 h-12 rounded-full bg-white/15 grid place-items-center cursor-pointer"><Minus size={22} /></button>
                <span className="text-white/80 text-sm">corrige las rondas</span>
                <button type="button" onClick={() => addRound(1)} aria-label="una ronda más" className="w-12 h-12 rounded-full bg-white/15 grid place-items-center cursor-pointer"><Plus size={22} /></button>
              </div>
            )}
            <div className="text-white/70 mt-4 text-sm">Guardado en tu historial.</div>
          </>
        ) : (
          <>
            <div className="font-display text-[34px] leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">{phase.label}</div>
            {phase.round && t.rounds > 1 && (
              <div className="mt-1 text-white/85 font-semibold">Ronda {phase.round}/{t.rounds}{t.sets > 1 ? ` · Serie ${phase.set}/${t.sets}` : ""}</div>
            )}
            <div className="font-display tabular-nums leading-none my-5 drop-shadow-[0_4px_0_rgba(0,0,0,0.25)]" style={{ fontSize: open ? "min(36vw, 10rem)" : "min(42vw, 11rem)" }}>{fmtSec(shown)}</div>
            {paused && <div className="px-3 py-1 rounded-full bg-white/20 font-semibold mb-3">En pausa</div>}
            {t.mode === "amrap" && open && (
              <div className="flex items-center gap-4 mb-4">
                <button type="button" onClick={() => addRound(-1)} aria-label="una ronda menos" className="w-12 h-12 rounded-full bg-white/15 grid place-items-center cursor-pointer"><Minus size={22} /></button>
                <button type="button" onClick={() => addRound(1)} className="px-6 h-16 rounded-2xl bg-white font-extrabold text-[20px] cursor-pointer active:scale-95" style={{ color: bg }}>
                  Rondas: {run.roundsDone || 0} <span className="text-[15px] font-bold">＋1</span>
                </button>
              </div>
            )}
            {!open && <div className="text-white/80 text-[15px] mb-4">{next ? <>Siguiente: <b className="text-white">{next.label}</b> · {fmtSec(next.sec)}</> : "Última fase"}</div>}
            <WodCard timer={t} compact={!open} />
          </>
        )}
      </div>

      <div className="px-6 pb-safe pt-3">
        {cur.done ? (
          <button type="button" onClick={() => onStop("done")} className="w-full py-4 rounded-2xl bg-white text-ink font-bold text-[17px] cursor-pointer mb-4">Listo</button>
        ) : countUp ? (
          <div className="flex items-center justify-between gap-4 mb-4">
            <button type="button" onClick={toggle} aria-label={paused ? "reanudar" : "pausar"} className="w-16 h-16 grid place-items-center rounded-full bg-white/15 cursor-pointer active:scale-95">
              {paused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
            </button>
            <button type="button" onClick={() => { unlockSound(); onChange(r => finishRun(r)); }}
              className="flex-1 h-20 rounded-full bg-white font-extrabold text-[22px] flex items-center justify-center gap-2 cursor-pointer active:scale-95" style={{ color: bg }}>
              <Flag size={24} /> Terminé
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 mb-4">
            <button type="button" onClick={() => onChange(r => backPhase(r, phases))} aria-label="fase anterior" className="w-16 h-16 grid place-items-center rounded-full bg-white/15 cursor-pointer active:scale-95"><SkipBack size={26} /></button>
            <button type="button" onClick={toggle} aria-label={paused ? "reanudar" : "pausar"} className="w-24 h-24 grid place-items-center rounded-full bg-white cursor-pointer active:scale-95" style={{ color: bg }}>
              {paused ? <Play size={40} fill="currentColor" /> : <Pause size={40} fill="currentColor" />}
            </button>
            <button type="button" onClick={() => onChange(r => skipPhase(r, phases))} aria-label="saltar fase" className="w-16 h-16 grid place-items-center rounded-full bg-white/15 cursor-pointer active:scale-95"><SkipForward size={26} /></button>
          </div>
        )}
      </div>

      <Sheet open={settings} onClose={() => setSettings(false)} title="Voz y sonido">
        <div className="px-4 pb-2 text-ink"><VoiceSettings voice={cfg} onChange={onVoiceChange} /></div>
      </Sheet>

      <ConfirmDialog open={confirm} title="¿Detener?"
        message="Puedes guardar lo que alcanzaste a hacer en el historial o descartarlo."
        confirmLabel="Guardar lo hecho y salir" cancelLabel="Seguir"
        onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onStop("save"); }}>
        <button type="button" onClick={() => { setConfirm(false); onStop("discard"); }}
          className="w-full mt-3 py-3 rounded-xl border border-coral/40 text-coral font-semibold cursor-pointer">Descartar sin guardar</button>
      </ConfirmDialog>
    </div>
  );
}
