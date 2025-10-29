import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// -------------------------
// SERVER: basic artist + votes
// -------------------------
export async function getServerSideProps({ params }) {
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('display_name, handle, slug, status, website_url')
    .eq('slug', params.slug)
    .single();

  if (artistError || !artist) return { notFound: true };

  // Count votes
  const { data: votes } = await supabase
    .from('votes')
    .select('vote')
    .eq('artist_slug', params.slug);

  const up = votes?.filter(v => v.vote === 'up').length || 0;
  const down = votes?.filter(v => v.vote === 'down').length || 0;
  const total = up + down;
  const score = total ? Math.round((up / total) * 100) : 100;

  return { props: { artist, up, down, score } };
}

// -------------------------
// CLIENT PAGE
// -------------------------
export default function ArtistPage({ artist, up, down, score }) {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ up, down, score });
  const [showForm, setShowForm] = useState(false);

  const [reason, setReason] = useState('');
  const [files, setFiles] = useState([]);
  const [accusations, setAccusations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // -------------------------
  // Load current user + accusations
  // -------------------------
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);

      const { data: accs } = await supabase
        .from('accusations')
        .select('*')
        .eq('artist_slug', artist.slug)
        .order('created_at', { ascending: false });

      setAccusations(accs || []);
    })();
  }, [artist.slug]);

  // -------------------------
  // Simple upvote
  // -------------------------
  async function sendUpvote() {
    if (!user) return setErrorMsg('Please sign in first.');
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artist_slug: artist.slug,
        vote: 'up',
        voter_id: user.id,
      }),
    });
    const data = await res.json();
    if (res.ok) setCounts(data);
  }

  // -------------------------
  // Handle file uploads to bucket
  // -------------------------
  async function uploadFiles() {
    const urls = [];
    for (const file of files) {
      const filename = `${user.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('evidence')
        .upload(filename, file);

      if (error) throw error;
      const { data } = supabase.storage
        .from('evidence')
        .getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  // -------------------------
  // Submit evidence form
  // -------------------------
  async function submitEvidence(e) {
    e.preventDefault();
    if (!user) return setErrorMsg('Please sign in.');
    if (!reason.trim() && files.length === 0)
      return setErrorMsg('Please include text or images.');

    setLoading(true);
    setErrorMsg('');

    try {
      const imageUrls = files.length ? await uploadFiles() : [];

      const { error } = await supabase.from('accusations').insert([
        {
          artist_slug: artist.slug,
          accuser_id: user.id,
          text_reason: reason,
          image_urls: imageUrls,
        },
      ]);

      if (error) throw error;

      // Reload list
      const { data: accs } = await supabase
        .from('accusations')
        .select('*')
        .eq('artist_slug', artist.slug)
        .order('created_at', { ascending: false });

      setAccusations(accs || []);
      setShowForm(false);
      setReason('');
      setFiles([]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // Vote on an accusation
  // -------------------------
  async function voteOnAccusation(accId, vote) {
    if (!user) return setErrorMsg('Sign in first.');
    const { error } = await supabase.from('accusation_votes').upsert(
      [
        {
          accusation_id: accId,
          voter_id: user.id,
          vote,
        },
      ],
      { onConflict: 'accusation_id,voter_id' }
    );
    if (error) setErrorMsg(error.message);
  }

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px' }}>
      <p><a href="/directory">← Back</a></p>
      <h1>{artist.display_name} <span style={{opacity:.6}}>({artist.handle})</span></h1>
      <p>Status: <b>{artist.status}</b></p>
      <p>Score: <b>{counts.score}%</b> — 👍 {counts.up} / 👎 {counts.down}</p>

      {/* ---------- Voting Buttons ---------- */}
      <div style={{display:'flex', gap:12, margin:'16px 0'}}>
        <button onClick={sendUpvote} disabled={!user}>👍 Genuine</button>
        <button onClick={() => setShowForm(true)} disabled={!user}>👎 Submit Evidence</button>
      </div>

      {errorMsg && <p style={{color:'red'}}>{errorMsg}</p>}

      {/* ---------- Evidence Form ---------- */}
      {showForm && (
        <form onSubmit={submitEvidence}
          style={{border:'1px solid #ccc', padding:16, borderRadius:8, marginBottom:24}}>
          <h3>Submit evidence of AI use</h3>
          <textarea
            style={{width:'100%', minHeight:100, marginBottom:8}}
            placeholder="Explain why you believe this artist used AI..."
            value={reason}
            onChange={e=>setReason(e.target.value)}
          />
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e=>setFiles([...e.target.files])}
          />
          <div style={{marginTop:12}}>
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit evidence'}
            </button>{' '}
            <button type="button" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* ---------- Evidence Thread ---------- */}
      <h2>Evidence Against This Artist</h2>
      {accusations.length === 0 && <p>No evidence submitted yet.</p>}

      {accusations.map(acc => (
        <div key={acc.id}
          style={{border:'1px solid #ddd', borderRadius:8, padding:12, margin:'12px 0'}}>
          <div style={{fontSize:14, opacity:.7}}>
            Posted by {acc.accuser_id.slice(0,8)}... on{' '}
            {new Date(acc.created_at).toLocaleString()}
          </div>
          {acc.text_reason && <p>{acc.text_reason}</p>}
          {acc.image_urls?.length > 0 && (
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {acc.image_urls.map(url=>(
                <img key={url} src={url}
                  style={{maxWidth:120, borderRadius:4, border:'1px solid #ccc'}}/>
              ))}
            </div>
          )}
          <div style={{marginTop:8}}>
            <button onClick={()=>voteOnAccusation(acc.id,'agree')}>👍 Agree</button>{' '}
            <button onClick={()=>voteOnAccusation(acc.id,'disagree')}>👎 Disagree</button>
          </div>
        </div>
      ))}
    </main>
  );
}
