
// components/AuthButtons.js — header-only buttons (no email field here)
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const btn = (variant="primary") => ({
  borderRadius:"10px",
  padding:"8px 12px",
  fontSize:"12px",
  fontWeight:600,
  border: variant==="outline" ? "1px solid #d9dbe8" : "none",
  color: variant==="outline" ? "#161827" : "#fff",
  background: variant==="outline" ? "#fff" : "#5b5bd6",
  cursor:"pointer",
  textDecoration:"none"
});

export default function AuthButtons(){
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { sub.subscription?.unsubscribe?.(); };
  }, []);

  if(!user){
    return <Link href="/login" style={btn("primary")}>Sign in</Link>;
  }

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
      <span style={{ fontSize:"12px", color:"#6a6f85" }}>{user.email}</span>
      <button style={btn("outline")} onClick={async ()=>{ await supabase.auth.signOut(); location.reload(); }}>
        Sign out
      </button>
    </div>
  );
}
