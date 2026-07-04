import { cx } from "../../lib/cx.js";

export function Card({ className, children, ...rest }){
  return (
    <div className={cx("rounded-2xl border border-line bg-panel shadow-sm shadow-black/[0.03]", className)} {...rest}>
      {children}
    </div>
  );
}
