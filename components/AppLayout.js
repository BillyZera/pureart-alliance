
// components/AppLayout.js — modern header + sticky layout, Auth always in header
import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
const AuthButtons = dynamic(()=>import("./AuthButtons"), { ssr:false });

export default function AppLayout({ children }){
  const { pathname } = useRouter();
  const nav = [
    { href: "/", label: "Directory" },
    { href: "/about", label: "About" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <div className="min-h-screen" style={{ background:"#f6f7fb", color:"#161827" }}>
      <header style={{ position:"sticky", top:0, zIndex:40, backdropFilter:"blur(8px)", background:"rgba(255,255,255,.85)", borderBottom:"1px solid #ececf3" }}>
        <div style={{ maxWidth: "1100px", margin:"0 auto", padding:"0 16px", height:"64px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link href="/" style={{ fontWeight:800, fontSize:"18px", letterSpacing:"-0.02em", textDecoration:"none", color:"#161827" }}>
            PureArt <span style={{ color:"#5b5bd6" }}>Alliance</span>
          </Link>

          <nav className="hidden md:flex" style={{ display:"flex", gap:"6px", alignItems:"center" }}>
            {nav.map(n => (
              <Link
                key={n.href}
                href={n.href}
                style={{
                  padding:"8px 12px",
                  borderRadius:"12px",
                  textDecoration:"none",
                  color: pathname===n.href ? "#161827" : "#6b6f85",
                  background: pathname===n.href ? "#f0efff" : "transparent"
                }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <AuthButtons />
          </div>
        </div>
      </header>

      <main style={{ maxWidth:"1100px", margin:"0 auto", padding:"24px 16px", display:"grid", gridTemplateColumns:"1fr 320px", gap:"24px" }}>
        <section style={{ minWidth:0 }}>{children}</section>
        <aside className="hidden lg:block" style={{ display:"block" }}>
          <div style={{ position:"sticky", top:"88px", display:"grid", gap:"16px" }}>
            <div style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 1px 2px rgba(0,0,0,.05)" }}>
              <p style={{ margin:0, fontSize:"14px", color:"#6a6f85" }}>
                Help grow a fair creative economy. Submit evidence-based reports, and support verified artists.
              </p>
            </div>
            <div style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 1px 2px rgba(0,0,0,.05)" }}>
              <p style={{ margin:0, fontSize:"14px", color:"#6a6f85" }}>Latest updates soon…</p>
            </div>
          </div>
        </aside>
      </main>

      <footer style={{ borderTop:"1px solid #ececf3", padding:"24px 0", textAlign:"center", fontSize:"14px", color:"#6a6f85" }}>
        © {new Date().getFullYear()} PureArt Alliance
      </footer>
    </div>
  );
}
