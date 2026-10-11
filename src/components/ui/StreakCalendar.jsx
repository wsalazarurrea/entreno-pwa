import { cx } from "../../lib/cx.js";
import { localDate } from "../../lib/dates.js";

/** Grilla de constancia (últimas `weeks` semanas, 7 días por columna, terminando hoy). */
export function StreakCalendar({ trainedDates, weeks=8 }){
  const today = new Date(); today.setHours(0,0,0,0);
  const totalDays = weeks*7;
  const days = [];
  for (let i = totalDays-1; i>=0; i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const iso = localDate(d);
    days.push({ iso, trained: trainedDates.has(iso), isToday: i===0 });
  }
  const cols = [];
  for (let i=0;i<days.length;i+=7) cols.push(days.slice(i,i+7));

  return (
    <div className="flex gap-[3px] overflow-x-auto">
      {cols.map((col,ci)=>(
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map(d=>(
            <div key={d.iso} title={d.iso}
              className={cx(
                "w-3 h-3 rounded-[3px] shrink-0",
                d.trained ? "bg-teal" : "bg-line",
                d.isToday && "ring-1 ring-amber ring-offset-1 ring-offset-bg"
              )} />
          ))}
        </div>
      ))}
    </div>
  );
}
