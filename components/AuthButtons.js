
// components/AuthButtons.js — always in header; magic-link auth; sign-out button
"use client";

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
  cursor:"pointer"
});

export default function AuthButtons(){
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => { sub.subscription?.unsubscribe?.(); };
  }, []);

  if(!user){
    return (
      <form style={{ display:"flex", gap:"8px", alignItems:"center" }} onSubmit={async (e)=>{
        e.preventDefault();
        if(!email) return;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined }
        });
        if(error) alert(error.message);
        else alert("Check your email for a sign-in link.");
      }}>
        <input type="email" required placeholder="you@example.com"
          value={email} onChange={(e)=>setEmail(e.target.value)}
          style={{ border:"1px solid #d9dbe8", borderRadius:"10px", padding:"8px 10px", fontSize:"12px" }}
        />
        <button type="submit" style={btn("primary")}>Sign in</button>
      </form>
    );
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
