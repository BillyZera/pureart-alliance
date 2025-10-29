import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// 1. Get artist data on the server so the page can load even without JS
export async function getServerSideProps({ params }) {
  // Load the artist row
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('display_name, handle, slug, status, website_url')
    .eq('slug', params.slug)
    .single();

  if (artistError || !artist) {
    return { notFound: true };
  }

  // Load current votes for this artist
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('vote')
    .eq('artist_slug', params.slug);

  // Gracefully handle if votes table is empty/new
  const upCount = votes && !votesError
    ? votes.filter(v => v.vote === 'up').length
    : 0;
  const downCount = votes && !votesError
    ? votes.filter(v => v.vote === 'down').length
    : 0;

  const total = upCount + downCount;
  const initialScore = total ? Math.round((upCount / total) * 100) : 100;

  return {
    props: {
      artist,
      initialUp: upCount,
      initialDown: downCount,
      initialScore,
    },
  };
}

// 2. Page component (runs in the browser)
export default function ArtistPage({ artist, initialUp, initialDown, initialScore }) {
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const [up, setUp] = useState(initialUp);
  const [down, setDown] = useState(initialDown);
  const [score, setScore] = useState(initialScore);

  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // When page mounts, ask Supabase who is signed in
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserEmail(data.user.email || null);
        setUserId(data.user.id || null);
      }
    }
    loadUser();
  }, []);

  // Handle clicking 👍 or 👎
  async function sendVote(voteType) {
    if (!userId) {
      setErrorMsg('You must be signed in to vote.');
      return;
    }

    setWorking(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artist_slug: artist.slug,
          vote: voteType, // 'up' or 'down'
          voter_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Vote failed');
      } else {
        // Update UI with fresh numbers from the server response
        setUp(data.up);
        setDown(data.down);
        setScore(data.score);
      }
    } catch (err) {
      setErrorMsg('Network error');
    } finally {
      setWorking(false);
    }
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
        <a href="/directory">← Back to directory</a>
      </p>

      {/* login status box */}
      {userEmail ? (
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
          Signed in as <b>{userEmail}</b>
        </p>
      ) : (
        <p
          style={{
            background: '#fffbea',
            border: '1px solid #ddd',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#555',
            marginBottom: '16px',
          }}
        >
          Not signed in.{' '}
          <a href="/login" style={{ color: '#0066cc' }}>
            Log in →
          </a>
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
        Score: <b>{score}%</b> — 👍 {up} / 👎 {down}
      </p>

      {artist.website_url && (
        <p>
          Website:{' '}
          <a
            href={artist.website_url}
            target="_blank"
            rel="noreferrer"
          >
            {artist.website_url}
          </a>
        </p>
      )}

      {/* voting buttons */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => sendVote('up')}
          disabled={working || !userId}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #0a0',
            background: '#eaffea',
            cursor: working || !userId ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          👍 This artist is genuine
        </button>

        <button
          onClick={() => sendVote('down')}
          disabled={working || !userId}
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #a00',
            background: '#ffeeee',
            cursor: working || !userId ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          👎 I suspect AI here
        </button>
      </div>

      {errorMsg && (
        <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>Your PureArt Badge</h2>
      <p
        style={{
          fontSize: '14px',
          color: '#555',
          lineHeight: 1.4,
        }}
      >
        This live badge shows your current status in PureArt Alliance.
        If your status ever changes (for example, goes under review or is revoked),
        the colour and text here will update everywhere you’ve embedded it.
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

      <p
        style={{
          fontSize: '13px',
          color: '#777',
          marginTop: '8px',
        }}
      >
        Tip: paste that into your website, portfolio, bio, Linktree, etc.
      </p>
    </main>
  );
}
