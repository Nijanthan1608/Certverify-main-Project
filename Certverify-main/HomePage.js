import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Framer motion allows for elements to gracefully slide in when the page loads
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
// Import our API service to talk to the backend
import { certService } from '../services/api';

// A reusable animation preset that makes elements slide up and fade in
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 }, // Start slightly below and invisible
  animate: { opacity: 1, y: 0 },  // End at exact position and fully visible
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }, // Smooth speed curve
});

// A mini-component used to render the 3 numbers in the middle of the screen
const StatCard = ({ num, label, delay }) => (
  <motion.div
    {...fadeUp(delay)}
    style={{
      background: '#111318', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: 24, textAlign: 'center',
    }}
  >
    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: '#c8a96e', letterSpacing: -1 }}>{num}</div>
    <div style={{ fontSize: 13, color: '#8a909c', marginTop: 4, letterSpacing: '0.3px' }}>{label}</div>
  </motion.div>
);

export default function HomePage() {
  const navigate = useNavigate();
  // Get information about the person currently looking at the page
  const { user, isAdmin } = useAuth();
  
  // Track what text they put in the search bar
  const [query, setQuery] = useState('');
  // Track the statistics for the database (how many certs total exist)
  const [stats, setStats] = useState({ totalCertificates: 0, totalDomains: 0 });

  // When the page first loads, ask the server for the latest statistics
  useEffect(() => {
    certService.getStats()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {}); // If stats fail to load, silently fail so we don't break the whole page
  }, []);

  // When they press "Search" on the homepage
  const handleSearch = (e) => {
    e.preventDefault();
    // If they typed something, redirect them to the Verify screen and pass the ID in the URL
    if (query.trim()) navigate(`/verify?id=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>

      {/* ── Hero Section (Top part of page) ── */}
      <div style={{ textAlign: 'center', padding: '80px 0 60px' }}>
        
        {/* Tiny pill badge saying "Trusted Certificate Infrastructure" */}
        <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', background: 'rgba(200,169,110,0.1)',
            border: '1px solid rgba(200,169,110,0.2)', borderRadius: 100,
            fontSize: 11, fontWeight: 500, color: '#c8a96e', letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5H11L8.5 6.5 9.5 10 6 8 2.5 10 3.5 6.5 1 4.5H4.5z" fill="#c8a96e"/></svg>
            Trusted Certificate Infrastructure
          </span>
        </motion.div>

        {/* Big Giant Title */}
        <motion.h1 {...fadeUp(0.08)} style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(48px, 7vw, 82px)', lineHeight: 1.05,
          letterSpacing: -2, marginBottom: 20, color: '#f0f2f5',
        }}>
          Verify with<br />
          <em style={{ fontStyle: 'italic', color: '#c8a96e' }}>Confidence</em>
        </motion.h1>

        {/* Subtitle description */}
        <motion.p {...fadeUp(0.14)} style={{ fontSize: 17, color: '#8a909c', maxWidth: 500, margin: '0 auto 40px', lineHeight: 1.7 }}>
          Issue, search, and verify internship certificates instantly. Built for institutions that value precision and trust.
        </motion.p>

        {/* ── Search Bar ── */}
        <motion.form {...fadeUp(0.2)} onSubmit={handleSearch} style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter certificate ID (e.g. CERT-2024-001)"
            style={{
              width: '100%', padding: '18px 170px 18px 24px',
              background: '#111318', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, fontSize: 15, color: '#f0f2f5', fontFamily: 'inherit', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {/* A button that floats cleanly right over the end of the text box */}
          <button
            type="submit"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              padding: '11px 24px', background: '#c8a96e', color: '#0a0c10',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Search
          </button>
        </motion.form>

        <motion.p {...fadeUp(0.25)} style={{ marginTop: 12, fontSize: 13, color: '#4a5060' }}>
          Enter your certificate ID exactly as provided by your institution
        </motion.p>

        {/* ── Quick Action Buttons ── */}
        <motion.div {...fadeUp(0.28)} style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/verify')}
            style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: '#c8a96e', color: '#0a0c10', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}
          >
            Verify a Certificate
          </button>
          
          {/* ONLY SHOW THIS BUTTON IF THE USER IS LOGGED IN AS AN ADMIN */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#f0f2f5', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}
            >
              Admin Dashboard
            </button>
          )}
        </motion.div>
      </div>

      {/* ── Statistics Area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 60 }}>
        <StatCard num={stats.totalCertificates} label="Certificates Issued" delay={0.3} />
        <StatCard num={stats.totalDomains} label="Internship Domains" delay={0.36} />
        {/* We hardcode 100% here as a stylistic choice for the UI */}
        <StatCard num="100%" label="Verification Rate" delay={0.42} />
      </div>

      {/* ── Features List (Bottom of the page) ── */}
      <motion.div {...fadeUp(0.5)}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, letterSpacing: -0.5, marginBottom: 8 }}>
            Everything you need
          </h2>
          <p style={{ color: '#8a909c', fontSize: 15 }}>A complete certificate lifecycle platform.</p>
        </div>
        
        {/* A CSS Grid that automatically spaces out these 4 feature cards perfectly */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { icon: '🔒', title: 'Secure Auth', desc: 'Role-based access control with JWT authentication. Admins and students have separate workflows.' },
            { icon: '📊', title: 'Bulk Import', desc: 'Upload hundreds of certificates at once via Excel or CSV. Smart column detection handles any format.' },
            { icon: '🔍', title: 'Instant Verify', desc: 'Search any certificate by ID and get verified results in milliseconds, anywhere in the world.' },
            { icon: '📄', title: 'PDF Download', desc: 'Generate beautiful, print-ready PDF certificates with proper formatting, seals, and signatures.' },
          ].map((f) => (
            <div key={f.title} style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#8a909c', lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
