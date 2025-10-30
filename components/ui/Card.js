
export default function Card({ className="", children }){
  return <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-paa-100 ${className}`}>{children}</div>;
}
