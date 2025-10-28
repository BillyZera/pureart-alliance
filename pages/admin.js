import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPage() {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [slug, setSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [message, setMessage] = useState('');

  async function addArtist(e) {
    e.preventDefault();
    setMessage('Saving...');

    const { error } = await supabase.from('artists').insert([
      {
        display_name: displayName,
        handle,
        slug,
        website_url: websiteUrl,
        status: 'active'
      }
    ]);

    if (error) {
      console.error(error);
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Artist added!');
      setDisplayName('');
      setHandle('');
      setSlug('');
      setWebsiteUrl('');
    }
  }

  return (
    <main style={{
      maxWidth:600,
      margin:'40px auto',
      padding:'0 16px',
      fontFamily:'system-ui,sans-serif'
    }}>
      <h1>Add Artist (temporary admin)</h1>
      <p style={{fontSize:14, color:'#666'}}>
        This page is just for you to add artists into the database.
        We’ll lock this down later so the public can’t see it.
      </p>

      <form onSubmit={addArtist} style={{display:'grid', gap:'12px', marginTop:'24px'}}>
        <label>
          Display Name<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
        </label>

        <label>
          Handle (username)<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={handle}
            onChange={e => setHandle(e.target.value)}
            required
          />
        </label>

        <label>
          Slug (no spaces, e.g. alexpainter)<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={slug}
            onChange={e => setSlug(e.target.value)}
            required
          />
        </label>

        <label>
          Website URL (optional)<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <button type="submit" style={{
          padding:'10px 14px',
          fontWeight:'bold',
          cursor:'pointer'
        }}>
          Add Artist
        </button>
      </form>

      {message && (
        <p style={{marginTop:'16px', fontWeight:'bold'}}>{message}</p>
      )}
    </main>
  );
}
