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

const BG = { work: "#ef6c2e", rest: "#14a88c", warmup: "#e0a23c", cooldown: "#6b5bd6" };
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
    steps: d.steps.map(s => ({ ...s, name: (s.name || "").trim(), sec: num(s.sec) })).filter(s => s.sec > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [d]);
  const total = totalSec(buildPhases(clean));

  return (
    <div className="pb-32">
      <div className="sticky-top z-10 bg-bg/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-mut cursor-pointer text-sm"><ArrowLeft size={18} /> Cancelar</button>
        <span className="font-bold">{isNew ? "Nuevo temporizador" : "Editar temporizador"}</span>
        <button type="button" disabled={!clean.steps.length} onClick={() => onSave(clean)}
          className="flex items-center gap-1.5 bg-amber text-white rounded-lg px-3 py-2 font-bold text-sm cursor-pointer disabled:opacity-50"><Check size={16} /> Guardar</button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-3">
          <div>
            <label className={fieldLabel}>Nombre</label>
            <input className={cx(inputCls, "font-semibold")} value={d.name} onChange={e => set("name", e.target.value)} placeholder="Ej. HIIT bicicleta" />
          </div>
          <SecField label="Calentamiento (segundos)" value={d.warmup} onChange={v => set("warmup", v)} />
        </Card>

        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-[15px]">Una ronda</span>
          <span className="text-faint text-[12px]">se repite {num(d.rounds, 1, 1)} veces</span>
        </div>
        {d.steps.map((s, i) => (
          <Card key={s.id} className="p-3.5 flex flex-col gap-2.5" style={{ borderLeft: `4px solid ${BG[s.kind]}` }}>
            <div className="flex gap-2">
              <input className={inputCls} value={s.name} onChange={e => setStep(i, "name", e.target.value)} placeholder={s.kind === "work" ? "Trabajo" : "Descanso"} />
              <button type="button" onClick={() => setD(x => ({ ...x, steps: x.steps.filter((_, j) => j !== i) }))} aria-label="quitar"
                className="w-11 shrink-0 rounded-xl border border-coral/40 text-coral grid place-items-center cursor-pointer"><Trash2 size={16} /></button>
            </div>
            <div className="flex bg-panel2 rounded-xl p-1">
              {[["work", "Trabajo"], ["rest", "Descanso"]].map(([k, l]) => (
                <button key={k} type="button" onClick={() => setStep(i, "kind", k)}
                  className={cx("flex-1 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer", s.kind === k ? "bg-panel shadow-sm text-ink" : "text-mut")}>{l}</button>
              ))}
            </div>
            <SecField label="Duración (segundos)" value={s.sec} min={1} onChange={v => setStep(i, "sec", v)} />
          </Card>
        ))}
        <button type="button" onClick={() => setD(x => ({ ...x, steps: [...x.steps, { id: newId("p"), name: "", sec: 30, kind: x.steps.at(-1)?.kind === "work" ? "rest" : "work" }] }))}
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

        <Card className="p-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-sm">Duración total</span>
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
export function Intervals({ timers, onChange, onStart, onEditing }){
  const [editing, setEditing] = useState(null); // { timer, isNew }
  const open = (e) => { setEditing(e); onEditing?.(!!e); window.scrollTo(0, 0); };

  if (editing) {
    return (
      <TimerEditor timer={editing.timer} isNew={editing.isNew}
        onCancel={() => open(null)}
        onDelete={(id) => { onChange(timers.filter(t => t.id !== id)); open(null); }}
        onSave={(t) => { onChange(editing.isNew ? [...timers, t] : timers.map(x => x.id === t.id ? t : x)); open(null); }} />
    );
  }

  return (
    <div className="p-4 pb-28">
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
                  <div className="font-bold text-[16px] truncate">{t.name || "Intervalos"}</div>
                  <div className="text-faint text-[12.5px] font-mono mt-0.5">{timerSummary(t)} · {fmtSec(total)}</div>
                </div>
                <button type="button" onClick={() => { unlockSound(); onStart(t); }} aria-label="iniciar"
                  className="shrink-0 w-12 h-12 rounded-full bg-amber text-white grid place-items-center cursor-pointer active:scale-95"><Play size={22} fill="currentColor" className="ml-0.5" /></button>
              </div>
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
