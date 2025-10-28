import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function AdminPage() {
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [slug, setSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [message, setMessage] = useState('');

  // Whenever handle changes, build the slug from it
  useEffect(() => {
    // rule: lowercase, trim spaces, replace spaces with nothing
    // you could also replace spaces with '-' if you prefer
    const cleaned = handle
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '');      // remove spaces completely
    setSlug(cleaned);
  }, [handle]);

  async function addArtist(e) {
    e.preventDefault();
    setMessage('Saving...');

    if (!slug) {
      setMessage('Error: handle/slug is empty or invalid');
      return;
    }

    const { error } = await supabase.from('artists').insert([
      {
        display_name: displayName,
        handle: handle,
        slug: slug,
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
      setWebsiteUrl('');
      // slug will auto-clear because handle cleared
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

      <form onSubmit={addArtist} style={{display:'grid', gap:'16px', marginTop:'24px'}}>

        {/* DISPLAY NAME */}
        <label>
          Display Name (can have spaces)<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
        </label>

        {/* HANDLE */}
        <label>
          Username (no spaces). This becomes their public ID and URL.<br />
          <input
            style={{width:'100%', padding:'8px'}}
            value={handle}
            onChange={e => setHandle(e.target.value)}
            placeholder="example: alexpainter"
            required
          />
        </label>

        {/* URL PREVIEW */}
        <div style={{
          fontSize:'13px',
          background:'#f5f5f5',
          border:'1px solid #ddd',
          borderRadius:'6px',
          padding:'8px'
        }}>
          Profile URL will be:<br />
          <code>
            https://pureart-alliance.vercel.app/artist/{slug || 'your-handle-here'}
          </code>
        </div>

        {/* WEBSITE */}
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
