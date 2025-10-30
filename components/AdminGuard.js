
// components/AdminGuard.js
"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getAdminAllowlist } from "../lib/adminConfig";

export default function AdminGuard({ children }){
  const supabase = createClientComponentClient();
  const [state, setState] = useState({ loading:true, allowed:false, reason:"" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try{
        const { data: { user } } = await supabase.auth.getUser();
        if(!user){
          if(!cancelled) setState({ loading:false, allowed:false, reason:"No Supabase user (not logged in, or cookies not present)" });
          return;
        }
        const email = (user.email||"").toLowerCase();

        // Build-time allowlist (NEXT_PUBLIC_ADMIN_EMAILS) — works on Vercel if set in Project Settings → Environment Variables
        const allow = new Set(getAdminAllowlist());
        let allowed = allow.has(email);
        let reason = allowed ? "" : "Email not in NEXT_PUBLIC_ADMIN_EMAILS";

        if(!allowed){
          // Fallback to profiles.is_admin
          const { data: prof, error } = await supabase.from("profiles").select("is_admin, email").eq("id", user.id).single();
          if(error){ reason = "Could not query profiles table (RLS?)"; }
          allowed = !!prof?.is_admin;
          if(allowed) reason = "";
        }

        if(!cancelled) setState({ loading:false, allowed, reason });
      }catch(e){
        if(!cancelled) setState({ loading:false, allowed:false, reason:String(e?.message||e) });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if(state.loading) return <div className="p-6">Checking admin access…</div>;
  if(!state.allowed){
    return (
      <div className="p-6">
        <div className="font-semibold mb-2">You do not have permission to view this area.</div>
        <div className="text-sm text-paa-700">Reason: {state.reason}</div>
      </div>
    );
  }
  return children;
}
