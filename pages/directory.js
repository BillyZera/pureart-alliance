import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

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

export default function Directory({ artists }) {
  return (
    <main style={{maxWidth: 800, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif'}}>
      <h1>Directory</h1>
      <ul style={{listStyle:'none', padding:0}}>
        {artists.map(a => {
          const up = Number(a.up_weighted || 0);
          const down = Number(a.down_weighted || 0);
          const total = up + down;
          const score = total ? Math.round((up / total) * 100) : 100;
          return (
            <li key={a.slug} style={{margin:'12px 0', padding:'12px', border:'1px solid #ddd', borderRadius:8}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                <div>
                  <strong>{a.display_name}</strong> <span style={{opacity:.6}}>({a.handle})</span>
                  <div>Status: <b>{a.status}</b></div>
                  <div>Score: <b>{score}%</b> — 👍 {up} / 👎 {down}</div>
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
