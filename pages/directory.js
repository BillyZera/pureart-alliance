import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// This runs on the server when someone loads /directory.
// It gets the list of artists from the database so we can show them.
export async function getServerSideProps() {
  const { data: artists, error } = await supabase
    .from('artists')
    .select('display_name, handle, slug, status, up_weighted, down_weighted')
    .order('display_name', { ascending: true });

  if (error) {
    console.error(error);
    return { props: { artists: [] } };
  }

  return { props: { artists } };
}

// This runs in the browser. It shows the page.
export default function Directory({ artists }) {
  // We'll store the logged-in user's email here (if any)
  const [userEmail, setUserEmail] = useState(null);

  // When the page loads in the browser, ask Supabase "who is logged in?"
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
      {/* Sign-in status box */}
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
          <a href="/login" style={{ color: '#0066cc' }}>Log in →</a>
        </p>
      )}

      <h1>Directory</h1>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {artists.map(a => {
          const up = Number(a.up_weighted || 0);
          const down = Number(a.down_weighted || 0);
          const total = up + down;
          const score = total ? Math.round((up / total) * 100) : 100;

          return (
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
                    Score: <b>{score}%</b> — 👍 {up} / 👎 {down}
                  </div>
                </div>

                <Link href={`/artist/${a.slug}`}>View</Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
