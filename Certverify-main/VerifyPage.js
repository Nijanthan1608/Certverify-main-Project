import React, { useState, useEffect } from 'react';
// These tools logic let us pull data out of the web browser's URL (like www.mywebsite.com?id=123)
import { useSearchParams, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
// The API connection tool that talks to our backend to actually check if the certificate is real
import { certService } from '../services/api';
// The big green box that shows up when a certificate is real
import { CertificateResult } from '../components/certificate/CertificateCard';
// The popup window that lets a user download the certificate as a PDF
import CertificateModal from '../components/certificate/CertificateModal';
import { extractAxiosError } from '../utils/helpers';

export default function VerifyPage() {
  // `useSearchParams` pulls queries like "?id=1234"
  const [searchParams] = useSearchParams();
  // `useParams` pulls direct URL paths like "/verify/1234"
  const { certId } = useParams();
  
  // Tracks what's currently typed in the ID text box
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  // Holds the actual verified certificate data if the server finds it
  const [cert, setCert] = useState(null);
  const [error, setError] = useState('');
  // Controls if the PDF download popup is visible
  const [showModal, setShowModal] = useState(false);

  // The actual function that talks to the server to check the ID
  const doVerify = async (id) => {
    // If we passed an ID explicitly, use that. Otherwise, use whatever is in the text box `query`
    const searchId = (id || query).trim();
    if (!searchId) { setError('Please enter a certificate ID'); return; }
    
    // Reset our state for a fresh search
    setLoading(true); setError(''); setCert(null);
    try {
      // Send the ID to the server
      const { data } = await certService.verify(searchId);
      // If found, save it to `cert`. This will trigger the screen to show the green details box
      setCert(data.certificate);
    } catch (err) {
      // If it fails (like "Certificate Not Found" or revoked), show the error
      setError(extractAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-search: If a user clicks a direct link to a certificate, we immediately search for it
  useEffect(() => {
    const urlId = certId || searchParams.get('id');
    if (urlId) { 
      setQuery(urlId); // Fill the text box
      doVerify(urlId); // Kick off the search immediately
    }
  }, []); // Empty array means this only happens once when the page loads

  // Allow users to press "Enter" on their keyboard to search instead of having to click the button
  const handleKeyDown = (e) => { if (e.key === 'Enter') doVerify(); };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, letterSpacing: -0.5, marginBottom: 8 }}>
          Certificate Verification
        </h2>
        <p style={{ color: '#8a909c', fontSize: 15, marginBottom: 28 }}>
          Search for any issued certificate using the unique certificate ID.
        </p>

        {/* ── Search Bar Panel ── */}
        <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 24, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter certificate ID (e.g. CERT-2024-001)"
              style={{
                width: '100%', padding: '16px 160px 16px 20px',
                background: '#181c24', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 11, fontSize: 15, color: '#f0f2f5', fontFamily: 'inherit', outline: 'none',
                transition: 'border-color .2s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button
              onClick={() => doVerify()}
              disabled={loading}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                padding: '10px 22px', background: '#c8a96e', color: '#0a0c10',
                border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Searching...' : 'Verify'}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 9,
                background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)',
                color: '#e05555', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {error}
            </motion.div>
          )}
        </div>

        {/* ── Loading Spinner ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(200,169,110,0.15)', borderTopColor: '#c8a96e', margin: '0 auto 12px' }}
            />
            <div style={{ color: '#4a5060', fontSize: 14 }}>Verifying certificate...</div>
          </div>
        )}

        {/* ── Success Result Area ── */}
        {/* Only render this big green box if a cert was successfully found and we aren't currently loading */}
        {cert && !loading && (
          <CertificateResult
            cert={cert}
            onPreview={() => setShowModal(true)} // Open the PDF view if they click Preview
          />
        )}

        {/* ── Empty State ── */}
        {/* What to show when nothing has been searched yet */}
        {!cert && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5060' }}>
            <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.4 }}>🔍</div>
            <div style={{ fontSize: 16, color: '#8a909c', marginBottom: 6 }}>Enter a certificate ID to verify</div>
            <div style={{ fontSize: 14 }}>The ID is provided by the institution that issued the certificate</div>
          </div>
        )}
      </motion.div>

      {/* ── The PDF Modal Popup ── */}
      {showModal && cert && (
        <CertificateModal cert={cert} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
