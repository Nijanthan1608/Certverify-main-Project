import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import { extractAxiosError } from '../../utils/helpers';

// This component handles the drag-and-drop Excel file uploader in the admin dashboard
export default function BulkUpload({ onUploadSuccess }) {
  // Track if the user is currently dragging a file over the box
  const [dragging, setDragging] = useState(false);
  // Track if we are currently uploading and processing the file
  const [uploading, setUploading] = useState(false);
  // Track the progress bar (0 to 100)
  const [progress, setProgress] = useState(0);
  // Holds the success/error summary returned from the server after upload
  const [result, setResult] = useState(null);
  
  // A reference to the hidden HTML file input so we can trigger it when they click the box
  const fileRef = useRef();

  // The main function that runs when a file is dropped or selected
  const processFile = async (file) => {
    if (!file) return;
    
    // First, strictly check the file extension before bothering the server
    const allowed = ['xlsx', 'xls', 'csv'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Only .xlsx, .xls, and .csv files are supported');
      return;
    }

    setUploading(true);
    setResult(null);
    setProgress(20); // Jump automatically to 20% just to show it started

    try {
      // Create a fake progress bar animation that slowly ticks up to 80% while we wait for the server
      const timer = setInterval(() => setProgress((p) => Math.min(p + 15, 80)), 400);
      
      // Actually send the file to our backend
      const { data } = await adminService.bulkUpload(file);
      
      // Once the server replies, stop the fake timer and jump to 100%
      clearInterval(timer);
      setProgress(100);

      // Wait exactly 300ms so the user can actually see the progress bar hit 100%
      setTimeout(() => {
        setUploading(false);
        setResult(data);
        
        if (data.summary.added > 0) {
          toast.success(`Imported ${data.summary.added} certificate${data.summary.added !== 1 ? 's' : ''}`);
          // Let the parent page know we succeeded so it can refresh the table
          onUploadSuccess?.();
        } else {
          toast('No new certificates were added', { icon: 'ℹ️' });
        }
      }, 300);
    } catch (err) {
      // If it fails, stop the loader and show the error message
      setUploading(false);
      setProgress(0);
      toast.error(extractAxiosError(err));
    }
  };

  // When they physically drop a file onto the box
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div>
      {/* ── Drop Zone Box ── */}
      <div
        onClick={() => fileRef.current?.click()} // If they click, open the file picker
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} // They are hovering over it
        onDragLeave={() => setDragging(false)} // They moved away
        style={{
          border: `2px dashed ${dragging ? 'rgba(200,169,110,0.5)' : 'rgba(255,255,255,0.1)'}`, // Light up gold if dragging over
          borderRadius: 12, padding: '40px 24px', textAlign: 'center',
          cursor: 'pointer', transition: 'all .2s',
          background: dragging ? 'rgba(200,169,110,0.05)' : 'transparent',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => processFile(e.target.files[0])}
        />
        
        {/* Icon */}
        <div style={{
          width: 48, height: 48, margin: '0 auto 14px',
          background: '#1e2330', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, display: 'grid', placeItems: 'center',
          transition: 'border-color .2s',
          borderColor: dragging ? 'rgba(200,169,110,0.3)' : undefined,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 14V4M7 8l4-4 4 4" stroke="#c8a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17h16" stroke="#8a909c" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
          {dragging ? 'Drop to upload' : 'Drop your Excel file here'}
        </div>
        <div style={{ fontSize: 13, color: '#8a909c' }}>
          or click to browse · .xlsx, .xls, .csv supported
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginTop: 14 }}
          >
            {/* Show a helpful message depending on how far along we are */}
            <div style={{ fontSize: 13, color: '#8a909c', marginBottom: 8 }}>
              {progress < 50 ? 'Reading file...' : progress < 85 ? 'Validating records...' : 'Saving to database...'}
            </div>
            {/* The actual bar */}
            <div style={{ height: 4, background: '#1e2330', borderRadius: 2, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', background: '#c8a96e', borderRadius: 2 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload Result Banner ── */}
      <AnimatePresence>
        {result && !uploading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 14 }}
          >
            {/* Show green if we successfully added SOME records, otherwise show gold/yellow */}
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: result.summary.added > 0 ? 'rgba(76,175,130,0.08)' : 'rgba(200,169,110,0.08)',
              border: `1px solid ${result.summary.added > 0 ? 'rgba(76,175,130,0.2)' : 'rgba(200,169,110,0.2)'}`,
              color: result.summary.added > 0 ? '#4caf82' : '#c8a96e',
              fontSize: 14,
            }}>
              ✓ {result.summary.added} added · {result.summary.skipped} duplicates skipped
              {result.summary.validationErrors > 0 && ` · ${result.summary.validationErrors} row errors`}
            </div>
            
            {/* If specific rows failed (like missing an ID or Date), list them out here so the admin can fix them */}
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#8a909c', maxHeight: 100, overflowY: 'auto' }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {e.message || JSON.stringify(e)}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Help Text: Column Specification ── */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        background: '#181c24', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 11, color: '#4a5060', letterSpacing: '0.4px', textTransform: 'uppercase', fontWeight: 500, marginBottom: 8 }}>
          Required columns
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['certificate_id', 'student_name', 'domain', 'start_date', 'end_date'].map((col) => (
            <span key={col} style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 100,
              background: '#1e2330', border: '1px solid rgba(255,255,255,0.08)',
              color: '#8a909c', fontFamily: "'DM Mono', monospace",
            }}>
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
