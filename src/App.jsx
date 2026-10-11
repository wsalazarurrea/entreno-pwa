import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronUp } from "lucide-react";
import {
  loadState, saveState, seedState, migrateState, loadActive, saveActive, clearActive,
  sessionFromRoutine, sessionFromWorkout, emptySession, commitSession,
} from "./lib/training.js";
import { mergeHevyImport } from "./lib/hevyImport.js";
import { buildCatalog } from "./data/exercises.js";
import { blankRoutine } from "./data/routines.js";
import { formatClock } from "./lib/dates.js";
import { initPush, scheduleRest } from "./lib/push-client.js";
import { BottomNav } from "./components/BottomNav.jsx";
import { Train } from "./components/Train.jsx";
import { WorkoutLogger } from "./components/WorkoutLogger.jsx";
import { Summary } from "./components/Summary.jsx";
import { History } from "./components/History.jsx";
import { Routines } from "./components/Routines.jsx";
import { RoutineEditor } from "./components/RoutineEditor.jsx";
import { Settings } from "./components/Settings.jsx";
import { ConfirmDialog } from "./components/ui/Sheet.jsx";

/** Barra "entrenamiento en curso" sobre la navegación cuando se minimiza. */
function ResumeBar({ session, onOpen }){
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const done = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  return (
    <button type="button" onClick={onOpen}
      className="fixed left-3 right-3 z-20 bg-ink text-white rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-lg cursor-pointer"
      style={{ bottom: "calc(var(--sab) + 70px)" }}>
      <div className="min-w-0 text-left">
        <div className="text-[13px] font-bold truncate">{session.title}</div>
        <div className="text-[12px] text-white/70 font-mono">{formatClock((now - session.startedAt) / 1000)} · {done} {done === 1 ? "serie" : "series"}</div>
      </div>
      <span className="flex items-center gap-1 text-[13px] font-bold text-amber shrink-0">Reanudar <ChevronUp size={16} /></span>
    </button>
  );
}

export default function App(){
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("train");
  const [session, setSession] = useState(null);   // entrenamiento en curso o en edición
  const [minimized, setMinimized] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pendingStart, setPendingStart] = useState(null); // sesión a iniciar si ya hay una en curso

  useEffect(()=>{ (async()=>{
    let s = await loadState();
    if(!s){ s = seedState(); await saveState(s); }
    else { const { state:m, changed } = migrateState(s); s = m; if(changed) await saveState(s); }
    const a = await loadActive();
    setState(s);
    if(a){ setSession(a); setMinimized(false); }
  })(); },[]);
  useEffect(()=>{ initPush().catch(()=>{}); },[]);
  // Cada cambio del entrenamiento en curso se guarda al instante (sobrevive a que iOS cierre la app).
  useEffect(()=>{ if(session) saveActive(session); },[session]);

  // Aviso de descanso en segundo plano: se programa al salir de la app (bloquear el teléfono o
  // cambiar de app), con el tiempo que quede en ese momento. Con la app abierta suena el
  // temporizador propio, así que no hace falta push. Si vuelves y cambias el descanso, al salir
  // de nuevo se programa otro (el anterior llega como aviso neutro, ver public/sw.js).
  const sessionRef = useRef(null);
  const pushedForRef = useRef(null);
  useEffect(()=>{ sessionRef.current = session; },[session]);
  useEffect(()=>{
    const onHide = (e) => {
      if(e.type === "visibilitychange" && document.visibilityState !== "hidden") return;
      const s = sessionRef.current;
      if(!s || s.mode !== "live" || !s.restEnd) return;
      const left = Math.round((s.restEnd - Date.now()) / 1000);
      if(left < 2 || pushedForRef.current === s.restEnd || s.pushedFor === s.restEnd) return;
      pushedForRef.current = s.restEnd;
      scheduleRest(left, { title: "Descanso terminado", body: "¡A la siguiente serie! 💪", label: s.restLabel }, { keepalive: true, scheduledFor: s.restEnd });
      setSession(x => x && x.restEnd === s.restEnd ? { ...x, pushedFor: s.restEnd } : x);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("pagehide", onHide); };
  },[]);

  const persist = async(ns)=>{ setState(ns); await saveState(ns); };

  const knownNames = useMemo(()=>{
    if(!state) return [];
    const set = new Set();
    state.workouts.forEach(w => w.exercises.forEach(e => set.add(e.name)));
    state.routines.forEach(r => r.ex.forEach(e => { if(e.name) set.add(e.name); }));
    return [...set];
  },[state]);
  const catalog = useMemo(()=> state ? buildCatalog(state.customExercises, knownNames) : [], [state, knownNames]);
  const recent = useMemo(()=>{
    if(!state) return [];
    const out = [];
    for(const w of state.workouts){ for(const e of w.exercises){ if(!out.includes(e.name)) out.push(e.name); } if(out.length >= 12) break; }
    return out;
  },[state]);
  const createCustom = (ex) => setState(s => {
    if(s.customExercises.some(c => c.name.toLowerCase() === ex.name.toLowerCase())) return s;
    const ns = { ...s, customExercises: [...s.customExercises, ex] };
    saveState(ns);
    return ns;
  });

  const start = (newSession) => {
    if(session){ setPendingStart(newSession); return; }
    setSession(newSession); setMinimized(false); window.scrollTo(0, 0);
  };
  const endSession = () => { setSession(null); setMinimized(false); clearActive(); };

  const finish = async ({ updateRoutine }) => {
    const { state: ns, summary: sm } = commitSession(session, state, { updateRoutine });
    await persist(ns);
    const wasEdit = session.mode === "edit";
    endSession();
    if(wasEdit) setTab("history"); else setSummary(sm);
    window.scrollTo(0, 0);
  };
  const discard = () => { const wasEdit = session?.mode === "edit"; endSession(); if(wasEdit) setTab("history"); };

  const saveRoutine = async(routine)=>{
    const { __isNew, ...clean } = routine;
    const exists = state.routines.some(r=>r.id===clean.id);
    const routines = exists ? state.routines.map(r=>r.id===clean.id?clean:r) : [...state.routines, clean];
    await persist({ ...state, routines });
    setEditingRoutine(null);
  };
  const deleteRoutine = async(id)=>{
    await persist({ ...state, routines: state.routines.filter(r=>r.id!==id) });
    setEditingRoutine(null);
  };

  if (!state) return <div className="bg-bg text-mut min-h-screen grid place-items-center">Cargando tu historial…</div>;

  const pickerProps = { catalog, recent, onCreateCustom: createCustom };

  return (
    <div className="bg-bg text-ink min-h-screen">
      {summary ? (
        <Summary data={summary} onClose={()=>{ setSummary(null); setTab("history"); }} />
      ) : session && !minimized ? (
        <WorkoutLogger
          key={session.id}
          session={session}
          state={state}
          {...pickerProps}
          onChange={(fn)=>setSession(s => s ? fn(s) : s)}
          onMinimize={()=>setMinimized(true)}
          onFinish={finish}
          onDiscard={discard}
        />
      ) : editingRoutine ? (
        <RoutineEditor
          routine={editingRoutine}
          {...pickerProps}
          customExercises={state.customExercises}
          restDefault={state.restSeconds}
          onSave={saveRoutine}
          onCancel={()=>setEditingRoutine(null)}
          onDelete={editingRoutine.__isNew ? undefined : deleteRoutine}
        />
      ) : (
        <>
          <div className="px-4 pt-5 pb-1">
            <div className="font-mono text-xs tracking-[2px] text-amber uppercase truncate">{state.programName}</div>
            <h1 className="text-2xl font-extrabold mt-0.5 tracking-tight">
              {{ train:"Entrenar", history:"Historial", routines:"Rutinas", settings:"Ajustes" }[tab]}
            </h1>
          </div>

          {tab==="train" && (
            <Train state={state} routines={state.routines}
              onSelect={(id)=>start(sessionFromRoutine(state.routines.find(r=>r.id===id), state))}
              onStartEmpty={()=>start(emptySession())}
              onGoToRoutines={()=>setTab("routines")} />
          )}
          {tab==="history" && (
            <History state={state} catalog={catalog}
              onEdit={(w)=>start(sessionFromWorkout(w, state, "edit"))}
              onRepeat={(w)=>start(sessionFromWorkout(w, state, "live"))}
              onDelete={(id)=>persist({ ...state, workouts: state.workouts.filter(w=>w.id!==id) })} />
          )}
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
              state={state}
              onChangeProgram={(programName)=>persist({ ...state, programName })}
              onChangeRest={(restSeconds)=>persist({ ...state, restSeconds })}
              onImportHevy={(ws)=>persist(mergeHevyImport(state, ws))}
              onRestore={(data)=>persist(migrateState(data).state)}
              onReset={()=>persist(seedState())}
            />
          )}

          {session && session.mode === "live" && <ResumeBar session={session} onOpen={()=>{ setMinimized(false); window.scrollTo(0, 0); }} />}
          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}

      <ConfirmDialog open={!!pendingStart} title="Ya tienes un entrenamiento en curso"
        message={session ? `«${session.title}» sigue abierto. ¿Lo descartas para empezar este?` : ""}
        confirmLabel="Descartar el actual y empezar" danger cancelLabel="Volver al actual"
        onCancel={()=>{ setPendingStart(null); setMinimized(false); }}
        onConfirm={()=>{ const n = pendingStart; setPendingStart(null); clearActive(); setSession(n); setMinimized(false); window.scrollTo(0, 0); }} />
    </div>
  );
}
