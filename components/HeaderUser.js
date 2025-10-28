import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HeaderUser() {
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
    <div style={{
      background:'#f5f5f5',
      borderBottom:'1px solid #ddd',
      padding:'8px 16px',
      fontFamily:'system-ui, sans-serif',
      fontSize:'14px',
      color:'#333',
      display:'flex',
      justifyContent:'space-between'
    }}>
      <div>
        <a href="/" style={{color:'#333', textDecoration:'none', fontWeight:'bold'}}>
          PureArt Alliance
        </a>
      </div>
      <div>
        {userEmail ? (
          <>Signed in as {userEmail}</>
        ) : (
          <a href="/login" style={{color:'#0066cc'}}>Not signed in</a>
        )}
      </div>
    </div>
  );
}
