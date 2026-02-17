import React, { useState, useEffect } from 'react';
// @ts-ignore - dev: router dependency may not be installed in this environment
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Account created — check your email to confirm (if enabled).');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed in successfully.');
        // redirect to chat after successful sign in
        navigate('/chat');
      }
    }

    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto', padding: '1rem' }}>
      <h2>{isSignUp ? 'Create account' : 'Sign in'}</h2>
      {user ? (
        <div>
          <p>Signed in as {user.email}</p>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      ) : (
        <form onSubmit={handleAuth}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: 6 }}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label style={{ display: 'block', marginBottom: 8 }}>
            Password
            <input
              style={{ display: 'block', width: '100%', padding: '8px', marginTop: 6 }}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <button type="submit" disabled={loading || !email || !password}>
            {loading ? (isSignUp ? 'Creating...' : 'Signing in...') : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => {
            setIsSignUp((s) => !s);
            setMessage('');
          }}
        >
          {isSignUp ? 'Have an account? Sign in' : "Don't have an account? Create one"}
        </button>
      </div>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}

