import { supabase } from '../../lib/supabaseClient';

export async function getServerSideProps({ params }) {
  const { data: artist, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !artist) return { notFound: true };
  return { props: { artist } };
}

export default function ArtistPage({ artist }) {
  const up = Number(artist.up_weighted || 0);
  const down = Number(artist.down_weighted || 0);
  const total = up + down;
  const score = total ? Math.round((up / total) * 100) : 100;

  return (
    <main style={{maxWidth: 700, margin: '40px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif'}}>
      <p><a href="/directory">← Back to directory</a></p>
      <h1>{artist.display_name} <span style={{opacity:.6}}>({artist.handle})</span></h1>
      <p>Status: <b>{artist.status}</b></p>
      <p>Score: <b>{score}%</b> — 👍 {up} / 👎 {down}</p>
      {artist.website_url && (
        <p>Website: <a href={artist.website_url} target="_blank" rel="noreferrer">{artist.website_url}</a></p>
      )}
    </main>
  );
}
