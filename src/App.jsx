import { useState, useEffect, useMemo } from "react";
import { loadState, saveState, seedState, migrateState, buildSessionResult } from "./lib/training.js";
import { blankRoutine } from "./data/routines.js";
import { initPush } from "./lib/push-client.js";
import { BottomNav } from "./components/BottomNav.jsx";
import { Train } from "./components/Train.jsx";
import { ActiveSession } from "./components/ActiveSession.jsx";
import { Summary } from "./components/Summary.jsx";
import { History } from "./components/History.jsx";
import { Routines } from "./components/Routines.jsx";
import { RoutineEditor } from "./components/RoutineEditor.jsx";
import { Settings } from "./components/Settings.jsx";

export default function App(){
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("train");
  const [active, setActive] = useState(null); // routine id of the active session
  const [editingRoutine, setEditingRoutine] = useState(null); // routine being edited (full-screen)
  const [summary, setSummary] = useState(null);

  useEffect(()=>{ (async()=>{
    let s = await loadState();
    if(!s){ s = seedState(); await saveState(s); }
    else { const { state:m, changed } = migrateState(s); s = m; if(changed) await saveState(s); }
    setState(s);
  })(); },[]);
  useEffect(()=>{ initPush().catch(()=>{}); },[]);

  const persist = async(ns)=>{ setState(ns); await saveState(ns); };

  const knownExercises = useMemo(()=>{
    if(!state) return [];
    const set = new Set();
    Object.keys(state.history||{}).forEach(n=>set.add(n));
    Object.keys(state.lastperf||{}).forEach(n=>set.add(n));
    (state.routines||[]).forEach(r=>r.ex.forEach(e=>{ if(e.name) set.add(e.name); }));
    return [...set].sort((a,b)=>a.localeCompare(b));
  },[state]);

  const finishSession = async(routine, log, durationSec)=>{
    const { state:ns, summary:sm } = buildSessionResult(routine, log, durationSec, state);
    await persist(ns);
    setSummary(sm);
    setActive(null);
  };

  const saveRoutine = async(routine)=>{
    const { __isNew, ...clean } = routine;
    const exists = (state.routines||[]).some(r=>r.id===clean.id);
    const routines = exists ? state.routines.map(r=>r.id===clean.id?clean:r) : [...(state.routines||[]), clean];
    await persist({ ...state, routines });
    setEditingRoutine(null);
  };
  const deleteRoutine = async(id)=>{
    await persist({ ...state, routines:(state.routines||[]).filter(r=>r.id!==id) });
    setEditingRoutine(null);
  };

  const resetHistory = async () => {
    if (!confirm("¿Reiniciar todo? Se restauran las rutinas y el historial base, y se borran las sesiones y rutinas que creaste aquí.")) return;
    await persist(seedState());
  };

  if (!state) return <div className="bg-bg text-mut min-h-screen grid place-items-center">Cargando tu historial…</div>;

  const activeRoutine = active ? (state.routines || []).find(r => r.id === active) : null;

  return (
    <div className="bg-bg text-ink min-h-screen">
      {summary ? (
        <Summary data={summary} onClose={()=>{ setSummary(null); setTab("history"); }} />
      ) : activeRoutine ? (
        <ActiveSession
          routine={activeRoutine}
          state={state}
          restSeconds={state.restSeconds}
          onFinish={(log,dur)=>finishSession(activeRoutine, log, dur)}
          onCancel={()=>setActive(null)}
        />
      ) : editingRoutine ? (
        <RoutineEditor
          routine={editingRoutine}
          knownExercises={knownExercises}
          onSave={saveRoutine}
          onCancel={()=>setEditingRoutine(null)}
          onDelete={editingRoutine.__isNew ? undefined : deleteRoutine}
        />
      ) : (
        <>
          <div className="px-4 pt-5 pb-1">
            <div className="font-mono text-xs tracking-[2px] text-amber uppercase truncate">{state.programName}</div>
            <h1 className="text-2xl font-extrabold mt-0.5 tracking-tight">Entrenamiento</h1>
          </div>

          {tab==="train" && <Train state={state} routines={state.routines} onSelect={setActive} onGoToRoutines={()=>setTab("routines")} />}
          {tab==="history" && <History state={state} />}
          {tab==="routines" && (
            <Routines
              routines={state.routines}
              onNew={()=>setEditingRoutine({ ...blankRoutine(), __isNew:true })}
              onEdit={(r)=>setEditingRoutine(r)}
              onChange={(routines)=>persist({ ...state, routines })}
            />
          )}
          {tab==="settings" && (
            <Settings
              programName={state.programName}
              restSeconds={state.restSeconds}
              onChangeProgram={(programName)=>persist({ ...state, programName })}
              onChangeRest={(restSeconds)=>persist({ ...state, restSeconds })}
              onReset={resetHistory}
            />
          )}

          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}
    </div>
  );
}
