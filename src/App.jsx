import { useState, useEffect } from "react";
import { loadState, saveState, seedState, buildSessionResult } from "./lib/training.js";
import { initPush } from "./lib/push-client.js";
import { ROUTINES } from "./data/routines.js";
import { BottomNav } from "./components/BottomNav.jsx";
import { Train } from "./components/Train.jsx";
import { ActiveSession } from "./components/ActiveSession.jsx";
import { Summary } from "./components/Summary.jsx";
import { History } from "./components/History.jsx";
import { Routines } from "./components/Routines.jsx";
import { Settings } from "./components/Settings.jsx";

export default function App(){
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("train");
  const [active, setActive] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(()=>{ (async()=>{ let s=await loadState(); if(!s){ s=seedState(); await saveState(s); } setState(s); })(); },[]);
  useEffect(()=>{ initPush().catch(()=>{}); },[]);

  const persist = async(ns)=>{ setState(ns); await saveState(ns); };

  const finishSession = async(routine, log, durationSec)=>{
    const { state:ns, summary:sm } = buildSessionResult(routine, log, durationSec, state);
    await persist(ns);
    setSummary(sm);
    setActive(null);
  };

  const resetHistory = async () => {
    if (!confirm("¿Reiniciar todo y recargar tu historial base? Se borran las sesiones registradas aquí.")) return;
    await persist(seedState());
  };

  if (!state) return <div className="bg-bg text-mut min-h-screen grid place-items-center">Cargando tu historial…</div>;

  return (
    <div className="bg-bg text-ink min-h-screen">
      {summary ? (
        <Summary data={summary} onClose={()=>{ setSummary(null); setTab("history"); }} />
      ) : active ? (
        <ActiveSession
          routine={ROUTINES[active]}
          state={state}
          onFinish={(log,dur)=>finishSession(ROUTINES[active], log, dur)}
          onCancel={()=>setActive(null)}
        />
      ) : (
        <>
          <div className="px-4 pt-5 pb-1">
            <div className="font-mono text-xs tracking-[2px] text-amber">ASISTENTE · BLOQUE PECHO</div>
            <h1 className="text-2xl font-extrabold mt-0.5 tracking-tight">Entrenamiento</h1>
          </div>

          {tab==="train" && <Train state={state} onSelect={setActive} />}
          {tab==="history" && <History state={state} />}
          {tab==="routines" && <Routines />}
          {tab==="settings" && <Settings onReset={resetHistory} />}

          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}
    </div>
  );
}
