import { Trophy, Sparkles } from "lucide-react";
import { Card } from "./ui/Card.jsx";

export function Summary({ data, onClose }){
  return (
    <div className="p-4 pb-32">
      <h2 className="text-[22px] font-bold mt-1.5 mb-0.5">Sesión cerrada</h2>
      <div className="text-mut font-mono text-[13px] mb-4">{data.day} · {data.durMin} min · {data.totalSets} series · {Math.round(data.volume).toLocaleString()} kg movidos</div>

      {data.prs.length>0 && (
        <Card className="!bg-teal/10 !border-teal/40 p-3.5 mb-3.5">
          <div className="text-teal font-bold mb-1.5 flex items-center gap-1.5"><Trophy size={16}/> Récords estimados</div>
          {data.prs.map((p,i)=>(
            <div key={i} className="text-sm text-ink">{p.name}: <span className="font-mono">{p.w}×{p.r}</span> <span className="text-faint">(e1RM {p.e1rm.toFixed(0)} kg)</span></div>
          ))}
        </Card>
      )}

      <Card className="p-4 mb-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles size={16} className="text-amber"/>
          <span className="font-bold">Análisis del entrenador</span>
        </div>
        <div className="text-[14.5px] leading-relaxed text-ink whitespace-pre-wrap">{data.fallback}</div>
      </Card>

      <Card className="p-3.5 mb-3.5">
        <div className="font-semibold mb-2 text-sm">Progresión para la próxima vez</div>
        {data.nextHints.map((h,i)=><div key={i} className="text-[13.5px] text-mut py-0.5">· {h}</div>)}
      </Card>

      <button onClick={onClose} className="w-full py-3.5 bg-panel2 text-ink border border-line rounded-xl text-[15px] font-semibold cursor-pointer">Listo</button>
    </div>
  );
}
