import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search, Repeat, Pencil, Trash2, Trophy } from "lucide-react";
import { trainedDateSet, computeWeekStreak } from "../lib/timeline.js";
import { workoutStats, exerciseSummary } from "../lib/workouts.js";
import { formatDay, formatDuration, parseLocalDate } from "../lib/dates.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Tag } from "./ui/Tag.jsx";
import { StreakCalendar } from "./ui/StreakCalendar.jsx";
import { ConfirmDialog } from "./ui/Sheet.jsx";
import { ExerciseDetail, SetList } from "./ExerciseDetail.jsx";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const monthLabel = (d) => { const x = parseLocalDate(d); return `${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };

function WorkoutCard({ w, onEdit, onRepeat, onDelete, onOpenExercise, onSendToHealth }){
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState(null); // null | "sending" | { ok } | { error }
  const sendHealth = async () => { setHealth("sending"); setHealth(await onSendToHealth(w)); };
  const st = workoutStats(w);
  const prs = w.prs?.length || 0;
  return (
    <Card className="mb-2.5 overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left p-3.5 cursor-pointer">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              {w.tag && <Tag accent={w.accent || "violet"}>{w.tag}</Tag>}
              <span className="font-bold text-[15.5px] truncate">{w.title}</span>
              {w.source !== "app" && <span className="text-[10px] text-faint border border-line rounded px-1.5 py-0.5 shrink-0">{w.source === "hevy" ? "Hevy" : "Hevy · totales"}</span>}
            </div>
            <div className="text-faint text-[12.5px]">{formatDay(w.date)}{w.durationSec ? ` · ${formatDuration(w.durationSec)}` : ""}</div>
          </div>
          {open ? <ChevronDown size={18} className="text-faint shrink-0 mt-1" /> : <ChevronRight size={18} className="text-faint shrink-0 mt-1" />}
        </div>
        <div className="flex gap-5 mt-2.5 text-[12.5px]">
          <div><div className="text-faint text-[11px]">Volumen</div><div className="font-mono font-semibold">{Math.round(st.volume).toLocaleString("es")} kg</div></div>
          {st.sets > 0 && <div><div className="text-faint text-[11px]">Series</div><div className="font-mono font-semibold">{st.sets}</div></div>}
          {prs > 0 && <div><div className="text-faint text-[11px]">Récords</div><div className="font-mono font-semibold text-teal flex items-center gap-1"><Trophy size={13} />{prs}</div></div>}
        </div>
        {!open && (
          <div className="mt-2.5 flex flex-col gap-0.5">
            {w.exercises.slice(0, 4).map((e, i) => (
              <div key={i} className="text-[13px] text-mut truncate">{e.sets.length ? `${e.sets.length} × ` : ""}{e.name}</div>
            ))}
            {w.exercises.length > 4 && <div className="text-[12.5px] text-faint">y {w.exercises.length - 4} más…</div>}
          </div>
        )}
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 border-t border-line pt-3 flex flex-col gap-3">
          {w.notes && <div className="text-[13px] text-mut italic">{w.notes}</div>}
          {w.exercises.map((e, i) => {
            const s = exerciseSummary(e);
            return (
              <div key={i}>
                <button type="button" onClick={() => onOpenExercise(e.name)} className="font-semibold text-[14px] text-amber text-left cursor-pointer">{e.name}</button>
                {e.note && <div className="text-[12.5px] text-mut italic">{e.note}</div>}
                {e.sets.length ? <SetList sets={e.sets} unit={e.unit} />
                  : <div className="text-[13px] font-mono text-mut">máx {s.tw || "PC"} kg · e1RM {Math.round(s.e1rm)} <span className="text-faint">(sólo totales)</span></div>}
              </div>
            );
          })}
          {onSendToHealth && (
            w.healthUuid || health?.ok
              ? <div className="text-[13px] text-teal">❤️ Guardado en Apple Salud</div>
              : <div>
                  <button type="button" onClick={sendHealth} disabled={health === "sending"}
                    className="w-full py-2.5 rounded-lg border border-line text-ink text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                    {health === "sending" ? "Enviando…" : "❤️ Enviar a Apple Salud"}
                  </button>
                  {health?.error && <div className="mt-1 text-[12.5px] text-coral">{health.error}</div>}
                </div>
          )}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button type="button" onClick={onRepeat} className="py-2.5 rounded-lg bg-amber text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"><Repeat size={14} /> Repetir</button>
            <button type="button" onClick={onEdit} className="py-2.5 rounded-lg bg-panel2 text-ink text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"><Pencil size={14} /> Editar</button>
            <button type="button" onClick={onDelete} className="py-2.5 rounded-lg border border-coral/40 text-coral text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"><Trash2 size={14} /> Eliminar</button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function History({ state, catalog, onEdit, onRepeat, onDelete, onSendToHealth }){
  const [view, setView] = useState("workouts");
  const [limit, setLimit] = useState(15);
  const [toDelete, setToDelete] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [q, setQ] = useState("");
  const workouts = state.workouts;
  const trained = useMemo(() => trainedDateSet(workouts), [workouts]);
  const streak = useMemo(() => computeWeekStreak(workouts), [workouts]);

  const exerciseList = useMemo(() => {
    const m = new Map();
    workouts.forEach(w => w.exercises.forEach(e => {
      const cur = m.get(e.name);
      if (!cur) m.set(e.name, { name: e.name, count: 1, last: w.date });
      else cur.count++;
    }));
    return [...m.values()];
  }, [workouts]);
  const infoOf = (n) => catalog.find(c => c.name === n);

  const openExercise = (n) => { setExercise(n); setView("exercises"); window.scrollTo(0, 0); };

  let lastMonth = null;
  const shown = workouts.slice(0, limit);

  return (
    <div className="p-4 pb-28">
      <div className="flex bg-panel2 rounded-xl p-1 mb-4">
        {[["workouts", "Entrenamientos"], ["exercises", "Ejercicios"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => { setView(k); setExercise(null); }}
            className={cx("flex-1 py-2 rounded-lg text-[14px] font-semibold cursor-pointer", view === k ? "bg-panel text-ink shadow-sm" : "text-mut")}>{l}</button>
        ))}
      </div>

      {view === "workouts" && (
        <>
          <Card className="p-3.5 mb-5">
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="font-semibold text-sm">Constancia</span>
              <span className="text-[12px] text-mut">{workouts.length} entrenamientos · racha {streak} sem</span>
            </div>
            <StreakCalendar trainedDates={trained} weeks={12} />
          </Card>
          {workouts.length === 0 && <div className="text-faint text-sm italic">Aún no hay entrenamientos registrados.</div>}
          {shown.map(w => {
            const ml = monthLabel(w.date);
            const header = ml !== lastMonth ? <div className="text-[12px] font-semibold text-mut uppercase tracking-wide mt-4 mb-2 first:mt-0">{ml}</div> : null;
            lastMonth = ml;
            return (
              <div key={w.id}>
                {header}
                <WorkoutCard w={w} onEdit={() => onEdit(w)} onRepeat={() => onRepeat(w)} onDelete={() => setToDelete(w)} onOpenExercise={openExercise} onSendToHealth={onSendToHealth} />
              </div>
            );
          })}
          {workouts.length > limit && (
            <button type="button" onClick={() => setLimit(l => l + 20)} className="w-full py-3 rounded-xl bg-panel2 text-ink font-semibold cursor-pointer">Mostrar más</button>
          )}
        </>
      )}

      {view === "exercises" && (exercise ? (
        <ExerciseDetail name={exercise} info={infoOf(exercise)} workouts={workouts} onBack={() => setExercise(null)} />
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar ejercicio"
              className="w-full pl-9 pr-3 py-2.5 bg-panel border border-line rounded-xl outline-none focus:border-amber" />
          </div>
          <Card className="overflow-hidden">
            {exerciseList
              .filter(e => !q || e.name.toLowerCase().includes(q.toLowerCase()))
              .sort((a, b) => b.last.localeCompare(a.last))
              .map((e, i) => (
                <button key={e.name} type="button" onClick={() => openExercise(e.name)}
                  className={cx("w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left cursor-pointer active:bg-panel2", i && "border-t border-line")}>
                  <div className="min-w-0">
                    <div className="text-[14.5px] truncate">{e.name}</div>
                    <div className="text-[12px] text-faint">{e.count} {e.count === 1 ? "vez" : "veces"} · último {formatDay(e.last)}</div>
                  </div>
                  <ChevronRight size={17} className="text-faint shrink-0" />
                </button>
              ))}
          </Card>
        </>
      ))}

      <ConfirmDialog open={!!toDelete} title="¿Eliminar entrenamiento?"
        message={toDelete ? `${toDelete.title} del ${formatDay(toDelete.date)}. Esta acción no se puede deshacer.` : ""}
        confirmLabel="Eliminar" danger onCancel={() => setToDelete(null)}
        onConfirm={() => { onDelete(toDelete.id); setToDelete(null); }} />
    </div>
  );
}
