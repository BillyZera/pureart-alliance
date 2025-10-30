
// components/AdminGuard.js — client-side admin allowlist check using plain Supabase JS
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getAdminAllowlist } from "../lib/adminConfig";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminGuard({ children }){
  const [state, setState] = useState({ loading:true, allowed:false, reason:"" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user){
        if(!cancelled) setState({ loading:false, allowed:false, reason:"No Supabase user (not logged in, or cookies not present)" });
        return;
      }
      const email = (user.email||"").toLowerCase();
      const allow = new Set(getAdminAllowlist());
      const allowed = allow.has(email);
      const reason = allowed ? "" : "Email not in NEXT_PUBLIC_ADMIN_EMAILS";
      if(!cancelled) setState({ loading:false, allowed, reason });
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
