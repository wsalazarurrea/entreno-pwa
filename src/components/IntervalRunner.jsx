import { useEffect, useMemo, useRef, useState } from "react";
import { X, Pause, Play, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import { buildPhases, totalSec, elapsedMs, phaseAt, pauseRun, resumeRun, skipPhase, backPhase, fmtSec } from "../lib/intervals.js";
import { cue, speak, resumeSound, unlockSound } from "../lib/sound.js";
import { ConfirmDialog } from "./ui/Sheet.jsx";

const BG = { work: "#ef6c2e", rest: "#14a88c", warmup: "#e0a23c", cooldown: "#6b5bd6" };

/** Pantalla de ejecución del temporizador. `run` vive en App (persistido); los cambios suben por onChange. */
export function IntervalRunner({ run, onChange, onFinish, onStop }){
  const phases = useMemo(() => buildPhases(run.timer), [run.timer]);
  const total = totalSec(phases);
  const rounds = run.timer.rounds, sets = run.timer.sets;
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const cueRef = useRef({ index: -1, sec: null, done: false });
  const wakeRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(t); }, []);
  useEffect(() => {
    const acquire = async () => { try { if ("wakeLock" in navigator) wakeRef.current = await navigator.wakeLock.request("screen"); } catch { /* opcional */ } };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") { acquire(); resumeSound(); setNow(Date.now()); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); try { wakeRef.current?.release(); } catch { /* */ } };
  }, []);

  const ms = elapsedMs(run, now);
  const cur = phaseAt(phases, ms);
  const paused = !!run.pausedAt;
  const remaining = Math.ceil(cur.remainingMs / 1000);
  const next = phases[cur.index + 1];

  // Pitidos 3-2-1, aviso al empezar cada fase y final.
  useEffect(() => {
    const c = cueRef.current;
    if (cur.done) {
      if (!c.done) { c.done = true; if (sound) { cue("end"); speak("¡Terminado! Buen trabajo"); } onFinish(); }
      return;
    }
    if (paused) return;
    if (cur.index !== c.index) {
      const first = c.index === -1;
      c.index = cur.index; c.sec = null;
      if (sound && (!first || cur.elapsedInPhaseMs < 1500)) {
        const p = cur.phase;
        cue(p.kind === "work" ? "go" : "rest");
        speak(p.round && p.kind === "work" ? `${p.label}. Ronda ${p.round} de ${rounds}` : p.label);
      }
      return;
    }
    if (remaining <= 3 && remaining >= 1 && c.sec !== remaining) {
      c.sec = remaining;
      if (sound) cue("tick");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur.index, remaining, cur.done, paused]);

  const toggle = () => { unlockSound(); onChange(r => r.pausedAt ? resumeRun(r) : pauseRun(r)); };
  const phase = cur.phase;
  const bg = cur.done ? "#241c13" : BG[phase.kind];
  const pct = total ? Math.min(100, (ms / (total * 1000)) * 100) : 100;

  return (
    <div className="fixed inset-0 z-40 flex flex-col text-white select-none" style={{ background: bg, paddingTop: "var(--sat)", transition: "background .35s" }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => cur.done ? onStop("discard") : setConfirm(true)} aria-label="cerrar" className="w-10 h-10 grid place-items-center rounded-full bg-white/15 cursor-pointer"><X size={20} /></button>
        <div className="text-center min-w-0 px-2">
          <div className="font-bold truncate">{run.timer.name || "Intervalos"}</div>
          <div className="text-[12px] text-white/75 font-mono">total restante {fmtSec(Math.max(0, total - ms / 1000))}</div>
        </div>
        <button type="button" onClick={() => { unlockSound(); setSound(s => !s); }} aria-label="sonido" className="w-10 h-10 grid place-items-center rounded-full bg-white/15 cursor-pointer">
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
      </div>

      <div className="h-1.5 mx-4 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white" style={{ width: `${pct}%` }} /></div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {cur.done ? (
          <>
            <div className="text-[64px] leading-none mb-3">🏁</div>
            <div className="text-3xl font-extrabold">¡Terminado!</div>
            <div className="text-white/75 mt-2">Guardado en tu historial.</div>
          </>
        ) : (
          <>
            <div className="text-[26px] font-extrabold uppercase tracking-wide">{phase.label}</div>
            {phase.round && (
              <div className="mt-1 text-white/85 font-semibold">Ronda {phase.round}/{rounds}{sets > 1 ? ` · Serie ${phase.set}/${sets}` : ""}</div>
            )}
            <div className="font-mono font-bold tabular-nums leading-none my-6" style={{ fontSize: "min(34vw, 9rem)" }}>{fmtSec(remaining)}</div>
            {paused && <div className="px-3 py-1 rounded-full bg-white/20 font-semibold mb-3">En pausa</div>}
            <div className="text-white/80 text-[15px]">{next ? <>Siguiente: <b className="text-white">{next.label}</b> · {fmtSec(next.sec)}</> : "Última fase"}</div>
          </>
        )}
      </div>

      <div className="px-6 pb-safe pt-2">
        {cur.done ? (
          <button type="button" onClick={() => onStop("done")} className="w-full py-4 rounded-2xl bg-white text-ink font-bold text-[17px] cursor-pointer mb-4">Listo</button>
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

      <ConfirmDialog open={confirm} title="¿Detener el temporizador?"
        message="Puedes guardar lo que alcanzaste a hacer en el historial o descartarlo."
        confirmLabel="Guardar lo hecho y salir" cancelLabel="Seguir"
        onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onStop("save"); }}>
        <button type="button" onClick={() => { setConfirm(false); onStop("discard"); }}
          className="w-full mt-3 py-3 rounded-xl border border-coral/40 text-coral font-semibold cursor-pointer">Descartar sin guardar</button>
      </ConfirmDialog>
    </div>
  );
}
