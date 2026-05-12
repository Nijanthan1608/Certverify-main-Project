import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { extractAxiosError } from '../utils/helpers';

// Reusable input styling for consistency
const inputStyle = {
  background: '#181c24', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px', fontSize: 14,
  color: '#f0f2f5', fontFamily: 'inherit', outline: 'none', width: '100%',
  transition: 'border-color .2s',
};

// A mini-component just for this file to wrap form labels around inputs neatly
const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: '#8a909c', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 500, marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Track all the different fields for creating a new account (including a confirmation password)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helpers to deal with user text changes and clicking into/out of input boxes
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const focus = (e) => { e.target.style.borderColor = 'rgba(200,169,110,0.5)'; }; // Glow effect
  const blur = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; };  // Normal effect

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ── Client-Side Validation ──
    // Stop the user here if they made an obvious mistake before bothering the server
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    
    setLoading(true); setError('');
    
    try {
      // Create the account using the API
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      // If it works, popup success
      toast.success('Account created successfully!');
      // Send them to the homepage where they will automatically be logged in
      navigate('/');
    } catch (err) {
      setError(extractAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      {/* ── Slide in animation ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 40, width: '100%', maxWidth: 440 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, border: '1.5px solid #c8a96e', borderRadius: 9, display: 'grid', placeItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M8 1L13 4v8L8 15 3 12V4z" stroke="#c8a96e" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" fill="#c8a96e"/></svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>Cert<span style={{ color: '#c8a96e' }}>Verify</span></span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 6 }}>Create account</h1>
          <p style={{ fontSize: 14, color: '#8a909c' }}>Get started with CertVerify</p>
        </div>

        {error && (
          <div style={{ marginBottom: 18, padding: '11px 14px', borderRadius: 9, background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', color: '#e05555', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── The Registration Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Note how we reuse the `<Field>` helper component we made at the top! */}
          <Field label="Full Name">
            <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Your full name" onFocus={focus} onBlur={blur} />
          </Field>
          <Field label="Email Address">
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="you@institution.edu" onFocus={focus} onBlur={blur} />
          </Field>
          
          {/* We let users pick if they are an admin or a regular user (for demonstration purposes) */}
          <Field label="Role">
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={set('role')} onFocus={focus} onBlur={blur}>
              <option value="user">Student / Verifier</option>
              {/* <option value="admin">Administrator</option> */}
            </select>
          </Field>
          
          <Field label="Password">
            <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" onFocus={focus} onBlur={blur} />
          </Field>
          <Field label="Confirm Password">
            <input style={inputStyle} type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" onFocus={focus} onBlur={blur} />
          </Field>
          
          <button
            type="submit"
            disabled={loading} // Prevent double clicking
            style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: '#c8a96e', color: '#0a0c10', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', marginTop: 6, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: '#4a5060' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#c8a96e', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
