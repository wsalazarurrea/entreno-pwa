import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronUp } from "lucide-react";
import {
  loadState, saveState, seedState, migrateState, loadActive, saveActive, clearActive, loadTimerRun, saveTimerRun, clearTimerRun,
  sessionFromRoutine, sessionFromWorkout, emptySession, commitSession,
} from "./lib/training.js";
import { mergeHevyImport } from "./lib/hevyImport.js";
import { buildCatalog } from "./data/exercises.js";
import { blankRoutine } from "./data/routines.js";
import { formatClock, localDate } from "./lib/dates.js";
import { startRun, buildPhases, phaseAt, elapsedMs, workedSec, timerSummary } from "./lib/intervals.js";
import { sortWorkouts } from "./lib/workouts.js";
import { newId } from "./data/routines.js";
import { Intervals } from "./components/Intervals.jsx";
import { IntervalRunner } from "./components/IntervalRunner.jsx";
import { initPush, scheduleRest } from "./lib/push-client.js";
import { isNative, initNative, syncRestNotification, saveWorkoutToHealth, sendWorkoutViaShortcut, onShortcutReturn, scheduleTimerNotifications, cancelTimerNotifications } from "./lib/native.js";
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
  const [timerRun, setTimerRun] = useState(null);         // temporizador de intervalos en curso
  const [timerEditing, setTimerEditing] = useState(false);

  useEffect(()=>{ (async()=>{
    let s = await loadState();
    if(!s){ s = seedState(); await saveState(s); }
    else { const { state:m, changed } = migrateState(s); s = m; if(changed) await saveState(s); }
    const a = await loadActive();
    setState(s);
    if(a){ setSession(a); setMinimized(false); }
    const tr = await loadTimerRun();
    if(tr) setTimerRun(tr);
  })(); },[]);
  useEffect(()=>{ if(isNative) initNative(); else initPush().catch(()=>{}); },[]);
  // App nativa: el aviso de descanso es local y se reprograma con cada cambio (−15/+15/Omitir).
  const liveRestEnd = session?.mode === "live" ? session.restEnd : null;
  useEffect(()=>{ if(isNative) syncRestNotification(liveRestEnd, session?.restLabel); },[liveRestEnd, session?.restLabel]);
  // Cada cambio del entrenamiento en curso se guarda al instante (sobrevive a que iOS cierre la app).
  useEffect(()=>{ if(session) saveActive(session); },[session]);

  // Intervalos: se guarda en cada cambio y, en la app nativa, se programa un aviso por fase.
  useEffect(()=>{ if(timerRun) saveTimerRun(timerRun); },[timerRun]);
  useEffect(()=>{
    if(!isNative) return;
    if(!timerRun || timerRun.pausedAt){ cancelTimerNotifications(); return; }
    const phases = buildPhases(timerRun.timer);
    const ms = elapsedMs(timerRun);
    if(phaseAt(phases, ms).done){ cancelTimerNotifications(); return; }
    scheduleTimerNotifications(phases, ms, timerRun.timer.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[timerRun?.id, timerRun?.pausedAt, timerRun?.offsetMs]);

  // PWA — aviso de descanso en segundo plano: se programa al salir de la app (bloquear el teléfono o
  // cambiar de app), con el tiempo que quede en ese momento. Con la app abierta suena el
  // temporizador propio, así que no hace falta push. Si vuelves y cambias el descanso, al salir
  // de nuevo se programa otro (el anterior llega como aviso neutro, ver public/sw.js).
  const stateRef = useRef(null);
  useEffect(()=>{ stateRef.current = state; },[state]);
  const sessionRef = useRef(null);
  const pushedForRef = useRef(null);
  useEffect(()=>{ sessionRef.current = session; },[session]);
  useEffect(()=>{
    const onHide = (e) => {
      if(isNative) return; // la app nativa usa avisos locales (efecto de arriba)
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
    const { state: ns, summary: sm, workout } = commitSession(session, state, { updateRoutine });
    await persist(ns);
    const wasEdit = session.mode === "edit";
    endSession();
    if(wasEdit) setTab("history");
    else {
      const base = { ...sm, workoutId: workout.id };
      setSummary(base);
      if(isNative && ns.healthSync){
        setSummary({ ...base, health: { pending: true } });
        // Pequeña pausa para que se vea el resumen antes de saltar a Atajos.
        await new Promise(r => setTimeout(r, 600));
        const res = await sendToHealth(workout, ns);
        setSummary(x => x && x.workoutId === workout.id && x.health?.pending ? { ...x, health: res } : x);
      }
    }
    window.scrollTo(0, 0);
  };

  const markInHealth = (id, how) => setState(s => {
    const ns = { ...s, workouts: s.workouts.map(x => x.id === id ? { ...x, healthUuid: how } : x) };
    saveState(ns);
    return ns;
  });

  /** Guarda un entrenamiento en Apple Salud. Con "atajo" (instalación gratuita) abre Atajos y el
   * resultado llega después por onShortcutReturn; con "directo" usa HealthKit. Devuelve
   * { ok } | { error } | { pending: true }. */
  const sendToHealth = async (w, base = state) => {
    try{
      if((base.healthMode || "atajo") === "atajo"){
        await sendWorkoutViaShortcut(w, base.shortcutName);
        return { pending: true, via: "atajo" };
      }
      const uuid = await saveWorkoutToHealth(w, base.bodyKg);
      markInHealth(w.id, uuid || true);
      return { ok: true };
    }catch(e){
      const msg = e?.message || "No se pudo guardar en Salud";
      return { error: /healthkit entitlement/i.test(msg)
        ? "Esta instalación (firma gratuita) no permite escribir en Salud directamente. En Ajustes → Apple Salud elige «Atajo de iOS»."
        : msg };
    }
  };

  // Vuelta desde Atajos (entreno://salud?ok|error|cancel&id=…)
  const [notice, setNotice] = useState(null);
  useEffect(()=> onShortcutReturn(({ id, status }) => {
    const name = stateRef.current?.shortcutName || "Entreno a Salud";
    const health = status === "ok" ? { ok: true }
      : status === "cancel" ? { error: "Cancelaste el atajo; no se guardó en Salud." }
      : { error: `El atajo «${name}» falló o no existe en la app Atajos.` };
    if(status === "ok" && id) markInHealth(id, "atajo");
    setSummary(x => x && x.workoutId === id ? { ...x, health } : x);
    setNotice(health.ok ? "❤️ Guardado en Apple Salud" : health.error);
    setTimeout(() => setNotice(null), 5000);
  }), []);
  /* ---- Intervalos ---- */
  const startTimer = (t) => { setTimerRun(startRun(t)); window.scrollTo(0, 0); };
  /** Guarda en el historial lo hecho con el temporizador (una sola vez por ejecución). */
  const saveTimerWorkout = (run) => {
    if(run.saved) return null;
    const phases = buildPhases(run.timer);
    const done = phaseAt(phases, elapsedMs(run)).done;
    const w = {
      id: newId("w"), source: "app", kind: "intervals", date: localDate(new Date(run.startedAt)), startedAt: run.startedAt,
      durationSec: workedSec(run), title: run.timer.name || "Intervalos", tag: "INT", accent: "violet", exercises: [], prs: [],
      intervals: { summary: timerSummary(run.timer), completed: done, timer: run.timer },
    };
    setState(s => { const ns = { ...s, workouts: sortWorkouts([...s.workouts, w]) }; saveState(ns); return ns; });
    setTimerRun(r => r && r.id === run.id ? { ...r, saved: w.id } : r);
    if(isNative && state.healthSync) sendToHealth(w);
    return w;
  };
  const stopTimer = (mode) => {
    if(mode === "save" && timerRun && workedSec(timerRun) >= 10) saveTimerWorkout(timerRun);
    setTimerRun(null); clearTimerRun(); cancelTimerNotifications();
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
          {!timerEditing && <div className="px-4 pt-5 pb-1">
            <div className="font-mono text-xs tracking-[2px] text-amber uppercase truncate">{state.programName}</div>
            <h1 className="text-2xl font-extrabold mt-0.5 tracking-tight">
              {{ train:"Entrenar", intervals:"Intervalos", history:"Historial", routines:"Rutinas", settings:"Ajustes" }[tab]}
            </h1>
          </div>}

          {tab==="train" && (
            <Train state={state} routines={state.routines}
              onSelect={(id)=>start(sessionFromRoutine(state.routines.find(r=>r.id===id), state))}
              onStartEmpty={()=>start(emptySession())}
              onGoToRoutines={()=>setTab("routines")} />
          )}
          {tab==="history" && (
            <History state={state} catalog={catalog} onSendToHealth={isNative ? sendToHealth : null}
              onEdit={(w)=>start(sessionFromWorkout(w, state, "edit"))}
              onRepeat={(w)=> w.kind === "intervals" ? startTimer(w.intervals.timer) : start(sessionFromWorkout(w, state, "live"))}
              onDelete={(id)=>persist({ ...state, workouts: state.workouts.filter(w=>w.id!==id) })} />
          )}
          {tab==="intervals" && (
            <Intervals timers={state.timers} onStart={startTimer} onEditing={setTimerEditing}
              onChange={(timers)=>persist({ ...state, timers })} />
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
              onChangeHealth={(patch)=>persist({ ...state, ...patch })}
              onImportHevy={(ws)=>persist(mergeHevyImport(state, ws))}
              onRestore={(data)=>persist(migrateState(data).state)}
              onReset={()=>persist(seedState())}
            />
          )}

          {session && session.mode === "live" && !timerEditing && <ResumeBar session={session} onOpen={()=>{ setMinimized(false); window.scrollTo(0, 0); }} />}
          {!timerEditing && <BottomNav tab={tab} onChange={(t)=>{ setTab(t); window.scrollTo(0, 0); }} />}
        </>
      )}

      {timerRun && (
        <IntervalRunner key={timerRun.id} run={timerRun}
          onChange={(fn)=>setTimerRun(r => r ? fn(r) : r)}
          onFinish={()=>saveTimerWorkout(timerRun)}
          onStop={stopTimer} />
      )}

      {notice && (
        <div className="fixed left-4 right-4 z-50 bg-ink text-white text-[14px] rounded-xl px-4 py-3 shadow-lg" style={{ top: "calc(var(--sat) + 10px)" }} onClick={() => setNotice(null)}>
          {notice}
        </div>
      )}

      <ConfirmDialog open={!!pendingStart} title="Ya tienes un entrenamiento en curso"
        message={session ? `«${session.title}» sigue abierto. ¿Lo descartas para empezar este?` : ""}
        confirmLabel="Descartar el actual y empezar" danger cancelLabel="Volver al actual"
        onCancel={()=>{ setPendingStart(null); setMinimized(false); }}
        onConfirm={()=>{ const n = pendingStart; setPendingStart(null); clearActive(); setSession(n); setMinimized(false); window.scrollTo(0, 0); }} />
    </div>
  );
}
