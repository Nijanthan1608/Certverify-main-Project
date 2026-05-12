import React from 'react';
import { motion } from 'framer-motion';
import { fmtDate, calcDuration } from '../../utils/helpers';
import { generateCertificatePDF } from '../../utils/pdfGenerator';

// A tiny helper component used in the grid to display "Label: Value" pairs neatly
const MetaItem = ({ label, value }) => (
  <div style={{
    background: '#181c24', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: '14px 16px',
  }}>
    <div style={{ fontSize: 11, color: '#4a5060', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: '#f0f2f5' }}>{value || '—'}</div>
  </div>
);

// ── The Big Green Summary Box ──
// This is the component shown on the Verify page when a certificate is successfully found
export const CertificateResult = ({ cert, onPreview }) => {
  // Calculate how long the internship was (e.g. "3 months")
  const dur = calcDuration(cert.startDate, cert.endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Verified Status Banner ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        padding: '12px 18px', borderRadius: 10,
        background: 'rgba(76,175,130,0.08)',
        border: '1px solid rgba(76,175,130,0.2)',
        color: '#4caf82', fontSize: 14,
      }}>
        {/* Checkmark icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M13 4L6.5 11 3 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Certificate verified successfully · ID: <strong>{cert.certificateId}</strong>
      </div>

      {/* ── Certificate Details Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <MetaItem label="Student Name" value={cert.studentName} />
        <MetaItem label="Domain" value={cert.domain} />
        <MetaItem label="Institution" value={cert.institution || 'N/A'} />
        <MetaItem label="Duration" value={dur} />
        <MetaItem label="Start Date" value={fmtDate(cert.startDate)} />
        <MetaItem label="End Date" value={fmtDate(cert.endDate)} />
      </div>

      {/* If the admin left any extra notes (like "Top Performer"), show them here */}
      {cert.notes && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.15)', borderRadius: 10, fontSize: 14, color: '#c8a96e' }}>
          <span style={{ fontWeight: 500 }}>Note: </span>{cert.notes}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          onClick={onPreview}
          style={{
            padding: '9px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', color: '#f0f2f5', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit', fontWeight: 500, transition: 'all .2s',
          }}
          onMouseEnter={e => e.target.style.background = '#1e2330'}
          onMouseLeave={e => e.target.style.background = 'transparent'}
        >
          Preview
        </button>
        <button
          onClick={() => generateCertificatePDF(cert)}
          style={{
            padding: '9px 20px', borderRadius: 9, border: 'none',
            background: '#c8a96e', color: '#0a0c10', cursor: 'pointer',
            fontSize: 13, fontFamily: 'inherit', fontWeight: 600, transition: 'all .2s',
          }}
          onMouseEnter={e => e.target.style.background = '#e8c990'}
          onMouseLeave={e => e.target.style.background = '#c8a96e'}
        >
          ↓ Download PDF
        </button>
      </div>
    </motion.div>
  );
};

// ── The Visual Print Layout ──
// This component literally draws what the final PDF document will look like.
export const CertificatePreview = ({ cert }) => {
  const dur = calcDuration(cert.startDate, cert.endDate);
  
  return (
    <div style={{
      background: '#f8f6f0', borderRadius: 14, padding: '48px 56px',
      position: 'relative', maxWidth: 720, margin: '0 auto',
      boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      fontFamily: 'inherit',
    }}>
      {/* ── Inner Gold Border Decoration ── */}
      <div style={{
        position: 'absolute', inset: 10,
        border: '1.5px solid rgba(200,169,110,0.4)',
        borderRadius: 10, pointerEvents: 'none', // pointerEvents:none stops the border from blocking text selection
      }} />

      {/* ── Header Area ── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#8a7a5a', marginBottom: 6 }}>
          Internship Programme · Certificate of Completion
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, lineHeight: 1.1, color: '#2a2218', letterSpacing: -1 }}>
          Certificate
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: 20, color: '#8a7a5a', marginTop: 2 }}>
          of Internship
        </div>
        {/* A tiny gold separator line */}
        <div style={{ width: 80, height: 2, background: '#c8a96e', margin: '16px auto 0' }} />
      </div>

      {/* ── Body Text Area ── */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: '#8a7a5a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>This is to certify that</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#2a2218', letterSpacing: -0.5, marginBottom: 10 }}>{cert.studentName}</div>
        <div style={{ fontSize: 14, color: '#5a5040', lineHeight: 1.8, maxWidth: 500, margin: '0 auto' }}>
          has successfully completed an internship in <strong>{cert.domain}</strong>
          {cert.institution && <> at <strong>{cert.institution}</strong></>},
          from <strong>{fmtDate(cert.startDate)}</strong> to <strong>{fmtDate(cert.endDate)}</strong>,
          a duration of <strong>{dur}</strong>.
          {cert.notes && <> {cert.notes}</>}
        </div>
      </div>

      {/* ── Footer / Signatures Area ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginTop: 28 }}>
        
        {/* Left Side: ID and Empty Signature line */}
        <div style={{ fontSize: 12, color: '#8a7a5a' }}>
          <div>Certificate ID</div>
          <div style={{ fontSize: 13, color: '#2a2218', fontWeight: 600, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{cert.certificateId}</div>
          <div style={{ borderTop: '1px solid rgba(200,169,110,0.4)', paddingTop: 8, marginTop: 8, fontSize: 11 }}>Authorised Signatory</div>
        </div>
        
        {/* Center: A fake Wax Seal logo for aesthetics */}
        <div style={{ width: 56, height: 56, border: '2px solid #c8a96e', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M12 2L15 9H22L16.5 13.5 18.5 21 12 17 5.5 21 7.5 13.5 2 9H9z" stroke="#c8a96e" strokeWidth="1.2" fill="rgba(200,169,110,0.15)"/>
          </svg>
        </div>
        
        {/* Right Side: Date and Director Signature Line */}
        <div style={{ fontSize: 12, color: '#8a7a5a', textAlign: 'right' }}>
          <div>Issue Date</div>
          <div style={{ fontSize: 13, color: '#2a2218', fontWeight: 600, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
            {fmtDate(new Date().toISOString())}
          </div>
          <div style={{ borderTop: '1px solid rgba(200,169,110,0.4)', paddingTop: 8, marginTop: 8, fontSize: 11 }}>Programme Director</div>
        </div>
        
      </div>
    </div>
  );
};
