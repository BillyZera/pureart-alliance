import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// -------------------------
// SERVER
// -------------------------
export async function getServerSideProps({ params }) {
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('display_name, handle, slug, status, website_url')
    .eq('slug', params.slug)
    .single();

  if (artistError || !artist) return { notFound: true };

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
// CLIENT
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

  // load user + accusations (excluding soft-deleted)
  async function loadThread() {
    const { data: accs } = await supabase
      .from('accusations')
      .select('*')
      .eq('artist_slug', artist.slug)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    setAccusations(accs || []);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
      await loadThread();
    })();
  }, [artist.slug]);

  // upvote (positive trust)
  async function sendUpvote() {
    if (!user) return setErrorMsg('Please sign in first.');
    setErrorMsg('');

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
    if (!res.ok) setErrorMsg(data.error || 'Vote failed');
    else setCounts(data);
  }

  // upload images to "evidence" bucket
  async function uploadFiles() {
    const urls = [];
    for (const file of files) {
      const filename = `${user.id}-${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('evidence')
        .upload(filename, file);
      if (error) throw error;

      const { data } = supabase.storage.from('evidence').getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  // submit accusation (requires 1..5 images)
  async function submitEvidence(e) {
    e.preventDefault();
    if (!user) return setErrorMsg('Please sign in.');
    if (files.length < 1) return setErrorMsg('Please attach at least one image.');
    if (files.length > 5) return setErrorMsg('You can attach up to 5 images max.');
    setLoading(true);
    setErrorMsg('');

    try {
      const imageUrls = await uploadFiles();

      const { error } = await supabase.from('accusations').insert([
        {
          artist_slug: artist.slug,
          accuser_id: user.id,
          accuser_name: user.email, // will show in thread (swap to profile name later)
          text_reason: reason,
          image_urls: imageUrls,
        },
      ]);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('duplicate key value')) {
          setErrorMsg('You have already submitted evidence for this artist.');
        } else if (msg.includes('row-level security')) {
          setErrorMsg('Permission denied by security policy (RLS). Check Supabase policies.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      await loadThread();
      setShowForm(false);
      setReason('');
      setFiles([]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  // soft-delete own post
  async function deleteAccusation(accId) {
    if (!user) return setErrorMsg('Please sign in.');
    setErrorMsg('');

    const { error } = await supabase
      .from('accusations')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        status: 'deleted',
      })
      .eq('id', accId)
      .eq('accuser_id', user.id); // ensure only owner deletes

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    await loadThread();
  }

  return (
    <main
      style={{
        maxWidth: 700,
        margin: '40px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <p>
        <a href="/directory" style={{ color: '#0066cc' }}>
          ← Back to directory
        </a>
      </p>

      {user && (
        <p
          style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#333',
            marginBottom: '16px',
          }}
        >
          Signed in as <b>{user.email}</b>
        </p>
      )}

      <h1>
        {artist.display_name}{' '}
        <span style={{ opacity: 0.6 }}>({artist.handle})</span>
      </h1>

      <p>
        Status: <b>{artist.status}</b>
      </p>

      <p>
        Score: <b>{counts.score}%</b> — 👍 {counts.up} / 👎 {counts.down}
      </p>

      {artist.website_url && (
        <p>
          Website:{' '}
          <a href={artist.website_url} target="_blank" rel="noreferrer">
            {artist.website_url}
          </a>
        </p>
      )}

      {/* voting buttons */}
      <div style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <button
          onClick={sendUpvote}
          disabled={!user}
          style={{
            background: '#eaffea',
            border: '2px solid #0a0',
            color: '#060',
            fontWeight: 'bold',
            padding: '10px 14px',
            borderRadius: 8,
            cursor: user ? 'pointer' : 'not-allowed',
          }}
        >
          👍 This artist is genuine
        </button>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setErrorMsg('');
          }}
          disabled={!user}
          style={{
            background: '#ffeeee',
            border: '2px solid #a00',
            color: '#600',
            fontWeight: 'bold',
            padding: '10px 14px',
            borderRadius: 8,
            cursor: user ? 'pointer' : 'not-allowed',
          }}
        >
          👎 I suspect AI here
        </button>
      </div>

      {/* evidence form */}
      {showForm && (
        <form
          onSubmit={submitEvidence}
          style={{
            border: '1px solid #ccc',
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            background: '#fafafa',
          }}
        >
          <h3>Submit evidence of AI use</h3>

          <textarea
            style={{ width: '100%', minHeight: 100, marginBottom: 8 }}
            placeholder="Explain why you believe this artist used AI..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => setFiles([...e.target.files])}
          />
          <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
            You must attach at least 1 image (max 5).
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit evidence'}
            </button>{' '}
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setErrorMsg('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {errorMsg && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>
      )}

      {/* badge */}
      <hr style={{ margin: '24px 0' }} />
      <h2>Your PureArt Badge</h2>
      <p style={{ fontSize: '14px', color: '#555', lineHeight: 1.4 }}>
        This live badge shows your current status in PureArt Alliance. If your
        status ever changes (for example, goes under review or is revoked), the
        colour and text here will update everywhere you’ve embedded it.
      </p>

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '16px',
          display: 'inline-block',
          background: '#fff',
        }}
      >
        <img
          src={`/api/badge/${artist.slug}`}
          alt="PureArt Alliance badge"
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </div>

      <p style={{ marginTop: '24px', fontWeight: 'bold' }}>
        Copy &amp; paste this HTML anywhere:
      </p>

      <pre
        style={{
          background: '#f5f5f5',
          padding: '12px',
          borderRadius: '8px',
          overflowX: 'auto',
          fontSize: '13px',
          lineHeight: 1.4,
          border: '1px solid #ddd',
        }}
      >{`<a href="https://pureart-alliance.vercel.app/artist/${artist.slug}" target="_blank" rel="noopener">
  <img src="https://pureart-alliance.vercel.app/api/badge/${artist.slug}"
       alt="PureArt Alliance - Human Created Art" />
</a>`}</pre>

      {/* thread */}
      <h2>Evidence Against This Artist</h2>
      {accusations.length === 0 && <p>No evidence submitted yet.</p>}

      {accusations.map(acc => (
        <div
          key={acc.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: 8,
            padding: 12,
            margin: '12px 0',
            background: '#fff',
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.7, display: 'flex', justifyContent: 'space-between' }}>
            <span>
              Posted by {acc.accuser_name || 'anonymous'} on{' '}
              {new Date(acc.created_at).toLocaleString()}
            </span>
            {user?.id === acc.accuser_id && (
              <button
                onClick={() => deleteAccusation(acc.id)}
                style={{ fontSize: 12 }}
                title="Delete your post (soft delete)"
              >
                🗑 Delete
              </button>
            )}
          </div>

          {acc.text_reason && <p>{acc.text_reason}</p>}

          {acc.image_urls?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {acc.image_urls.map(url => (
                <img
                  key={url}
                  src={url}
                  style={{
                    maxWidth: 120,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                  }}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button onClick={() => voteOnAccusation(acc.id, 'agree')}>
              👍 Agree
            </button>{' '}
            <button onClick={() => voteOnAccusation(acc.id, 'disagree')}>
              👎 Disagree
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}