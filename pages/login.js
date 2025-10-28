import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('Working...');

    if (mode === 'signup') {
      // 1. Create the auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setMessage('Error: ' + signUpError.message);
        return;
      }

      // 2. Create a matching profile row with default role 'voter'
      if (signUpData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: signUpData.user.id,
              display_name: email.split('@')[0], // simple default name
              role: 'voter',
            }
          ]);

        if (profileError) {
          setMessage('Signed up, but profile failed: ' + profileError.message);
          return;
        }
      }

      setMessage('Account created. You can now sign in.');
      setMode('signin');
      return;
    }

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setMessage('Error: ' + signInError.message);
        return;
      }

      // Logged in successfully
      window.location.href = '/directory';
      return;
    }
  }

  return (
    <main style={{
      maxWidth: 400,
      margin: '40px auto',
      padding: '0 16px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1>{mode === 'signin' ? 'Sign in' : 'Sign up'}</h1>

      <p style={{fontSize: '14px', color: '#666'}}>
        {mode === 'signin'
          ? 'Welcome back. Enter your details to sign in.'
          : 'Create a voter account. This lets you vote on artists.'}
      </p>

      <form onSubmit={handleSubmit} style={{display:'grid', gap:'12px', marginTop:'24px'}}>
        <label>
          Email<br />
          <input
            style={{width:'100%', padding:'8px'}}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password<br />
          <input
            style={{width:'100%', padding:'8px'}}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          style={{
            padding: '10px 14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      {message && (
        <p style={{marginTop:'16px', fontWeight:'bold'}}>{message}</p>
      )}

      <p style={{marginTop:'24px', fontSize:'14px', color:'#555'}}>
        {mode === 'signin' ? (
          <>
            Need an account?{' '}
            <button
              style={{color:'#0066cc', textDecoration:'underline', background:'none', border:'none', padding:0, cursor:'pointer'}}
              onClick={() => { setMode('signup'); setMessage(''); }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              style={{color:'#0066cc', textDecoration:'underline', background:'none', border:'none', padding:0, cursor:'pointer'}}
              onClick={() => { setMode('signin'); setMessage(''); }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </main>
  );
}
