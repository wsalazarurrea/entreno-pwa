import { useMemo } from "react";
import { Flame, TrendingUp, ChevronRight } from "lucide-react";
import { DAY_ORDER, ROUTINES } from "../data/routines.js";
import { buildTimeline, computeWeekStreak, currentWeekVolume } from "../lib/timeline.js";
import { cx } from "../lib/cx.js";
import { Tag } from "./ui/Tag.jsx";
import { StatTile } from "./ui/StatTile.jsx";
import { ACCENT } from "./ui/accent.js";

export function Train({ state, onSelect }){
  const timeline = useMemo(()=>buildTimeline(state), [state]);
  const streak = useMemo(()=>computeWeekStreak(timeline), [timeline]);
  const weekVol = useMemo(()=>currentWeekVolume(timeline), [timeline]);

  return (
    <div className="p-4 pb-28">
      <div className="flex gap-3 mb-5">
        <StatTile icon={Flame} accent="coral" label="Racha" value={`${streak} sem`} />
        <StatTile icon={TrendingUp} accent="teal" label="Volumen esta semana" value={`${Math.round(weekVol).toLocaleString()} kg`} />
      </div>
      <div className="text-mut text-sm mb-3">Elige la sesión de hoy. Verás tu peso previo y una sugerencia por ejercicio mientras registras.</div>
      <div className="flex flex-col gap-3">
        {DAY_ORDER.map(k => {
          const r = ROUTINES[k];
          const a = ACCENT[r.accent];
          const lastDone = timeline.find(d => d.tag === r.tag);
          return (
            <button
              key={k}
              onClick={()=>onSelect(k)}
              className={cx("text-left bg-panel border border-line rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-transform", a.borderL)}
              style={{ borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag accent={r.accent}>{r.tag}</Tag>
                    <span className="font-bold text-[16px]">{r.title}</span>
                  </div>
                  <div className="text-faint text-[12.5px]">
                    {r.ex.length} ejercicios · {r.ex.reduce((acc,e)=>acc+e.sets,0)} series{lastDone?` · última: ${lastDone.date}`:""}
                  </div>
                </div>
                <ChevronRight className={cx("shrink-0", a.text)} size={22} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
