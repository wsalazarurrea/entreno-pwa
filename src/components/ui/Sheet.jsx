import { useEffect } from "react";
import { cx } from "../../lib/cx.js";

function useNoScroll(open){
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

/** Hoja inferior (menús de acciones, selectores). Toca fuera para cerrar. */
export function Sheet({ open, onClose, title, children }){
  useNoScroll(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div className="w-full max-h-[85vh] overflow-y-auto bg-panel rounded-t-2xl pt-2 pb-safe shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mx-auto w-10 h-1 rounded-full bg-line mb-2" />
        {title && <div className="px-4 pb-2 text-[13px] text-mut font-medium truncate">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function SheetItem({ icon: Icon, children, danger, onClick, active }){
  return (
    <button type="button" onClick={onClick}
      className={cx("w-full flex items-center gap-3 px-4 py-3.5 text-left text-[15px] cursor-pointer active:bg-panel2",
        danger ? "text-coral" : active ? "text-amber font-semibold" : "text-ink")}>
      {Icon && <Icon size={18} className="shrink-0" />}
      <span className="flex-1 min-w-0">{children}</span>
    </button>
  );
}

/** Diálogo de confirmación centrado. Los botones van separados y a lo ancho
 * para que confirmar sea siempre un gesto deliberado. */
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", danger, onConfirm, onCancel, children, confirmDisabled }){
  useNoScroll(open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-5" onClick={onCancel}>
      <div className="w-full max-w-sm bg-panel rounded-2xl p-5 shadow-xl" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="text-[17px] font-bold mb-1.5">{title}</div>
        {message && <div className="text-[14px] text-mut leading-relaxed mb-1">{message}</div>}
        {children}
        <div className="flex flex-col gap-2 mt-4">
          <button type="button" onClick={onConfirm} disabled={confirmDisabled}
            className={cx("w-full py-3 rounded-xl font-bold text-white cursor-pointer disabled:opacity-50", danger ? "bg-coral" : "bg-amber")}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className="w-full py-3 rounded-xl font-semibold text-ink bg-panel2 cursor-pointer">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
