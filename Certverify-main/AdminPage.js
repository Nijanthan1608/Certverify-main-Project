import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { certService, adminService } from '../services/api';
import BulkUpload from '../components/admin/BulkUpload';
import CertificateTable from '../components/admin/CertificateTable';
import CertificateFormModal from '../components/admin/CertificateFormModal';
import CertificateModal from '../components/certificate/CertificateModal';
import { extractAxiosError } from '../utils/helpers';

// A tiny widget used at the top of the admin dashboard to show a single statistic
const StatCard = ({ label, value, accent }) => (
  <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
    <div style={{ fontSize: 11, color: '#4a5060', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: accent || '#f0f2f5', letterSpacing: -0.5 }}>{value}</div>
  </div>
);

// The different pages available inside the admin dashboard
const TABS = ['Certificates', 'Bulk Upload', 'Users'];

export default function AdminPage() {
  // Track which tab the admin is currently viewing
  const [tab, setTab] = useState('Certificates');
  
  // Data lists pulled from the server
  const [certs, setCerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  
  // Pagination and search settings
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Track state for the pop-up windows
  const [formCert, setFormCert] = useState(null); // Which cert are we editing? (null if creating new)
  const [showForm, setShowForm] = useState(false); // Should we show the Edit/Create form?
  const [previewCert, setPreviewCert] = useState(null); // Which cert are we previewing the PDF of?

  // ── Data Fetching Functions ──

  // Pulls the paginated list of certificates from the server
  const loadCerts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await certService.getAll({ page, limit: 15, search });
      setCerts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(extractAxiosError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  // Pulls the top-level numbers for the metric cards
  const loadStats = async () => {
    try {
      const { data } = await adminService.getDashboard();
      setStats(data.stats);
    } catch {}
  };

  // Pulls the list of all registered accounts on the platform
  const loadUsers = async () => {
    try {
      const { data } = await adminService.getUsers();
      setUsers(data.users);
    } catch {}
  };

  // Trigger data loads when the page opens or when tabs/pages change
  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadCerts(); }, [loadCerts]);
  useEffect(() => { if (tab === 'Users') loadUsers(); }, [tab]);

  // Handle banning or un-banning a user
  const handleToggleUser = async (id) => {
    try {
      const { data } = await adminService.toggleUser(id);
      toast.success(data.message);
      loadUsers(); // Refresh the list of users to show the new status
    } catch (err) {
      toast.error(extractAxiosError(err));
    }
  };

  // ── Search Debounce Logic ──
  // Instead of searching the database on EVERY single keystroke, we wait 350ms after they stop typing.
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadCerts(); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
      {/* ── Dashboard Header ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, letterSpacing: -0.5, marginBottom: 4 }}>Admin Dashboard</h2>
          <p style={{ color: '#8a909c', fontSize: 14 }}>Manage certificates, upload data, and monitor the system.</p>
        </div>
        
        {/* Button to manually type in a single new certificate */}
        <button
          onClick={() => { setFormCert(null); setShowForm(true); }}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#c8a96e', color: '#0a0c10', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
        >
          + Add Certificate
        </button>
      </motion.div>

      {/* ── Metric Cards ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Certificates" value={stats.totalCertificates ?? '—'} accent="#c8a96e" />
        <StatCard label="Active Users" value={stats.totalUsers ?? '—'} />
        <StatCard label="Domains" value={stats.totalDomains ?? '—'} />
        <StatCard label="Verification Rate" value="100%" accent="#4caf82" />
      </motion.div>

      {/* ── Tab Navigation ── */}
      <div style={{ display: 'flex', gap: 2, background: '#181c24', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', fontFamily: 'inherit',
              background: tab === t ? '#1e2330' : 'transparent',
              color: tab === t ? '#f0f2f5' : '#8a909c',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
              transition: 'all .2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Certificates List ── */}
      {tab === 'Certificates' && (
        <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden' }}>
          {/* List Header and Search bar */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>All Certificates</div>
              <div style={{ fontSize: 13, color: '#8a909c', marginTop: 2 }}>{pagination.total ?? 0} records</div>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search certificates..."
              style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 14px', fontSize: 13, color: '#f0f2f5', fontFamily: 'inherit', outline: 'none', width: 220 }}
            />
          </div>
          
          {/* If the server is still thinking, spin a circle. Otherwise, show the table component */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#4a5060' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(200,169,110,0.15)', borderTopColor: '#c8a96e', margin: '0 auto 10px' }} />
              Loading...
            </div>
          ) : (
            <CertificateTable
              certs={certs}
              onEdit={(c) => { setFormCert(c); setShowForm(true); }} // Open the edit form and pass it the data
              onView={(c) => setPreviewCert(c)} // Open the PDF previewer
              onRefresh={loadCerts} // Let the table trigger a reload if an item gets deleted
            />
          )}

          {/* Pagination controls at the bottom of the table */}
          {pagination.pages > 1 && (
            <div style={{ padding: '16px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#8a909c' }}>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage((p) => p - 1)} disabled={!pagination.hasPrev}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#f0f2f5', cursor: pagination.hasPrev ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, opacity: pagination.hasPrev ? 1 : 0.4 }}>
                  ← Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNext}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#f0f2f5', cursor: pagination.hasNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: 13, opacity: pagination.hasNext ? 1 : 0.4 }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Bulk Upload ── */}
      {tab === 'Bulk Upload' && (
        <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Bulk Upload via Excel</div>
            <div style={{ fontSize: 13, color: '#8a909c', marginTop: 2 }}>
              Upload .xlsx or .csv with columns: certificate_id, student_name, domain, start_date, end_date
            </div>
          </div>
          <div style={{ padding: 24 }}>
            {/* The actual drag-and-drop excel uploader component */}
            <BulkUpload onUploadSuccess={() => { loadCerts(); loadStats(); setTab('Certificates'); }} />
          </div>
        </div>
      )}

      {/* ── Tab 3: Users Directory ── */}
      {tab === 'Users' && (
        <div style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>User Management</div>
            <div style={{ fontSize: 13, color: '#8a909c', marginTop: 2 }}>{users.length} registered users</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#4a5060', fontWeight: 500, fontSize: 11, letterSpacing: '0.5px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#8a909c' }}>{u.email}</td>
                    
                    {/* Role styling: show 'admin' as gold text, regular users as grey text */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: u.role === 'admin' ? 'rgba(200,169,110,0.12)' : '#1e2330', color: u.role === 'admin' ? '#c8a96e' : '#8a909c', border: `1px solid ${u.role === 'admin' ? 'rgba(200,169,110,0.2)' : 'rgba(255,255,255,0.08)'}` }}>{u.role}</span>
                    </td>
                    
                    {/* Active styling: show active as green, banned/inactive as red */}
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 100, background: u.isActive ? 'rgba(76,175,130,0.1)' : 'rgba(224,85,85,0.1)', color: u.isActive ? '#4caf82' : '#e05555', border: `1px solid ${u.isActive ? 'rgba(76,175,130,0.2)' : 'rgba(224,85,85,0.2)'}` }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#8a909c', fontSize: 12 }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <button
                        onClick={() => handleToggleUser(u._id)}
                        style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: u.isActive ? '#e05555' : '#4caf82', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Hidden Modals that pop up when requested ── */}
      
      {/* The Create/Edit form popup window */}
      {showForm && (
        <CertificateFormModal
          cert={formCert}
          onClose={() => { setShowForm(false); setFormCert(null); }}
          onSuccess={() => { loadCerts(); loadStats(); }} // Force the dashboard to refresh if they saved a new one
        />
      )}
      
      {/* The PDF Preview pop up window */}
      {previewCert && (
        <CertificateModal cert={previewCert} onClose={() => setPreviewCert(null)} />
      )}
    </div>
  );
}
