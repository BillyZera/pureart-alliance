
// pages/admin/accusations.js — query evidence table + show author; works even if anon
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("../../components/AdminGuard"), { ssr:false });
import AdminLayout from "../../components/AdminLayout";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// EDIT THIS if your evidence table has a different name:
const EVIDENCE_TABLE = "accusations"; // ← change to your real table name if different

export default function AdminAccusations(){
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actId, setActId] = useState(null);
  const [actReason, setActReason] = useState("");

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(EVIDENCE_TABLE)
      .select("id, created_at, artist_slug, user_id, user_email, user_name, text, evidence_url, deleted_at, deleted_by, deleted_reason")
      .order("created_at", { ascending:false });
    if(!error) setRows(data||[]);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows||[]).filter(r => {
      if(!showDeleted && r.deleted_at) return false;
      if(!needle) return true;
      return [r.artist_slug, r.user_email, r.user_name, r.text].some(s => (s||"").toLowerCase().includes(needle));
    });
  }, [rows, q, showDeleted]);

  const displayName = (r) => r.user_name || r.user_email || r.user_id || "anonymous";

  const restoreRow = async (id) => {
    const { error } = await supabase.from(EVIDENCE_TABLE)
      .update({ deleted_at: null, deleted_by: null, deleted_reason: null })
      .eq("id", id);
    if(!error) fetchRows();
  };

  const softDeleteRow = async (id, reason) => {
    const { error } = await supabase.from(EVIDENCE_TABLE)
      .update({ deleted_at: new Date().toISOString(), deleted_reason: reason })
      .eq("id", id);
    if(!error) fetchRows();
  };

  const hardDeleteRow = async (id) => {
    const { error } = await supabase.from(EVIDENCE_TABLE).delete().eq("id", id);
    if(!error) fetchRows();
  };

  return (
    <AdminGuard>
      <AdminLayout active="accusations">
        <h1 className="page-title mb-4">Accusations</h1>

        <div style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"12px", marginBottom:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"12px" }}>
            <input placeholder="Filter by artist, name, or text…" value={q} onChange={e=>setQ(e.target.value)}
              style={{ border:"1px solid #d9dbe8", borderRadius:"10px", padding:"8px 10px", fontSize:"14px" }}
            />
            <label style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"14px", color:"#6a6f85" }}>
              <input type="checkbox" checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)} />
              Show deleted
            </label>
          </div>
        </div>

        <div className="space-y-3">
          {loading && <div className="p-6">Loading…</div>}
          {!loading && filtered.length===0 && <div className="p-6 text-sm" style={{ color:"#6a6f85" }}>No results.</div>}
          {filtered.map(row => (
            <div key={row.id} style={{ border:"1px solid #ececf3", background:"#fff", borderRadius:"16px", padding:"12px", marginBottom:"12px", boxShadow:"0 1px 2px rgba(0,0,0,.05)" }}>
              <div style={{ display:"flex", alignItems:"start", justifyContent:"space-between", gap:"12px" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                    <strong>{row.artist_slug}</strong>
                    <span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"999px", background: row.deleted_at ? "#ffe4e6" : "#e7f8ee", color: row.deleted_at ? "#b42318" : "#067647" }}>
                      {row.deleted_at ? "Deleted" : "Active"}
                    </span>
                  </div>
                  <div style={{ fontSize:"12px", color:"#6a6f85", marginBottom:"6px" }}>
                    By {displayName(row)} · {new Date(row.created_at).toLocaleString()}
                  </div>
                  <p style={{ margin:0, color: row.deleted_at ? "#9aa0b3" : "#161827", textDecoration: row.deleted_at ? "line-through" : "none" }}>{row.text}</p>
                  {row.evidence_url && (
                    <div style={{ marginTop:"6px" }}>
                      <a href={row.evidence_url} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:"#5b5bd6" }}>
                        View evidence
                      </a>
                    </div>
                  )}
                  {row.deleted_reason && (
                    <div style={{ fontSize:"12px", color:"#6a6f85", marginTop:"6px" }}>
                      <strong>Deleted reason:</strong> {row.deleted_reason}
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px", minWidth:"220px" }}>
                  {!row.deleted_at ? (
                    <>
                      <button onClick={()=>{
                        const r = prompt("Reason for soft delete? (visible to admins)");
                        if(r!=null) softDeleteRow(row.id, r);
                      }} style={{ padding:"8px 10px", borderRadius:"10px", border:"1px solid #d9dbe8", background:"#fff", cursor:"pointer" }}>Soft delete (add reason)</button>
                      <button onClick={()=>{ if(confirm("Hard delete permanently?")) hardDeleteRow(row.id); }} style={{ padding:"8px 10px", borderRadius:"10px", background:"#d92d20", color:"#fff", border:"none", cursor:"pointer" }}>Hard delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={()=>restoreRow(row.id)} style={{ padding:"8px 10px", borderRadius:"10px", background:"#5b5bd6", color:"#fff", border:"none", cursor:"pointer" }}>Restore</button>
                      <button onClick={()=>{ if(confirm("Hard delete permanently?")) hardDeleteRow(row.id); }} style={{ padding:"8px 10px", borderRadius:"10px", background:"#d92d20", color:"#fff", border:"none", cursor:"pointer" }}>Hard delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
