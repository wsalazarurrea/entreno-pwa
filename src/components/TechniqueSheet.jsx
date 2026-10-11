import { useEffect, useState } from "react";
import { PlayCircle, Repeat2, ChevronRight } from "lucide-react";
import { techFor, techByKey, imgUrl, videoUrl } from "../data/technique.js";
import { WOD_GUIDES } from "../data/wodGuides.js";
import { openExternal } from "../lib/native.js";
import { cx } from "../lib/cx.js";
import { Sheet } from "./ui/Sheet.jsx";

/** Imágenes de inicio y final alternándose como una animación. */
function FlipBook({ id }){
  const [i, setI] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { const t = setInterval(() => setI(x => 1 - x), 1100); return () => clearInterval(t); }, []);
  if (!id || failed) return null;
  return (
    <div className="relative rounded-xl overflow-hidden bg-white mb-3">
      {[0, 1].map(k => (
        <img key={k} src={imgUrl(id, k)} alt={k ? "posición final" : "posición inicial"} onError={() => setFailed(true)}
          className={cx("w-full h-auto block transition-opacity duration-300", k ? "absolute inset-0" : "", i === k ? "opacity-100" : "opacity-0")} />
      ))}
      <div className="absolute left-2 bottom-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-semibold">{i ? "Final" : "Inicio"}</div>
    </div>
  );
}

function Section({ title, children }){
  return (
    <div className="mb-3">
      <div className="text-[12px] font-bold uppercase tracking-wide text-amber mb-1">{title}</div>
      {children}
    </div>
  );
}

const LEVELS = [["b", "Básico", "text-teal"], ["n", "Normal", "text-violet"], ["a", "Avanzado", "text-coral"]];

/** Contenido de la ficha de técnica. onUse(nombre) = reemplazar el ejercicio (dentro de un entrenamiento). */
export function TechniqueBody({ name, techKey, onUse, onOpen }){
  const t = techKey ? techByKey(techKey) : techFor(name);
  const title = name || t?.t;
  if (!t) {
    return (
      <div className="px-4 pb-4">
        <div className="font-display text-[24px] leading-tight mb-2">{title}</div>
        <div className="text-[14px] text-mut mb-3">Aún no hay ficha de técnica para este ejercicio.</div>
        <button type="button" onClick={() => openExternal(videoUrl(title))} className="w-full py-3 rounded-xl bg-amber text-white font-bold flex items-center justify-center gap-2 cursor-pointer"><PlayCircle size={18} /> Ver video de la técnica</button>
      </div>
    );
  }
  const hasAlt = LEVELS.some(([k]) => t.alt?.[k]?.length);
  return (
    <div className="px-4 pb-4">
      <div className="font-display text-[26px] leading-tight">{title}</div>
      {name && name !== t.t && <div className="text-[12.5px] text-faint">Técnica: {t.t}</div>}
      <div className="text-[13px] text-mut mb-3">{t.m}</div>
      <FlipBook id={t.img} />
      {t.note && <div className="text-[13.5px] text-ink bg-panel2 rounded-xl px-3 py-2 mb-3">💡 {t.note}</div>}
      <Section title="Cómo se hace">
        <ol className="list-decimal pl-5 flex flex-col gap-1 text-[14.5px] text-ink">{t.s.map((x, i) => <li key={i}>{x}</li>)}</ol>
      </Section>
      <Section title="Claves">
        <ul className="flex flex-col gap-1 text-[14px] text-ink">{t.c.map((x, i) => <li key={i}>✅ {x}</li>)}</ul>
      </Section>
      <Section title="Errores comunes">
        <ul className="flex flex-col gap-1 text-[14px] text-ink">{t.e.map((x, i) => <li key={i}>❌ {x}</li>)}</ul>
      </Section>
      {hasAlt && (
        <Section title="Alternativas">
          <div className="flex flex-col gap-2">
            {LEVELS.map(([k, label, cls]) => t.alt[k]?.length ? (
              <div key={k}>
                <div className={cx("text-[12px] font-semibold mb-1", cls)}>{label}</div>
                <div className="flex flex-col gap-1.5">
                  {t.alt[k].map(n => (
                    <div key={n} className="flex items-center gap-2 bg-panel2 rounded-xl pl-3 pr-1.5 py-1.5">
                      <button type="button" onClick={() => onOpen?.(n)} className="flex-1 min-w-0 text-left text-[14px] truncate cursor-pointer flex items-center gap-1">{n} <ChevronRight size={14} className="text-faint shrink-0" /></button>
                      {onUse && <button type="button" onClick={() => onUse(n)} className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber text-white text-[12.5px] font-bold flex items-center gap-1 cursor-pointer"><Repeat2 size={14} /> Usar</button>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null)}
          </div>
        </Section>
      )}
      <button type="button" onClick={() => openExternal(videoUrl(title))} className="w-full mt-1 py-3 rounded-xl border border-line text-ink font-semibold flex items-center justify-center gap-2 cursor-pointer"><PlayCircle size={18} /> Ver video en YouTube</button>
      <div className="text-[11.5px] text-faint mt-3">Guía orientativa. Ante dolor o dudas, consulta a un profesional. Imágenes: free-exercise-db (dominio público).</div>
    </div>
  );
}

/** Hoja con la ficha de un ejercicio; permite navegar a las alternativas. */
export function TechniqueSheet({ open, name, techKey, onClose, onUse }){
  const [stack, setStack] = useState([]);
  useEffect(() => { setStack([]); }, [name, techKey, open]);
  const current = stack.at(-1);
  return (
    <Sheet open={open} onClose={onClose} title={current ? "← Volver" : "Cómo se hace"}>
      {current
        ? <div><button type="button" onClick={() => setStack(s => s.slice(0, -1))} className="px-4 pb-2 text-amber text-[14px] font-semibold cursor-pointer">← Volver a {stack.length > 1 ? stack.at(-2) : (name || techByKey(techKey)?.t)}</button>
            <TechniqueBody name={current} onUse={onUse} onOpen={(n) => setStack(s => [...s, n])} /></div>
        : <TechniqueBody name={name} techKey={techKey} onUse={onUse} onOpen={(n) => setStack(s => [...s, n])} />}
    </Sheet>
  );
}

/** Hoja con la guía de un WOD. */
export function WodGuideSheet({ open, wod, onClose }){
  const [move, setMove] = useState(null);
  useEffect(() => { setMove(null); }, [open, wod?.id]);
  const g = wod ? WOD_GUIDES[wod.ref || wod.id] : null;
  return (
    <Sheet open={open} onClose={onClose} title={move ? "Técnica" : "Cómo se hace el WOD"}>
      {move ? (
        <div>
          <button type="button" onClick={() => setMove(null)} className="px-4 pb-2 text-amber text-[14px] font-semibold cursor-pointer">← Volver a {wod?.name}</button>
          <TechniqueBody techKey={move} />
        </div>
      ) : wod && (
        <div className="px-4 pb-4">
          <div className="font-display text-[30px] leading-none mb-2">{wod.name}</div>
          {wod.workout?.length > 0 && (
            <div className="bg-panel2 rounded-xl px-3 py-2 mb-3 text-[14px]">
              {wod.workout.map((l, i) => <div key={i}>{l}</div>)}
              {wod.notes && <div className="text-[12.5px] text-mut mt-1">{wod.notes}</div>}
            </div>
          )}
          {g ? (
            <>
              <Section title="Cómo se juega"><div className="text-[14.5px]">{g.how}</div></Section>
              <Section title="Estrategia"><div className="text-[14.5px]">{g.strategy}</div></Section>
              <Section title="Escalado">
                <div className="flex flex-col gap-1.5 text-[14px]">
                  {LEVELS.map(([k, label, cls]) => <div key={k}><span className={cx("font-bold", cls)}>{label}:</span> {g.scale[k]}</div>)}
                </div>
              </Section>
              <Section title="Referencias (orientativas)"><div className="text-[14px] text-mut">{g.ref}</div></Section>
              <Section title="Técnica de los movimientos">
                <div className="flex flex-wrap gap-2">
                  {g.moves.map(k => { const t = techByKey(k); return t ? (
                    <button key={k} type="button" onClick={() => setMove(k)} className="px-3 py-1.5 rounded-full bg-panel2 border border-line text-[13.5px] cursor-pointer">{t.t} ›</button>
                  ) : null; })}
                </div>
              </Section>
            </>
          ) : <div className="text-[14px] text-mut">Este temporizador no tiene guía. Las guías están en los WOD famosos.</div>}
        </div>
      )}
    </Sheet>
  );
}
