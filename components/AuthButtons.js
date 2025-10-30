
// components/AuthButtons.js
"use client";
import { useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Button from "./ui/Button";

export default function AuthButtons(){
  const supabase = useSupabaseClient();
  const user = useUser();
  const [email, setEmail] = useState("");

  if(!user){
    return (
      <form className="flex items-center gap-2" onSubmit={async (e)=>{
        e.preventDefault();
        if(!email) return;
        const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined } });
        if(error) alert(error.message);
        else alert("Check your email for a sign-in link.");
      }}>
        <input type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" />
        <Button size="sm" type="submit">Sign in</Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-paa-700">{user.email}</span>
      <Button size="sm" variant="outline" onClick={async ()=>{ await supabase.auth.signOut(); location.reload(); }}>Sign out</Button>
    </div>
  );
}
