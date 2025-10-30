
import Link from "next/link";
export default function AdminLayout({ children, active="dashboard" }){
  const items = [
    { key:"dashboard", href:"/admin", label:"Dashboard" },
    { key:"accusations", href:"/admin/accusations", label:"Accusations" },
  ];
  return (
    <div className="min-h-screen bg-paa-25">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-paa-100">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="font-extrabold">PureArt <span className="text-paa-600">Admin</span></div>
          <Link href="/" className="text-sm text-paa-600 hover:text-paa-900">Back to site</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-[220px,1fr] gap-6">
        <aside className="space-y-2">
          {items.map(i => (
            <Link key={i.key} href={i.href} className={`block rounded-xl px-3 py-2 text-sm ${active===i.key ? "bg-paa-100 text-paa-900" : "text-paa-700 hover:bg-paa-50"}`}>
              {i.label}
            </Link>
          ))}
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
