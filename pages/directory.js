import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// We are going to fetch:
// - all artists
// - all votes
// Then we combine them on the server to compute up/down/score per artist.
export async function getServerSideProps() {
  // 1. Get artist list
  const { data: artistsRaw, error: artistError } = await supabase
    .from('artists')
    .select('display_name, handle, slug, status')
    .order('display_name', { ascending: true });

  if (artistError || !artistsRaw) {
    console.error(artistError);
    return { props: { artists: [] } };
  }

  // 2. Get all votes for all artists
  const { data: votesRaw, error: votesError } = await supabase
    .from('votes')
    .select('artist_slug, vote');

  if (votesError) {
    console.error(votesError);
    // still return artists list, just with 0s
    const artistsWithZeros = artistsRaw.map(a => ({
      ...a,
      up: 0,
      down: 0,
      score: 100,
    }));
    return { props: { artists: artistsWithZeros } };
  }

  // 3. Build a map: slug -> { up, down }
  const tallyMap = {};
  for (const row of votesRaw) {
    if (!tallyMap[row.artist_slug]) {
      tallyMap[row.artist_slug] = { up: 0, down: 0 };
    }
    if (row.vote === 'up') tallyMap[row.artist_slug].up += 1;
    if (row.vote === 'down') tallyMap[row.artist_slug].down += 1;
  }

  // 4. Merge tallies into artists list
  const artists = artistsRaw.map(a => {
    const up = tallyMap[a.slug]?.up || 0;
    const down = tallyMap[a.slug]?.down || 0;
    const total = up + down;
    const score = total ? Math.round((up / total) * 100) : 100;
    return {
      ...a,
      up,
      down,
      score,
    };
  });

  return { props: { artists } };
}

export default function Directory({ artists }) {
  // We'll still show login status so you know if you're signed in.
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    }
    loadUser();
  }, []);

  return (
    <main
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: '0 16px',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {userEmail ? (
        <p
          style={{
            background: '#f5f5f5',
            border: '1px solid #ddd',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#333',
            marginBottom: '16px'
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
            marginBottom: '16px'
          }}
        >
          Not signed in.{' '}
          <a href="/login" style={{ color: '#0066cc' }}>
            Log in →
          </a>
        </p>
      )}

      <h1>Directory</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {artists.map(a => (
          <li
            key={a.slug}
            style={{
              margin: '12px 0',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: 8
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}
            >
              <div>
                <strong>{a.display_name}</strong>{' '}
                <span style={{ opacity: 0.6 }}>({a.handle})</span>

                <div>
                  Status: <b>{a.status}</b>
                </div>

                <div>
                  Score:{' '}
                  <b>{a.score}%</b> — 👍 {a.up} / 👎 {a.down}
                </div>
              </div>

              <Link href={`/artist/${a.slug}`}>View</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
