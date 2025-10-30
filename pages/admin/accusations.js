// pages/admin/accusations.js — matches your `public.accusations` schema exactly
// table columns: id, artist_slug, accuser_id, text_reason, image_urls[], created_at, status, accuser_name, deleted_at, deleted_by, deleted_reason

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("../../components/AdminGuard"), { ssr:false });
import AdminLayout from "../../components/AdminLayout";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TBL = "accusations";

export default function AdminAccusations(){
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function fetchRows(){
    setLoading(true); setErr("");
    const { data, error } = await supabase
      .from(TBL)
      .select("id, artist_slug, accuser_id, text_reason, image_urls, created_at, status, accuser_name, deleted_at, deleted_by, deleted_reason")
      .order("created_at", { ascending:false });
    if(error){ setErr(error.message||String(error)); setRows([]); }
    else setRows(data||[]);
    setLoading(false);
  }

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows||[]).filter(r => {
      if(!showDeleted && r.deleted_at) return false;
      if(!needle) return true;
      const hay = [
        r.artist_slug, r.accuser_name, r.accuser_id, r.text_reason, r.status
      ].map(x => (x??"").toString().toLowerCase());
      return hay.some(s => s.includes(needle));
    });
  }, [rows, q, showDeleted]);

  const displayName = (r) => r.accuser_name || (r.accuser_id ? r.accuser_id.slice(0,8)+"…" : "anonymous");
  const statusBadge = (s) => {
    const map = {
      open:   { bg:"#e7f0ff", fg:"#1d4ed8", label:"Open" },
      dismissed:{ bg:"#fff4e5", fg:"#b45309", label:"Dismissed" },
      confirmed:{ bg:"#e7f8ee", fg:"#065f46", label:"Confirmed" },
      deleted:{ bg:"#ffe4e6", fg:"#b42318", label:"Deleted" },
      null:   { bg:"#eef2f7", fg:"#6b7280", label:"—" }
    };
    return map[s]||map.null;
  };

  async function setStatus(id, status){
    const { error } = await supabase.from(TBL).update({ status }).eq("id", id);
    if(!error) fetchRows();
  }
  async function softDelete(id){
    const reason = window.prompt("Reason for soft delete? (visible to admins)");
    if(reason===null) return;
    const { error } = await supabase.from(TBL).update({
      deleted_at: new Date().toISOString(),
      deleted_reason: reason,
      status: "deleted"
    }).eq("id", id);
    if(!error) fetchRows();
  }
  async function restore(id){
    const { error } = await supabase.from(TBL).update({
      deleted_at: null,
      deleted_by: null,
      deleted_reason: null,
      status: "open"
    }).eq("id", id);
    if(!error) fetchRows();
  }
  async function hardDelete(id){
    if(!confirm("Hard delete permanently?")) return;
    const { error } = await supabase.from(TBL).delete().eq("id", id);
    if(!error) fetchRows();
  }

  return (
    <AdminGuard>
      <AdminLayout active="accusations">
        <h1 className="page-title" style={{ marginBottom: 12 }}>Accusations</h1>

        <div style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"12px", marginBottom:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"12px" }}>
            <input
              placeholder="Filter by artist, name, user id, text, or status…"
              value={q}
              onChange={e=>setQ(e.target.value)}
              style={{ border:"1px solid #d9dbe8", borderRadius:"10px", padding:"8px 10px", fontSize:"14px" }}
            />
            <label style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"14px", color:"#6a6f85" }}>
              <input type="checkbox" checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)} />
              Show deleted
            </label>
          </div>
          {err && <div style={{ marginTop:8, fontSize:12, color:"#b42318" }}>Query error: {err}</div>}
        </div>

        {loading && <div className="p-6">Loading…</div>}
        {!loading && filtered.length===0 && <div className="p-6" style={{ color:"#6a6f85" }}>No results.</div>}

        <div style={{ display:"grid", gap:"12px" }}>
          {filtered.map(row => {
            const st = statusBadge(row.status);
            return (
              <div key={row.id} style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"12px", boxShadow:"0 1px 2px rgba(0,0,0,.05)" }}>
                <div style={{ display:"flex", alignItems:"start", justifyContent:"space-between", gap:"12px" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                      <strong>{row.artist_slug}</strong>
                      <span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"999px", background: st.bg, color: st.fg }}>
                        {st.label}
                      </span>
                      {row.deleted_at && (
                        <span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"999px", background:"#ffe4e6", color:"#b42318" }}>
                          Deleted
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:"12px", color:"#6a6f85", marginBottom:"6px" }}>
                      By {displayName(row)} · {new Date(row.created_at).toLocaleString()}
                    </div>
                    <p style={{ margin:0, color: row.deleted_at ? "#9aa0b3" : "#161827", textDecoration: row.deleted_at ? "line-through" : "none" }}>
                      {row.text_reason || "—"}
                    </p>

                    {Array.isArray(row.image_urls) && row.image_urls.length>0 && (
                      <div style={{ display:"flex", gap:"8px", marginTop:"8px", flexWrap:"wrap" }}>
                        {row.image_urls.map((u,i)=>(
                          <a key={i} href={u} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:"#5b5bd6" }}>image {i+1}</a>
                        ))}
                      </div>
                    )}

                    {row.deleted_reason && (
                      <div style={{ fontSize:"12px", color:"#6a6f85", marginTop:"6px" }}>
                        <strong>Deleted reason:</strong> {row.deleted_reason}
                      </div>
                    )}
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"8px", minWidth:"240px" }}>
                    {!row.deleted_at ? (
                      <>
                        <button onClick={()=>setStatus(row.id, "open")} style={{ padding:"8px 10px", borderRadius:"10px", border:"1px solid #d9dbe8", background:"#fff", cursor:"pointer" }}>Mark Open</button>
                        <button onClick={()=>setStatus(row.id, "dismissed")} style={{ padding:"8px 10px", borderRadius:"10px", border:"1px solid #d9dbe8", background:"#fff8e1", cursor:"pointer" }}>Mark Dismissed</button>
                        <button onClick={()=>setStatus(row.id, "confirmed")} style={{ padding:"8px 10px", borderRadius:"10px", border:"1px solid #d9dbe8", background:"#e8fff1", cursor:"pointer" }}>Mark Confirmed</button>
                        <button onClick={()=>softDelete(row.id)} style={{ padding:"8px 10px", borderRadius:"10px", background:"#d92d20", color:"#fff", border:"none", cursor:"pointer" }}>Soft delete</button>
                        <button onClick={()=>hardDelete(row.id)} style={{ padding:"8px 10px", borderRadius:"10px", background:"#b42318", color:"#fff", border:"none", cursor:"pointer" }}>Hard delete</button>
                      </>
                    ) : (
                      <>
                        <button onClick={()=>restore(row.id)} style={{ padding:"8px 10px", borderRadius:"10px", background:"#5b5bd6", color:"#fff", border:"none", cursor:"pointer" }}>Restore</button>
                        <button onClick={()=>hardDelete(row.id)} style={{ padding:"8px 10px", borderRadius:"10px", background:"#b42318", color:"#fff", border:"none", cursor:"pointer" }}>Hard delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
