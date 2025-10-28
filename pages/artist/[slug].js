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
        If your status ever changes (for example, goes under review or
        is revoked), the colour and text here will update everywhere
        you’ve embedded it.
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
        Tip: paste that into your website, portfolio, bio, Linktree,
        etc.
      </p>
    </main>
  );
}
