import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Check, Plus, Minus } from "lucide-react";
import { suggestion, incFor } from "../lib/training.js";
import { scheduleRest } from "../lib/push-client.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Tag } from "./ui/Tag.jsx";
import { Stepper } from "./ui/Stepper.jsx";
import { ACCENT } from "./ui/accent.js";

export function ActiveSession({ routine, state, restSeconds = 120, onFinish, onCancel }){
  const REST_SECONDS = restSeconds;
  const a = ACCENT[routine.accent] || ACCENT.violet;
  const [log, setLog] = useState(()=> routine.ex.map(ex=>{
    const s = suggestion(ex, state.lastperf);
    return { name:ex.name, sug:s, sets: Array.from({length:ex.sets},()=>({w:s.w, r:ex.hi, done:false})) };
  }));
  const [start] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [restEnd, setRestEnd] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null), signaledRef = useRef(false), wakeRef = useRef(null);
  const elapsed = Math.floor((now-start)/1000);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd-now)/1000)) : null;

  function ensureAudio(){ try{ if(!audioRef.current){ const AC=window.AudioContext||window.webkitAudioContext; audioRef.current=new AC(); } if(audioRef.current.state==="suspended") audioRef.current.resume(); }catch(e){} }
  function beep(){ if(soundOn){ try{ const ctx=audioRef.current; if(ctx){ const t0=ctx.currentTime; [0,0.28,0.56].forEach((off,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.value=660+i*220; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001,t0+off); g.gain.exponentialRampToValueAtTime(0.5,t0+off+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+off+0.22); o.start(t0+off); o.stop(t0+off+0.24); }); } }catch(e){} } try{ if(navigator.vibrate) navigator.vibrate([200,100,200]); }catch(e){} }
  async function acquireWake(){ try{ if("wakeLock" in navigator){ wakeRef.current=await navigator.wakeLock.request("screen"); } }catch(e){} }
  const startRest=()=>{ ensureAudio(); signaledRef.current=false; setRestEnd(Date.now()+REST_SECONDS*1000); scheduleRest(REST_SECONDS); };

  useEffect(()=>{ const t=setInterval(()=>setNow(Date.now()),400); return ()=>clearInterval(t); },[]);
  useEffect(()=>{ acquireWake(); const onVis=()=>{ if(document.visibilityState==="visible"){ acquireWake(); setNow(Date.now()); try{ if(audioRef.current&&audioRef.current.state==="suspended") audioRef.current.resume(); }catch(e){} } }; document.addEventListener("visibilitychange",onVis); return ()=>{ document.removeEventListener("visibilitychange",onVis); try{ if(wakeRef.current){ wakeRef.current.release(); wakeRef.current=null; } }catch(e){} }; },[]);
  useEffect(()=>{ if(restEnd && restLeft===0 && !signaledRef.current){ signaledRef.current=true; beep(); } },[restEnd,restLeft]);

  const upd=(ei,si,field,val)=>setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:e.sets.map((s,j)=> j!==si? s : {...s,[field]:val})}));
  const toggle=(ei,si)=>{ const wasDone=log[ei].sets[si].done; setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:e.sets.map((s,j)=> j!==si? s : {...s,done:!s.done})})); ensureAudio(); if(!wasDone) startRest(); };
  const addSet=(ei)=>setLog(L=>L.map((e,i)=> i!==ei? e : {...e, sets:[...e.sets, {...e.sets[e.sets.length-1], done:false}]}));

  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  const doneCount = log.reduce((acc,e)=>acc+e.sets.filter(s=>s.done).length,0);
  const totalCount = log.reduce((acc,e)=>acc+e.sets.length,0);

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-10 bg-bg border-b border-line px-4 py-3.5 flex items-center justify-between">
        <div>
          <div className="flex gap-2 items-center">
            <Tag accent={routine.accent}>{routine.tag}</Tag>
            <span className="font-semibold">{routine.title}</span>
          </div>
          <div className="text-mut text-xs mt-1 font-mono">{fmt(elapsed)} · {doneCount}/{totalCount} series</div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={()=>{ensureAudio();setSoundOn(s=>!s);}} title="Sonido"
            className={cx("border border-line rounded-lg px-2.5 py-2 cursor-pointer", soundOn?"text-amber":"text-faint")}>
            {soundOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}
          </button>
          {restLeft!=null && (restLeft>0
            ? <button onClick={()=>setRestEnd(s=>Math.max(Date.now(),(s||Date.now()))+30000)}
                className="bg-amber text-white rounded-lg px-3 py-2 font-bold font-mono cursor-pointer" title="Toca para +30s">⏱ {fmt(restLeft)}</button>
            : <button onClick={()=>{beep();setRestEnd(null);}}
                className="bg-teal text-white rounded-lg px-3 py-2 font-bold font-mono cursor-pointer flex items-center gap-1"><Check size={16}/> ¡Listo!</button>)}
          <button onClick={onCancel} className="text-mut border border-line rounded-lg px-2.5 py-2 cursor-pointer text-sm">Salir</button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        {log.map((e,ei)=>{
          const ex = routine.ex[ei];
          const prev = state.lastperf[e.name];
          const sugColor = e.sug.kind==="up" ? "text-teal" : e.sug.kind==="hold" ? "text-amber" : "text-mut";
          const sugBorder = e.sug.kind==="up" ? "border-teal/40 bg-teal/10" : e.sug.kind==="hold" ? "border-amber/40 bg-amber/10" : "border-line bg-panel2";
          return (
            <Card key={ei} className="overflow-hidden">
              <div className="px-3.5 py-3 border-b border-line">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-semibold text-[15px]">{e.name}</span>
                  <span className="font-mono text-xs text-mut whitespace-nowrap">{ex.sets}×{ex.lo}-{ex.hi}</span>
                </div>
                <div className="mt-2 flex gap-2 items-center flex-wrap">
                  <span className={cx("text-xs rounded-md border px-2 py-1", sugColor, sugBorder)}>▸ {e.sug.msg}</span>
                  {prev && <span className="text-xs text-faint font-mono">ant: {prev.sets.filter(s=>s.w!=null).map(s=>`${s.w}×${s.r}`).join(" ")||"—"}</span>}
                </div>
                {ex.note && <div className="mt-1.5 text-xs text-faint italic">{ex.note}</div>}
              </div>
              <div className="px-2 py-1.5">
                <div className="grid grid-cols-[28px_1fr_1fr_44px] gap-1.5 px-1.5 py-1 text-faint text-[11px] font-mono tracking-wide">
                  <span>#</span><span className="text-center">{ex.unit==="bw"?"lastre":"peso kg"}</span><span className="text-center">reps</span><span></span>
                </div>
                {e.sets.map((s,si)=>{
                  const hitTop=(s.r||0)>=ex.hi, below=(s.r||0)<ex.lo;
                  const repColor = s.done ? (hitTop?"text-teal":below?"text-coral":"text-ink") : "text-ink";
                  return (
                    <div key={si} className={cx("grid grid-cols-[28px_1fr_1fr_44px] gap-1.5 items-center px-1.5 py-1 rounded-lg", s.done && a.bgSoft)}>
                      <span className="font-mono text-faint text-[13px]">{si+1}</span>
                      <div className="flex justify-center">
                        <Stepper value={s.w} step={ex.unit==="bw"?1:(incFor(ex)||2.5)} onChange={v=>upd(ei,si,"w",v)} />
                      </div>
                      <div className="flex justify-center">
                        <div className="flex items-center gap-1.5">
                          <button onClick={()=>upd(ei,si,"r",Math.max(0,(s.r||0)-1))} className="w-9 h-10 rounded-lg bg-panel2 text-ink text-lg cursor-pointer"><Minus size={16} className="mx-auto"/></button>
                          <div className={cx("min-w-[32px] text-center font-mono font-semibold text-[17px] tabular-nums", repColor)}>{s.r}</div>
                          <button onClick={()=>upd(ei,si,"r",(s.r||0)+1)} className="w-9 h-10 rounded-lg bg-panel2 text-ink text-lg cursor-pointer"><Plus size={16} className="mx-auto"/></button>
                        </div>
                      </div>
                      <button onClick={()=>toggle(ei,si)} aria-label="completar"
                        className={cx("w-[38px] h-[38px] rounded-[10px] border-[1.5px] cursor-pointer justify-self-center flex items-center justify-center",
                          s.done ? cx(a.bg, "border-transparent text-white") : "border-line text-faint")}>
                        <Check size={18}/>
                      </button>
                    </div>
                  );
                })}
                <button onClick={()=>addSet(ei)} className="w-full mt-1 py-1.5 border border-dashed border-line text-mut rounded-lg cursor-pointer text-[13px]">+ serie</button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4" style={{ background:"linear-gradient(180deg, transparent, var(--color-bg) 30%)" }}>
        <button onClick={()=>onFinish(log, Math.floor((Date.now()-start)/1000))}
          className={cx("w-full py-3.5 rounded-2xl text-[16px] font-bold cursor-pointer shadow-lg text-white", a.bg)}>
          Finalizar y analizar
        </button>
      </div>
    </div>
  );
}
