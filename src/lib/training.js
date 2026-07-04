import { storage } from "./storage.js";
import { SEED } from "../data/seedHistory.js";

export async function loadState(){ try{ const r=await storage.get("pt_state_v1"); return r?JSON.parse(r.value):null; }catch(e){ return null; } }
export async function saveState(s){ try{ await storage.set("pt_state_v1", JSON.stringify(s)); }catch(e){ console.error(e); } }

export function seedState(){
  const last={}; Object.entries(SEED.last||{}).forEach(([k,v])=>{ last[k]={date:v.date, sets:v.sets}; });
  const history={}; Object.entries(SEED.hist||{}).forEach(([k,v])=>{ history[k]=v.slice(); });
  return { lastperf:last, history, sessions:[] };
}

export function incFor(ex){
  if(ex.unit==="bw") return 0;
  if(/Mancuerna/.test(ex.name)) return 2;
  if(/Cable|Aperturas|Elevación Lateral|Vuelos|Tirón/.test(ex.name)) return 2.5;
  return 5;
}

export function suggestion(ex, lastperf){
  const lp = lastperf[ex.name];
  const inc = incFor(ex);
  if(ex.unit==="bw"){
    if(lp && lp.sets && lp.sets.every(s=>(s.r||0)>=ex.hi)) return {w:0, kind:"up", msg:`superaste ${ex.hi} reps a peso corporal → añade lastre`};
    return {w:0, kind:"hold", msg:`peso corporal · busca +1 rep (meta ${ex.hi})`};
  }
  if(!lp || !lp.sets || !lp.sets.filter(s=>s.w!=null).length) return {w:ex.start, kind:"start", msg:`arranque sugerido ${ex.start} kg`};
  const working = lp.sets.filter(s=>s.w!=null);
  const w = Math.max(...working.map(s=>s.w||0));
  const atTop = working.filter(s=>(s.w||0)===w);
  const allHi = atTop.length>0 && atTop.every(s=>(s.r||0)>=ex.hi);
  if(allHi) return {w:+(w+inc).toFixed(1), kind:"up", msg:`cerraste ${ex.hi} reps en todas → sube a ${+(w+inc).toFixed(1)} kg`};
  return {w:w, kind:"hold", msg:`mantén ${w} kg y suma reps (meta ${ex.hi})`};
}

export function e1rm(w,r){ return (w>0&&r>0)? w*(1+r/30):0; }

/** Cierra una sesión activa: calcula volumen/PRs, actualiza lastperf + history
 * (de donde buildTimeline reconstruye los días de entreno) y arma el resumen
 * de la pantalla final. */
export function buildSessionResult(routine, log, durationSec, state){
  const today = new Date().toISOString().slice(0,10);
  const ns = { ...state, lastperf:{...state.lastperf}, history:{...state.history}, sessions:[...state.sessions] };
  let volume=0, totalSets=0; const prs=[]; const nextHints=[];
  log.forEach((e,ei)=>{
    const ex = routine.ex[ei];
    const done = e.sets.filter(s=>s.done);
    const counted = done.length?done:e.sets;
    let bestE=0,bestS=null;
    counted.forEach(s=>{ const w=s.w||0,r=s.r||0; volume+=w*r; totalSets+=1; const ee=e1rm(w,r); if(ee>bestE){bestE=ee;bestS=s;} });
    const hist = ns.history[e.name]||[]; const prevBest = Math.max(0,...hist.map(p=>p.e1rm||0));
    if(bestE>prevBest+0.1 && bestS && (bestS.w||0)>0){ prs.push({name:e.name, w:bestS.w, r:bestS.r, e1rm:bestE}); }
    ns.lastperf[e.name] = { date:today, sets: counted.map(s=>({w:(ex.unit==="bw"?(s.w||0):s.w), r:s.r})) };
    ns.history[e.name] = [...hist, { d:today, e1rm:+bestE.toFixed(1), tw:Math.max(0,...counted.map(s=>s.w||0)), vol:Math.round(counted.reduce((a,s)=>a+(s.w||0)*(s.r||0),0)) }];
    const sug = suggestion(ex, ns.lastperf);
    nextHints.push(`${e.name}: ${sug.msg}`);
  });
  ns.sessions.push({ tag:routine.tag, title:routine.title, day:`${routine.tag} · ${routine.title}`, date:today, durationSec, totalSets, volume, prs:prs.length });

  const fallback = `Moviste ${Math.round(volume).toLocaleString()} kg en ${totalSets} series. ${prs.length?`Marcaste ${prs.length} posible(s) récord: buena señal de progreso.`:"Sin récords hoy, normal en una sesión de mantenimiento o de acumulación."} Revisa las sugerencias de abajo para la próxima vez.`;

  const summary = { fallback, day:`${routine.tag} · ${routine.title}`, durMin:Math.round(durationSec/60), totalSets, volume, prs, nextHints };
  return { state: ns, summary };
}
