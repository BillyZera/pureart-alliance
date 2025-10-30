
// pages/login.js — email + password auth page (no magic links)
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const input = { border:"1px solid #d9dbe8", borderRadius:"10px", padding:"10px 12px", fontSize:"14px", width:"100%" };
const btn = (variant="primary") => ({
  borderRadius:"10px",
  padding:"10px 14px",
  fontSize:"14px",
  fontWeight:700,
  border: variant==="outline" ? "1px solid #d9dbe8" : "none",
  color: variant==="outline" ? "#161827" : "#fff",
  background: variant==="outline" ? "#fff" : "#5b5bd6",
  cursor:"pointer",
  width:"100%"
});

export default function LoginPage(){
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if(error){ setError(error.message); return; }
    router.push("/");
  };

  const signUp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if(error){ setError(error.message); return; }
    alert("Account created. Check your inbox to confirm, then sign in.");
  };

  return (
    <div style={{ maxWidth:480, margin:"60px auto", background:"#fff", border:"1px solid #ececf3", borderRadius:"16px", padding:"24px", boxShadow:"0 1px 2px rgba(0,0,0,.05)" }}>
      <h1 className="page-title" style={{ marginBottom:16 }}>Sign in</h1>
      <form onSubmit={signIn} style={{ display:"grid", gap:12 }}>
        <input type="email" placeholder="you@example.com" required value={email} onChange={e=>setEmail(e.target.value)} style={input} />
        <input type="password" placeholder="Password" required value={password} onChange={e=>setPassword(e.target.value)} style={input} />
        {error && <div style={{ color:"#b42318", fontSize:12 }}>{error}</div>}
        <button type="submit" style={btn("primary")} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <div style={{ marginTop:16, fontSize:12, color:"#6a6f85", textAlign:"center" }}>No account?</div>
      <button onClick={signUp} style={{ ...btn("outline"), marginTop:8 }} disabled={loading}>Create account</button>
    </div>
  );
}
