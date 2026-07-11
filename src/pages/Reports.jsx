import React, { useState, useEffect } from 'react';
import { Download, FileText, Users, BarChart2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Reports() {
  const [generating, setGenerating] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const response = await axios.get(`${API_BASE}/reports/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setStatsError(err.response?.data?.message || 'Failed to load report data from the server.');
    } finally {
      setLoadingStats(false);
    }
  };

  const generateReport = async () => {
    setGenerating('pdf');
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await axios.get(`${API_BASE}/reports/generate?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Important for file downloads
      });
      
      const fileName = `comprehensive_report_${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      setSuccessMsg(`${fileName} downloaded successfully!`);
    } catch (err) {
      setErrorMsg('Error generating PDF report. Please try again.');
    } finally {
      setGenerating('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Institutional Reports</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          View live statistics and export comprehensive data for academic audits and accreditation purposes.
        </p>
      </div>

      {/* Success/Error Banners */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#059669' }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{successMsg}</span>
        </div>
      )}
      
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)', color: '#dc2626' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{errorMsg}</span>
        </div>
      )}

      {/* Stats Dashboard */}
      {loadingStats ? (
        <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-royal)' }} />
          <p style={{ fontSize: '15px', fontWeight: '500' }}>Loading real-time report data...</p>
        </div>
      ) : statsError ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Failed to Load Data</h3>
          <p style={{ fontSize: '14px' }}>{statsError}</p>
        </div>
      ) : !stats || stats.total_applications === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
          <FileText size={48} style={{ opacity: 0.5 }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>No Reports Available</h3>
          <p style={{ fontSize: '14px' }}>There is currently no application or student data in the database to display.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Summary Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <StatCard label="Total Applications" value={stats.total_applications} color="var(--color-royal)" icon={FileText} />
            <StatCard label="Pending Applications" value={stats.pending_applications} color="#d97706" icon={BarChart2} />
            <StatCard label="Approved Applications" value={stats.approved_applications} color="#059669" icon={CheckCircle} />
            <StatCard label="Rejected Applications" value={stats.rejected_applications} color="#dc2626" icon={AlertCircle} />
            <StatCard label="Total Enrolled Students" value={stats.total_students} color="var(--color-purple)" icon={Users} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Department Wise Stats */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Department-wise Admissions</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', fontWeight: '600' }}>Dept Code</th>
                      <th style={{ padding: '12px 8px', fontWeight: '600' }}>Applications</th>
                      <th style={{ padding: '12px 8px', fontWeight: '600' }}>Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.department_wise.map(d => (
                      <tr key={d.code} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: 'var(--color-sky)' }}>{d.code}</td>
                        <td style={{ padding: '12px 8px' }}>{d.apps_count}</td>
                        <td style={{ padding: '12px 8px' }}>{d.students_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Approvals */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Admissions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recent_approvals.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No recent admissions.</p>
                ) : (
                  stats.recent_approvals.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>{s.full_name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {s.id}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-purple)' }}>{s.department_code}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.enroll_date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Report Card */}
      {!loadingStats && stats && stats.total_applications > 0 && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-royal)', flexShrink: 0 }}>
              <FileText size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: '700', lineHeight: '1.3' }}>Comprehensive Institutional Report</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '6px' }}>
                Download a fully formatted PDF containing all summary statistics, department analytics, and recent application/admission records.
              </p>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={generateReport}
              disabled={!!generating}
              style={{
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: generating ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.7 : 1,
                width: 'fit-content'
              }}
            >
              {generating === 'pdf' ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF...</>
              ) : (
                <><Download size={16} /> Export as PDF</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="glass-panel" style={{ padding: '24px', backgroundColor: 'rgba(37,99,235,0.03)', border: '1px solid rgba(37,99,235,0.1)' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-royal)', marginBottom: '12px' }}>📋 Report Usage Guidelines</h4>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '2', paddingLeft: '20px' }}>
          <li>Reports are generated from live database data at the time of export.</li>
          <li>PDF reports are formatted for printing with TMEC letterhead and institutional styling.</li>
          <li>Store downloaded reports securely as they contain sensitive student data.</li>
          <li>For accreditation audits, we recommend generating comprehensive reports monthly.</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${color}` }}>
      <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: `${color}15`, color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1' }}>{value}</h3>
      </div>
    </div>
  );
}
