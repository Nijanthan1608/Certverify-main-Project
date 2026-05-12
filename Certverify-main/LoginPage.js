import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Framer motion lets us add smooth entrance animations to our page
import { motion } from 'framer-motion';
// React-hot-toast creates the floating "Success" or "Error" popups
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
// A helper function we built to pull clean error messages from the server
import { extractAxiosError } from '../utils/helpers';

// Reusable styling for the text input boxes so we don't have to write this twice
const inputStyle = {
  background: '#181c24', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px', fontSize: 14,
  color: '#f0f2f5', fontFamily: 'inherit', outline: 'none', width: '100%',
  transition: 'border-color .2s',
};

export default function LoginPage() {
  // Grab the 'login' function from our global authentication context
  const { login } = useAuth();
  // navigate allows us to redirect the user to a new page using React Router
  const navigate = useNavigate();
  
  // Track what the user types into the form
  const [form, setForm] = useState({ email: '', password: '' });
  // Track if we are currently waiting for the server to respond
  const [loading, setLoading] = useState(false);
  // Track if there was an error (like "Wrong password")
  const [error, setError] = useState('');

  // A helper function to easily update the form state when a user types
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // What happens when the user clicks "Sign In"
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from refreshing (default HTML form behavior)
    
    // Make sure they didn't leave fields blank
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    
    setLoading(true); 
    setError(''); // Clear out any old errors
    
    try {
      // Attempt to log in using the API
      await login(form);
      toast.success('Welcome back!');
      navigate('/'); // Go back to the homepage
    } catch (err) {
      // If it fails, pull out the exact error message and show it on screen
      setError(extractAxiosError(err));
    } finally {
      setLoading(false); // Done loading, whether it worked or failed
    }
  };

  return (
    // The background container that vertically and horizontally centers the login box
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      
      {/* motion.div gives the login box a soft slide-up-and-fade-in animation */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 40, width: '100%', maxWidth: 420 }}
      >
        {/* ── Header / Logo Area ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            {/* The little gold logo icon */}
            <div style={{ width: 36, height: 36, border: '1.5px solid #c8a96e', borderRadius: 9, display: 'grid', placeItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1L13 4v8L8 15 3 12V4z" stroke="#c8a96e" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" fill="#c8a96e"/></svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>Cert<span style={{ color: '#c8a96e' }}>Verify</span></span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#8a909c' }}>Sign in to your account</p>
        </div>

        {/* ── Error Banner ── */}
        {/* Only shows up if the `error` state is set (e.g. invalid password) */}
        {error && (
          <div style={{ marginBottom: 18, padding: '11px 14px', borderRadius: 9, background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', color: '#e05555', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── The Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8a909c', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 500, marginBottom: 6 }}>Email</label>
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="admin@institution.edu"
              onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.5)'} // Glow gold when clicked
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8a909c', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 500, marginBottom: 6 }}>Password</label>
            <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
              onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          </div>
          <button
            type="submit"
            disabled={loading} // Prevent double clicking
            style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: '#c8a96e', color: '#0a0c10', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', marginTop: 6, opacity: loading ? 0.7 : 1, transition: 'all .2s' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Link to Register page if they don't have an account */}
        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: '#4a5060' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#c8a96e', textDecoration: 'none', fontWeight: 500 }}>Register</Link>
        </div>

        {/* ── Development/Demo Only ── */}
        {/* Optional: Helpful text showing demo accounts for standard testers. */}
        <div style={{ marginTop: 20, padding: '12px 14px', background: '#181c24', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#4a5060', textAlign: 'center' }}>
          <div style={{ marginBottom: 4, fontWeight: 500, color: '#8a909c' }}>Demo credentials</div>
          <div>Admin: admin@demo.com / admin123</div>
          <div>User: user@demo.com / user123</div>
        </div>
      </motion.div>
    </div>
  );
}
