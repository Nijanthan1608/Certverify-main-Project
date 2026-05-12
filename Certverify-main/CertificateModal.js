import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CertificatePreview } from './CertificateCard';
import { generateCertificatePDF } from '../../utils/pdfGenerator';

// A simple popup window that displays the visual CertificatePreview
export default function CertificateModal({ cert, onClose }) {
  if (!cert) return null; // Defensive check so the whole page doesn't crash if `cert` is blank

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)', // Blurs out everything behind the popup
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}
        onClick={onClose} // If the user clicks the dark background, close the window
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: '#111318', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, width: '100%', maxWidth: 840,
            maxHeight: '90vh', overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()} // Ensure clicking INSIDE the window doesn't accidentally trigger the close function
        >
          {/* ── Modal Header Row ── */}
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Certificate Preview</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              
              <button
                onClick={() => generateCertificatePDF(cert)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: 'none',
                  background: 'rgba(76,175,130,0.12)', color: '#4caf82',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
                  border: '1px solid rgba(76,175,130,0.2)',
                }}
              >
                ↓ Download PDF
              </button>
              
              <button
                onClick={onClose}
                style={{
                  background: '#1e2330', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                  color: '#8a909c', fontSize: 18, lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* ── Actual Certificate Graphic ── */}
          <div style={{ padding: 28, background: '#181c24' }}>
            <CertificatePreview cert={cert} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
