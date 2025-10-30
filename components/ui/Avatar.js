
export default function Avatar({ src, name, size=36 }){
  const initials = (name||"").split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase() || "U";
  return (
    <div className="inline-flex items-center">
      {src ? (
        <img alt={name} src={src} width={size} height={size} className="rounded-full object-cover" />
      ) : (
        <div style={{width:size,height:size}} className="rounded-full bg-paa-200 text-paa-700 grid place-items-center text-xs font-bold">{initials}</div>
      )}
    </div>
  );
}
