
import Link from "next/link";
import { useRouter } from "next/router";

export default function AppLayout({ children }){
  const { pathname } = useRouter();
  const nav = [
    { href: "/", label: "Directory" },
    { href: "/about", label: "About" },
    { href: "/admin", label: "Admin" },
  ];
  return (
    <div className="min-h-screen bg-paa-25 text-paa-900">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-paa-100">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-extrabold text-lg tracking-tight">
            PureArt <span className="text-paa-600">Alliance</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className={`px-3 py-1.5 rounded-xl ${pathname===n.href ? "bg-paa-100 text-paa-900" : "text-paa-600 hover:text-paa-900 hover:bg-paa-50"}`}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        <div>{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-paa-100 bg-white p-4">
              <p className="text-sm text-paa-700">
                Help grow a fair creative economy. Submit evidence-based reports, and support verified artists.
              </p>
            </div>
            <div className="rounded-2xl border border-paa-100 bg-white p-4">
              <p className="text-sm text-paa-700">Latest updates soon…</p>
            </div>
          </div>
        </aside>
      </main>
      <footer className="border-t border-paa-100 py-8 text-center text-sm text-paa-600">
        © {new Date().getFullYear()} PureArt Alliance
      </footer>
    </div>
  );
}
