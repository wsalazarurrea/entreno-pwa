export function Stepper({ value, onChange, step, min=0, suffix="" }){
  const btn = "w-9 h-10 rounded-lg bg-panel2 text-ink text-lg leading-none cursor-pointer active:scale-90 transition-transform";
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={btn} onClick={()=>onChange(Math.max(min, +(value-step).toFixed(2)))} aria-label="menos">–</button>
      <div className="min-w-[56px] text-center font-mono text-[17px] font-semibold tabular-nums">{value}{suffix}</div>
      <button type="button" className={btn} onClick={()=>onChange(+(value+step).toFixed(2))} aria-label="más">+</button>
    </div>
  );
}
