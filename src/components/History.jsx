import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { buildTimeline, trainedDateSet } from "../lib/timeline.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Tag } from "./ui/Tag.jsx";
import { StreakCalendar } from "./ui/StreakCalendar.jsx";

function ExercisePicker({ names, selected, onSelect }){
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = query ? names.filter(n=>n.toLowerCase().includes(query.toLowerCase())) : names;
  return (
    <div className="relative mb-3.5">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"/>
        <input
          value={open ? query : selected}
          onFocus={()=>{ setOpen(true); setQuery(""); }}
          onChange={e=>setQuery(e.target.value)}
          onBlur={()=>setTimeout(()=>setOpen(false),150)}
          placeholder="Buscar ejercicio…"
          className="w-full pl-9 pr-3 py-2.5 bg-panel border border-line rounded-xl text-sm text-ink outline-none"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-panel2 border border-line rounded-xl shadow-lg">
          {filtered.map(n=>(
            <button key={n} type="button" onMouseDown={()=>{ onSelect(n); setOpen(false); }}
              className={cx("w-full text-left px-3 py-2 text-sm cursor-pointer truncate block", n===selected?"text-amber":"text-ink")}>
              {n}
            </button>
          ))}
          {filtered.length===0 && <div className="px-3 py-2 text-sm text-faint">Sin resultados</div>}
        </div>
      )}
    </div>
  );
}

function DayCard({ day }){
  const [open, setOpen] = useState(false);
  return (
    <Card className="mb-2.5 overflow-hidden">
      <button type="button" onClick={()=>setOpen(o=>!o)} className="w-full text-left p-3.5 cursor-pointer">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Tag accent={day.tag ? day.accent : "violet"}>{day.tag || "LIBRE"}</Tag>
              <span className="font-semibold text-[15px] truncate">{day.title || `Sesión (${day.exercises.length} ejerc.)`}</span>
              {day.source==="hevy" && <span className="text-[10px] text-faint border border-line rounded px-1.5 py-0.5 shrink-0">Hevy</span>}
            </div>
            <div className="text-faint font-mono text-xs">
              {day.date} · {day.exercises.length} ejerc.{day.totalSets?` · ${day.totalSets} series`:""} · {Math.round(day.volume).toLocaleString()} kg{day.durationSec?` · ${Math.round(day.durationSec/60)} min`:""}{day.prs?` · ${day.prs} PR`:""}
            </div>
          </div>
          {open ? <ChevronDown size={18} className="text-faint shrink-0"/> : <ChevronRight size={18} className="text-faint shrink-0"/>}
        </div>
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 flex flex-col gap-1.5 border-t border-line pt-2.5">
          {day.exercises.map((e,i)=>(
            <div key={i} className="flex justify-between gap-2 text-[13.5px]">
              <span className="text-ink truncate">{e.name}</span>
              <span className="font-mono text-mut whitespace-nowrap">
                {e.sets
                  ? e.sets.map(s=>`${s.w??"PC"}×${s.r}`).join(" ")
                  : `${e.topWeight?`${e.topWeight}kg`:"PC"} · e1RM ${Math.round(e.e1rm)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function History({ state }){
  const timeline = useMemo(()=>buildTimeline(state), [state]);
  const trained = useMemo(()=>trainedDateSet(timeline), [timeline]);
  const exNames = useMemo(()=> Object.keys(state.history).filter(k=>(state.history[k]||[]).length>1).sort(), [state.history]);
  const [sel, setSel] = useState(exNames[0]||"");
  const series = (state.history[sel]||[]).map(p=>({date:p.d.slice(5), e1rm:Math.round(p.e1rm)}));

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-1">Constancia</h2>
      <div className="text-mut text-[13px] mb-3">Semanas entrenadas en los últimos ~2 meses, incluyendo tu historial de Hevy.</div>
      <Card className="p-3.5 mb-5">
        <StreakCalendar trainedDates={trained} weeks={8} />
      </Card>

      <h2 className="text-xl font-bold mb-1">Progresión</h2>
      <div className="text-mut text-[13px] mb-3">Fuerza estimada (e1RM) a lo largo del tiempo.</div>
      <ExercisePicker names={exNames} selected={sel} onSelect={setSel} />
      <Card className="p-2 pt-4" style={{ height:260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top:4, right:12, left:-14, bottom:0 }}>
            <CartesianGrid stroke="#2A303A" vertical={false}/>
            <XAxis dataKey="date" stroke="#5B636E" fontSize={11} tickLine={false} axisLine={{stroke:"#2A303A"}} minTickGap={24}/>
            <YAxis stroke="#5B636E" fontSize={11} tickLine={false} axisLine={false} width={44} domain={['dataMin-5','dataMax+5']}/>
            <Tooltip contentStyle={{background:"#1F242C", border:"1px solid #2A303A", borderRadius:8, color:"#ECEAE4", fontSize:12}} labelStyle={{color:"#889099"}}/>
            <Line type="monotone" dataKey="e1rm" stroke="#E8A33D" strokeWidth={2.5} dot={{r:2,fill:"#E8A33D"}} activeDot={{r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <h3 className="text-base font-bold mt-6 mb-2.5">Días de entrenamiento</h3>
      {timeline.length===0 && <div className="text-faint text-sm italic">Aún no hay sesiones registradas.</div>}
      {timeline.map((d,i)=><DayCard key={d.date+"-"+i} day={d} />)}
    </div>
  );
}
