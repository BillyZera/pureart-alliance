
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getAdminAllowlist } from "../lib/adminConfig";

export default function AdminGuard({ children }){
  const supabase = createClientComponentClient();
  const [state, setState] = useState({ loading:true, allowed:false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user){ if(!cancelled) setState({ loading:false, allowed:false }); return; }
      const email = (user.email||"").toLowerCase();
      const allow = new Set(getAdminAllowlist());
      let allowed = allow.has(email);

      if(!allowed){
        const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
        allowed = !!prof?.is_admin;
      }
      if(!cancelled) setState({ loading:false, allowed });
    })();
    return () => { cancelled = true; };
  }, []);

  if(state.loading) return <div className="p-6">Checking admin access…</div>;
  if(!state.allowed) return <div className="p-6">You do not have permission to view this area.</div>;
  return children;
}
