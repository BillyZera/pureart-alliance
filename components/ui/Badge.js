
import clsx from "clsx";
export default function Badge({ children, color="slate", className="" }){
  const map = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-green-100 text-green-700 ring-green-200",
    red: "bg-red-100 text-red-700 ring-red-200",
    amber: "bg-amber-100 text-amber-800 ring-amber-200",
    blue: "bg-blue-100 text-blue-700 ring-blue-200",
    violet: "bg-violet-100 text-violet-700 ring-violet-200",
  };
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1", map[color], className)}>{children}</span>;
}
