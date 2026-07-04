import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { getSubscription, subscribePush, isStandalone } from "../lib/push-client.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";

export function Settings({ onReset }){
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
      <div className="text-mut text-[13px] mb-4">Aviso de descanso en segundo plano (push), aunque el teléfono esté bloqueado o estés en otra app.</div>

      {!isStandalone() && (
        <Card className="!bg-coral/10 !border-coral/40 p-3.5 mb-3.5 text-[13px] text-ink">
          Para que los avisos funcionen en iPhone, abre esta app desde el ícono en tu pantalla de inicio (Compartir → Agregar a inicio), no desde una pestaña de Safari.
        </Card>
      )}

      <Card className="p-4 mb-3.5">
        <div className="mb-2.5 text-sm">Estado: <span className={cx("font-mono", status==="activo" ? "text-teal" : "text-mut")}>{status}</span></div>
        <button onClick={activar} disabled={busy} className="w-full py-3.5 bg-amber text-[#181818] rounded-xl text-[15px] font-bold cursor-pointer disabled:opacity-60">
          {busy ? "Activando…" : "Activar avisos en segundo plano"}
        </button>
        {error && <div className="mt-2 text-coral text-[13px]">{error}</div>}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-2.5">Zona de riesgo</div>
        <button onClick={onReset} className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl text-sm cursor-pointer">
          <RotateCcw size={15}/> Reiniciar historial de la app
        </button>
        <div className="text-faint text-xs mt-2">Borra las sesiones que registraste en la app y restaura el historial base importado de Hevy.</div>
      </Card>
    </div>
  );
}
