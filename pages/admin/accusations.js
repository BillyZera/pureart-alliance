
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("../../components/AdminGuard"), { ssr:false });
import AdminLayout from "../../components/AdminLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AdminAccusations(){
  const supabase = createClientComponentClient();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [showDeleted, setShowDeleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actId, setActId] = useState(null);
  const [actReason, setActReason] = useState("");

  const fetchRows = async () => {
    setLoading(true);
    let query = supabase
      .from("accusations")
      .select("id, created_at, artist_slug, accuser_id, accuser_name, text, evidence_url, deleted_at, deleted_by, deleted_reason")
      .order("created_at", { ascending:false });
    const { data, error } = await query;
    if(!error) setRows(data||[]);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows||[]).filter(r => {
      if(!showDeleted && r.deleted_at) return false;
      if(!needle) return true;
      return [r.artist_slug, r.accuser_name, r.text].some(s => (s||"").toLowerCase().includes(needle));
    });
  }, [rows, q, showDeleted]);

  const restoreAccusation = async (id) => {
    const { error } = await supabase
      .from("accusations")
      .update({ deleted_at: null, deleted_by: null, deleted_reason: null })
      .eq("id", id);
    if(!error) fetchRows();
  };

  const hardDeleteAccusation = async (id) => {
    const { error } = await supabase.from("accusations").delete().eq("id", id);
    if(!error) fetchRows();
  };

  return (
    <AdminGuard>
      <AdminLayout active="accusations">
        <h1 className="page-title mb-4">Accusations</h1>

        <Card className="p-4 mb-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <Input placeholder="Filter by artist, name, or text…" value={q} onChange={e=>setQ(e.target.value)} />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-paa-700">
              <input type="checkbox" checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)} />
              Show deleted
            </label>
          </div>
        </Card>

        <div className="space-y-3">
          {loading && <div className="p-6">Loading…</div>}
          {!loading && filtered.length===0 && <div className="p-6 text-sm text-paa-700">No results.</div>}
          {filtered.map(row => (
            <Card key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{row.artist_slug}</span>
                    {row.deleted_at ? <Badge color="red">Deleted</Badge> : <Badge color="green">Active</Badge>}
                  </div>
                  <div className="muted">By {row.accuser_name || row.accuser_id} · {new Date(row.created_at).toLocaleString()}</div>
                  <p className={row.deleted_at ? "line-through text-paa-600" : ""}>{row.text}</p>
                  {row.evidence_url && (
                    <a href={row.evidence_url} target="_blank" rel="noreferrer" className="text-sm text-paa-600 underline">
                      View evidence
                    </a>
                  )}
                  {row.deleted_reason && (
                    <div className="text-xs text-paa-600 mt-1">
                      <span className="font-semibold">Deleted reason:</span> {row.deleted_reason}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[220px]">
                  {!row.deleted_at ? (
                    <>
                      <Button variant="outline" onClick={()=>{ setActId(row.id); setActReason(""); }}>
                        Soft delete (add reason)
                      </Button>
                      <Button variant="danger" onClick={()=>hardDeleteAccusation(row.id)}>
                        Hard delete
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="primary" onClick={()=>restoreAccusation(row.id)}>
                        Restore
                      </Button>
                      <Button variant="danger" onClick={()=>hardDeleteAccusation(row.id)}>
                        Hard delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {actId && (
          <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
              <h2 className="font-semibold mb-2">Soft delete accusation</h2>
              <p className="muted mb-3">Add an internal reason (visible to admins).</p>
              <Textarea rows={4} value={actReason} onChange={e=>setActReason(e.target.value)} placeholder="Reason…" />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" onClick={()=>{ setActId(null); setActReason(""); }}>Cancel</Button>
                <Button variant="danger" onClick={async ()=>{
                  const { error } = await supabase
                    .from("accusations")
                    .update({ deleted_at: new Date().toISOString(), deleted_reason: actReason })
                    .eq("id", actId);
                  setActId(null); setActReason("");
                  if(!error) fetchRows();
                }}>Confirm</Button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
