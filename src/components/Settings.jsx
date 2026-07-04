import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { getSubscription, subscribePush, isStandalone } from "../lib/push-client.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Stepper } from "./ui/Stepper.jsx";

const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-sm text-ink outline-none focus:border-amber";

export function Settings({ programName, restSeconds, onChangeProgram, onChangeRest, onReset }){
  const [status, setStatus] = useState(getSubscription() ? "activo" : "inactivo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activar = async () => {
    setBusy(true); setError("");
    try{ await subscribePush(); setStatus("activo"); }
    catch(e){ setError(e.message || "No se pudo activar"); }
    finally{ setBusy(false); }
  };
  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-1">Ajustes</h2>
      <div className="text-mut text-[13px] mb-4">Personaliza tu programa y los avisos de descanso.</div>

      <Card className="p-4 mb-3.5 flex flex-col gap-4">
        <div>
          <label className="text-[11px] font-medium text-mut mb-1 block">Nombre del programa</label>
          <input className={inputCls} value={programName}
            onChange={e => onChangeProgram(e.target.value)} placeholder="Mi entrenamiento" />
          <div className="text-faint text-xs mt-1">Aparece en la cabecera de la app.</div>
        </div>
        <div>
          <label className="text-[11px] font-medium text-mut mb-1 block">Tiempo de descanso entre series</label>
          <div className="flex items-center gap-3">
            <Stepper value={restSeconds} step={15} min={15} suffix="s" onChange={onChangeRest} />
            <span className="text-mut text-sm">{Math.floor(restSeconds/60)}:{String(restSeconds%60).padStart(2,"0")} min</span>
          </div>
        </div>
      </Card>

      <div className="text-mut text-[13px] mb-2 px-1">Aviso de descanso en segundo plano (push), aunque el teléfono esté bloqueado o estés en otra app.</div>
      {!isStandalone() && (
        <Card className="!bg-coral/10 !border-coral/40 p-3.5 mb-3.5 text-[13px] text-ink">
          Para que los avisos funcionen en iPhone, abre esta app desde el ícono en tu pantalla de inicio (Compartir → Agregar a inicio), no desde una pestaña de Safari.
        </Card>
      )}

      <Card className="p-4 mb-3.5">
        <div className="mb-2.5 text-sm">Estado: <span className={cx("font-mono", status==="activo" ? "text-teal" : "text-mut")}>{status}</span></div>
        <button onClick={activar} disabled={busy} className="w-full py-3.5 bg-amber text-white rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-60">
          {busy ? "Activando…" : "Activar avisos en segundo plano"}
        </button>
        {error && <div className="mt-2 text-coral text-[13px]">{error}</div>}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-2.5">Zona de riesgo</div>
        <button onClick={onReset} className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl text-sm cursor-pointer">
          <RotateCcw size={15}/> Reiniciar historial y rutinas
        </button>
        <div className="text-faint text-xs mt-2">Restaura las rutinas y el historial base importado de Hevy, y borra las sesiones y rutinas que creaste en la app.</div>
      </Card>
    </div>
  );
}
