import { useMemo } from "react";
import { Flame, TrendingUp, ChevronRight, ClipboardList, Plus } from "lucide-react";
import { computeWeekStreak, currentWeekStats } from "../lib/timeline.js";
import { formatDay } from "../lib/dates.js";
import { cx } from "../lib/cx.js";
import { Tag } from "./ui/Tag.jsx";
import { StatTile } from "./ui/StatTile.jsx";
import { Card } from "./ui/Card.jsx";
import { ACCENT } from "./ui/accent.js";

export function Train({ state, routines, profileBar, onSelect, onStartEmpty, onGoToRoutines }){
  const workouts = state.workouts;
  const streak = useMemo(() => computeWeekStreak(workouts), [workouts]);
  const week = useMemo(() => currentWeekStats(workouts), [workouts]);
  const lastFor = (r) => workouts.find(w => w.routineId === r.id || (w.tag && w.tag === r.tag && w.title === r.title));

  return (
    <div className="p-4 pb-28">
      <div className="flex gap-3 mb-4">
        <StatTile icon={Flame} accent="coral" label="Racha" value={`${streak} sem`} />
        <StatTile icon={TrendingUp} accent="teal" label="Esta semana" value={`${week.count} · ${Math.round(week.volume).toLocaleString("es")} kg`} />
      </div>

      {profileBar}

      <button type="button" onClick={onStartEmpty}
        className="w-full mb-5 py-3 rounded-xl border border-dashed border-amber/60 text-amber font-semibold flex items-center justify-center gap-2 cursor-pointer">
        <Plus size={18} /> Empezar entrenamiento libre
      </button>

      {routines.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="text-mut text-sm mb-3">Este perfil no tiene rutinas todavía. Crea la primera para empezar a entrenar.</div>
          <button onClick={onGoToRoutines}
            className="inline-flex items-center gap-1.5 bg-amber text-white rounded-lg px-4 py-2.5 font-bold text-sm cursor-pointer">
            <ClipboardList size={16} /> Ir a Rutinas
          </button>
        </Card>
      ) : (
        <>
          <div className="text-mut text-sm mb-3">O elige una rutina. Verás lo que hiciste la vez anterior y una sugerencia por ejercicio.</div>
          <div className="flex flex-col gap-3">
            {routines.map(r => {
              const a = ACCENT[r.accent] || ACCENT.violet;
              const lastDone = lastFor(r);
              return (
                <button
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cx("text-left bg-panel border border-line rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform shadow-sm shadow-black/[0.03]", a.borderL)}
                  style={{ borderLeftWidth: 3 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Tag accent={r.accent}>{r.tag}</Tag>
                        <span className="font-display text-[22px] leading-none truncate">{r.title}</span>
                      </div>
                      <div className="text-faint text-[12.5px]">
                        {r.ex.length} ejercicios · {r.ex.reduce((acc, e) => acc + (e.sets || 0), 0)} series{lastDone ? ` · última: ${formatDay(lastDone.date)}` : ""}
                      </div>
                    </div>
                    <ChevronRight className={cx("shrink-0", a.text)} size={22} />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
