import { useMemo, useState } from "react";
import { Plus, Play, Pencil, Copy, Trash2, ArrowLeft, Check } from "lucide-react";
import { buildPhases, totalSec, timerSummary, fmtSec, blankTimer, cloneTimer } from "../lib/intervals.js";
import { parseNum } from "../lib/training.js";
import { newId } from "../data/routines.js";
import { unlockSound } from "../lib/sound.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { StepInput } from "./ui/StepInput.jsx";
import { ConfirmDialog } from "./ui/Sheet.jsx";
import { WOD_LIBRARY, WOD_MODE_LABEL } from "../data/wods.js";

const BG = { work: "#ff5a1f", rest: "#0fbf9f", warmup: "#f5a400", cooldown: "#7b4dff" };
const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber";
const fieldLabel = "text-[11px] font-medium text-mut mb-1 block";

/** Barra con la secuencia de fases a escala, coloreada por tipo. */
function PhaseBar({ timer, className }){
  const phases = useMemo(() => buildPhases(timer), [timer]);
  const total = totalSec(phases) || 1;
  return (
    <div className={cx("flex h-2 rounded-full overflow-hidden bg-line", className)}>
      {phases.map((p, i) => <div key={i} style={{ width: `${(p.sec / total) * 100}%`, background: BG[p.kind] }} />)}
    </div>
  );
}

/** Campo de segundos con − / + (de 5 en 5) y su equivalente en minutos. */
function SecField({ label, value, onChange, min = 0, step = 5 }){
  return (
    <div>
      <label className={fieldLabel}>{label} <span className="text-faint font-normal">({fmtSec(parseNum(value) || 0)})</span></label>
      <StepInput value={String(value ?? "")} step={step} min={min} onChange={onChange} inputClassName="h-10" btnClassName="h-10 w-9" />
    </div>
  );
}

function TimerEditor({ timer, isNew, onSave, onCancel, onDelete }){
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(timer)));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));
  const setStep = (i, k, v) => setD(x => ({ ...x, steps: x.steps.map((s, j) => j === i ? { ...s, [k]: v } : s) }));
  const num = (v, def = 0, min = 0) => { const n = parseNum(v); return n == null ? def : Math.max(min, Math.round(n)); };
  const clean = useMemo(() => ({
    ...d, name: d.name.trim() || "Intervalos",
    warmup: num(d.warmup), cooldown: num(d.cooldown), rounds: num(d.rounds, 1, 1), restRounds: num(d.restRounds),
    sets: num(d.sets, 1, 1), restSets: num(d.restSets),
    mode: d.mode || "intervals", capSec: num(d.capSec, 600, 60),
    workout: String(d.workoutText ?? (d.workout || []).join("\n")).split("\n").map(l => l.trim()).filter(Boolean),
    notes: (d.notes || "").trim(),
    steps: (d.steps || []).map(s => ({ ...s, name: (s.name || "").trim(), sec: num(s.sec) })).filter(s => s.sec > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [d]);
  const total = totalSec(buildPhases(clean));
  const mode = d.mode || "intervals";
  const open = mode === "amrap" || mode === "fortime";
  const valid = open ? clean.capSec > 0 : clean.steps.length > 0;
  const { workoutText: _wt, ...cleanToSave } = clean;

  return (
    <div className="pb-32">
      <div className="sticky-top z-10 bg-bg/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-mut cursor-pointer text-sm"><ArrowLeft size={18} /> Cancelar</button>
        <span className="font-bold">{isNew ? "Nuevo temporizador" : "Editar temporizador"}</span>
        <button type="button" disabled={!valid} onClick={() => onSave(cleanToSave)}
          className="flex items-center gap-1.5 bg-amber text-white rounded-lg px-3 py-2 font-bold text-sm cursor-pointer disabled:opacity-50"><Check size={16} /> Guardar</button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-3">
          <div>
            <label className={fieldLabel}>Nombre</label>
            <input className={cx(inputCls, "font-semibold")} value={d.name} onChange={e => set("name", e.target.value)} placeholder="Ej. HIIT bicicleta" />
          </div>
          <div>
            <label className={fieldLabel}>Tipo</label>
            <div className="flex bg-panel2 rounded-xl p-1">
              {[["intervals", "Intervalos"], ["amrap", "AMRAP"], ["fortime", "Por tiempo"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => set("mode", k)}
                  className={cx("flex-1 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer", mode === k ? "bg-amber text-white shadow-sm" : "text-mut")}>{l}</button>
              ))}
            </div>
            <div className="text-faint text-xs mt-1">{mode === "amrap" ? "Máximas rondas en un tiempo fijo; cuentas las rondas con un toque." : mode === "fortime" ? "Cronómetro hacia arriba con tiempo límite; tocas «Terminé» al acabar." : "Fases de trabajo y descanso que se repiten (EMOM, Tabata, HIIT)."}</div>
          </div>
          {open && (
            <div>
              <label className={fieldLabel}>{mode === "amrap" ? "Duración (minutos)" : "Tiempo límite (minutos)"}</label>
              <StepInput value={String(Math.round((parseNum(d.capSec) || 0) / 60))} min={1} onChange={v => set("capSec", (parseNum(v) || 0) * 60)} inputClassName="h-10" btnClassName="h-10 w-9" />
            </div>
          )}
          <SecField label={open ? "Cuenta previa / calentamiento (segundos)" : "Calentamiento (segundos)"} value={d.warmup} onChange={v => set("warmup", v)} />
          <div>
            <label className={fieldLabel}>Movimientos (uno por línea, opcional)</label>
            <textarea rows={4} value={d.workoutText ?? (d.workout || []).join("\n")} onChange={e => set("workoutText", e.target.value)}
              placeholder={"5 dominadas\n10 flexiones\n15 sentadillas"} className={cx(inputCls, "resize-none")} />
          </div>
          <div>
            <label className={fieldLabel}>Notas (cargas, escalado…)</label>
            <input className={inputCls} value={d.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Rx: 43/29 kg" />
          </div>
        </Card>

        {!open && <>
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-[15px]">Una ronda</span>
          <span className="text-faint text-[12px]">se repite {num(d.rounds, 1, 1)} veces</span>
        </div>
        {(d.steps || []).map((s, i) => (
          <Card key={s.id} className="p-3.5 flex flex-col gap-2.5" style={{ borderLeft: `4px solid ${BG[s.kind]}` }}>
            <div className="flex gap-2">
              <input className={inputCls} value={s.name} onChange={e => setStep(i, "name", e.target.value)} placeholder={s.kind === "work" ? "Trabajo" : "Descanso"} />
              <button type="button" onClick={() => setD(x => ({ ...x, steps: x.steps.filter((_, j) => j !== i) }))} aria-label="quitar"
                className="w-11 shrink-0 rounded-xl border border-coral/40 text-coral grid place-items-center cursor-pointer"><Trash2 size={16} /></button>
            </div>
            <div className="flex bg-panel2 rounded-xl p-1">
              {[["work", "Trabajo"], ["rest", "Descanso"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setStep(i, "kind", k)}
                  className={cx("flex-1 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer", s.kind === k ? "bg-amber text-white shadow-sm" : "text-mut")}>{l}</button>
              ))}
            </div>
            <SecField label="Duración (segundos)" value={s.sec} min={1} onChange={v => setStep(i, "sec", v)} />
          </Card>
        ))}
        <button type="button" onClick={() => setD(x => ({ ...x, steps: [...(x.steps || []), { id: newId("p"), name: "", sec: 30, kind: (x.steps || []).at(-1)?.kind === "work" ? "rest" : "work" }] }))}
          className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-line text-amber rounded-xl cursor-pointer font-medium">
          <Plus size={18} /> Agregar intervalo
        </button>

        <Card className="p-4 grid grid-cols-2 gap-x-3 gap-y-3">
          <div>
            <label className={fieldLabel}>Rondas</label>
            <StepInput value={String(d.rounds ?? "")} min={1} onChange={v => set("rounds", v)} inputClassName="h-10" btnClassName="h-10 w-9" />
          </div>
          <SecField label="Descanso entre rondas" value={d.restRounds} onChange={v => set("restRounds", v)} />
          <div>
            <label className={fieldLabel}>Series (bloques)</label>
            <StepInput value={String(d.sets ?? "")} min={1} onChange={v => set("sets", v)} inputClassName="h-10" btnClassName="h-10 w-9" />
          </div>
          <SecField label="Descanso entre series" value={d.restSets} onChange={v => set("restSets", v)} />
          <div className="col-span-2"><SecField label="Vuelta a la calma (segundos)" value={d.cooldown} onChange={v => set("cooldown", v)} /></div>
          <label className="col-span-2 flex items-center gap-2.5 text-[14px] cursor-pointer">
            <input type="checkbox" checked={!!d.skipLastRest} onChange={e => set("skipLastRest", e.target.checked)} className="w-4 h-4 accent-[#ef6c2e]" />
            No terminar con descanso (omitir el último)
          </label>
        </Card>
        </>}

        <Card className="p-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-sm">{open ? (mode === "amrap" ? "Duración" : "Límite") : "Duración total"}</span>
            <span className="font-mono font-bold text-lg">{fmtSec(total)}</span>
          </div>
          <PhaseBar timer={clean} />
          <div className="flex gap-3 mt-2 text-[11.5px] text-mut flex-wrap">
            {[["work", "Trabajo"], ["rest", "Descanso"], ["warmup", "Calentamiento"], ["cooldown", "Calma"]].map(([k, l]) => (
              <span key={k} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: BG[k] }} />{l}</span>
            ))}
          </div>
        </Card>

        {!isNew && (
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl cursor-pointer text-sm"><Trash2 size={15} /> Eliminar temporizador</button>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="¿Eliminar temporizador?" message={`«${clean.name}» se eliminará. El historial no se borra.`}
        confirmLabel="Eliminar" danger onCancel={() => setConfirmDelete(false)} onConfirm={() => onDelete(d.id)} />
    </div>
  );
}

/** Pestaña Intervalos: temporizadores guardados (crear, editar, duplicar, iniciar). */
function WodCard({ wod, onStart, onCopy }){
  const [open, setOpen] = useState(false);
  const badge = wod.mode === "intervals" ? timerSummary(wod) : `${WOD_MODE_LABEL[wod.mode]} ${fmtSec(wod.capSec)}`;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen(o => !o)} className="min-w-0 text-left cursor-pointer">
          <div className="font-display text-[26px] leading-none truncate">{wod.name}</div>
          <div className="text-[12px] font-mono text-amber mt-0.5">{badge}</div>
        </button>
        <button type="button" onClick={() => { unlockSound(); onStart(wod); }} aria-label={`empezar ${wod.name}`}
          className="shrink-0 w-12 h-12 rounded-full bg-amber text-white grid place-items-center cursor-pointer active:scale-95"><Play size={22} fill="currentColor" className="ml-0.5" /></button>
      </div>
      <button type="button" onClick={() => setOpen(o => !o)} className="block w-full text-left mt-2 cursor-pointer">
        {(open ? wod.workout : wod.workout.slice(0, 3)).map((l, i) => <div key={i} className="text-[13.5px] text-ink leading-snug">{l}</div>)}
        {!open && wod.workout.length > 3 && <div className="text-[12.5px] text-faint">ver todo…</div>}
        {open && wod.notes && <div className="text-[12.5px] text-mut mt-1.5">{wod.notes}</div>}
      </button>
      {open && (
        <button type="button" onClick={() => onCopy(wod)}
          className="w-full mt-3 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-sm font-medium text-ink cursor-pointer"><Copy size={14} /> Copiar a mis temporizadores y editar</button>
      )}
    </Card>
  );
}

export function Intervals({ timers, onChange, onStart, onEditing }){
  const [editing, setEditing] = useState(null); // { timer, isNew }
  const [view, setView] = useState("mine");
  const open = (e) => { setEditing(e); onEditing?.(!!e); window.scrollTo(0, 0); };

  if (editing) {
    return (
      <TimerEditor timer={editing.timer} isNew={editing.isNew}
        onCancel={() => open(null)}
        onDelete={(id) => { onChange(timers.filter(t => t.id !== id)); open(null); }}
        onSave={(t) => { onChange(editing.isNew ? [...timers, t] : timers.map(x => x.id === t.id ? t : x)); open(null); }} />
    );
  }

  const tabs = (
    <div className="flex bg-panel2 rounded-xl p-1 mb-4">
      {[["mine", "Mis temporizadores"], ["wods", `WOD famosos (${WOD_LIBRARY.length})`]].map(([k, l]) => (
        <button key={k} type="button" onClick={() => setView(k)}
          className={cx("flex-1 py-2 rounded-lg text-[14px] font-semibold cursor-pointer", view === k ? "bg-amber text-white shadow-sm" : "text-mut")}>{l}</button>
      ))}
    </div>
  );

  if (view === "wods") {
    return (
      <div className="p-4 pb-28">
        {tabs}
        <div className="text-mut text-[13px] mb-3">WOD de referencia listos para empezar. Toca uno para ver los movimientos y las cargas Rx; puedes copiarlo para ajustarlo a tu nivel.</div>
        <div className="flex flex-col gap-3">
          {WOD_LIBRARY.map(w => (
            <WodCard key={w.id} wod={w} onStart={(x) => onStart(cloneTimer(x))}
              onCopy={(x) => { const c = { ...cloneTimer(x), name: x.name }; onChange([...timers, c]); setView("mine"); open({ timer: c, isNew: false }); }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-28">
      {tabs}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[15px] font-bold text-mut">{timers.length} {timers.length === 1 ? "temporizador" : "temporizadores"}</h2>
        <button type="button" onClick={() => open({ timer: blankTimer(), isNew: true })}
          className="flex items-center gap-1.5 bg-amber text-white rounded-lg px-3 py-2 font-bold text-sm cursor-pointer"><Plus size={16} /> Nuevo</button>
      </div>
      <div className="text-mut text-[13px] mb-4">Trabajo y descanso por tiempo, con voz y pitidos. Con el teléfono bloqueado te avisa cada cambio de fase.</div>

      <div className="flex flex-col gap-3">
        {timers.map(t => {
          const total = totalSec(buildPhases(t));
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-[22px] leading-tight truncate">{t.name || "Intervalos"}</div>
                  <div className="text-faint text-[12.5px] font-mono mt-0.5">{timerSummary(t)} · {fmtSec(total)}</div>
                </div>
                <button type="button" onClick={() => { unlockSound(); onStart(t); }} aria-label="iniciar"
                  className="shrink-0 w-12 h-12 rounded-full bg-amber text-white grid place-items-center cursor-pointer active:scale-95"><Play size={22} fill="currentColor" className="ml-0.5" /></button>
              </div>
              {t.workout?.length > 0 && <div className="text-[13px] text-mut mt-2 truncate">{t.workout.join(" · ")}</div>}
              <PhaseBar timer={t} className="mt-3" />
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => open({ timer: t, isNew: false })}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-sm font-medium text-ink cursor-pointer"><Pencil size={14} /> Editar</button>
                <button type="button" onClick={() => onChange([...timers, { ...cloneTimer(t), name: `${t.name} (copia)` }])} aria-label="duplicar"
                  className="w-11 flex items-center justify-center border border-line rounded-lg py-2 text-mut cursor-pointer"><Copy size={15} /></button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
