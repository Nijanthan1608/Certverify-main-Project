import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { certService } from '../../services/api';
import { fmtDate, extractAxiosError } from '../../utils/helpers';

// Helper component that creates a small colored pill (e.g., Active in Green, Domain in Gold)
const Badge = ({ children, color = 'gold' }) => {
  const colors = {
    gold: { bg: 'rgba(200,169,110,0.12)', text: '#c8a96e', border: 'rgba(200,169,110,0.2)' },
    green: { bg: 'rgba(76,175,130,0.1)', text: '#4caf82', border: 'rgba(76,175,130,0.2)' },
    dim: { bg: '#1e2330', text: '#8a909c', border: 'rgba(255,255,255,0.08)' },
  };
  const c = colors[color];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 100, fontSize: 11, fontWeight: 500, letterSpacing: '0.3px',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>
      {children}
    </span>
  );
};

// The main table Component used on the Admin Dashboard to list out all certificates
export default function CertificateTable({ certs, onEdit, onView, onRefresh }) {
  // Track which certificate is actively being deleted so we can disable the button
  const [deletingId, setDeletingId] = useState(null);
  // Track which row the mouse is currently hovering over to slightly highlight it
  const [hoverRow, setHoverRow] = useState(null);

  // Triggered when an admin clicks the "Delete" button
  const handleDelete = async (certId) => {
    // Standard browser confirmation dialog to prevent accidental clicks
    if (!window.confirm(`Delete certificate "${certId}"? This action cannot be undone.`)) return;
    
    setDeletingId(certId);
    try {
      // Tell server to delete
      await certService.delete(certId);
      toast.success('Certificate deleted');
      // Tell the parent dashboard component to query the database again to pull the fresh list
      onRefresh?.();
    } catch (err) {
      toast.error(extractAxiosError(err));
    } finally {
      setDeletingId(null);
    }
  };

  // If there is literally no data, show a friendly empty state instead of a weird empty table header
  if (!certs || certs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5060' }}>
        <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.4 }}>📋</div>
        <div style={{ fontSize: 16, fontWeight: 500, color: '#8a909c', marginBottom: 6 }}>No certificates yet</div>
        <div style={{ fontSize: 14 }}>Upload an Excel file or add manually</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        
        {/* Table Headers */}
        <thead>
          <tr>
            {['Certificate ID', 'Student Name', 'Domain', 'Duration', 'Status', 'Actions'].map((h) => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: 'left',
                color: '#4a5060', fontWeight: 500,
                fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        
        {/* Table Rows generated automatically from the `certs` array */}
        <tbody>
          <AnimatePresence>
            {certs.map((cert, i) => (
              <motion.tr
                key={cert.certificateId || cert._id}
                // Each row slides in slightly delayed based on its position `i`
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.03 }}
                // Hover effect logic
                onMouseEnter={() => setHoverRow(cert.certificateId)}
                onMouseLeave={() => setHoverRow(null)}
                style={{ background: hoverRow === cert.certificateId ? '#181c24' : 'transparent', transition: 'background .15s' }}
              >
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#c8a96e' }}>
                    {cert.certificateId}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 500 }}>
                  {cert.studentName}
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Badge color="gold">{cert.domain}</Badge>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#8a909c', fontSize: 12 }}>
                  {fmtDate(cert.startDate)} – {fmtDate(cert.endDate)}
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <Badge color="green">Active</Badge>
                </td>
                <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* Render the 3 action buttons: View, Edit, Delete */}
                    {[
                      { label: 'View', onClick: () => onView?.(cert), color: 'rgba(255,255,255,0.06)', textColor: '#f0f2f5' },
                      { label: 'Edit', onClick: () => onEdit?.(cert), color: 'rgba(255,255,255,0.06)', textColor: '#f0f2f5' },
                      { label: deletingId === cert.certificateId ? '...' : 'Delete', onClick: () => handleDelete(cert.certificateId), color: 'rgba(224,85,85,0.1)', textColor: '#e05555' },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={btn.onClick}
                        disabled={deletingId === cert.certificateId}
                        style={{
                          padding: '5px 12px', borderRadius: 7,
                          border: `1px solid ${btn.color}`, background: btn.color,
                          color: btn.textColor, cursor: 'pointer',
                          fontSize: 12, fontFamily: 'inherit', fontWeight: 500,
                          transition: 'all .15s',
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
