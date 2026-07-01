import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  AlertCircle, 
  Check, 
  X,
  FileCheck,
  Award
} from 'lucide-react';
import { TableSkeleton } from '../components/LoadingSkeleton';

export default function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  
  // Modal Details state
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalDetails, setModalDetails] = useState(null);
  
  // Status change state
  const [newStatus, setNewStatus] = useState('');
  const [comments, setComments] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');
  const SERVER_HOST = 'http://localhost:5000'; // For file serving

  const loadApplications = () => {
    setLoading(true);
    setErrorMsg('');
    const token = localStorage.getItem('adminToken');
    
    axios.get(`${API_BASE}/admin/applications`, {
      params: {
        search,
        status: statusFilter,
        departmentId: deptFilter
      },
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setApplications(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setErrorMsg('Failed to retrieve applications database.');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadApplications();
    
    // Load departments
    axios.get(`${API_BASE}/departments`)
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Error loading departments for filter", err));
  }, [search, statusFilter, deptFilter]);

  const viewApplicationDetails = (appId) => {
    setSelectedApp(appId);
    setModalLoading(true);
    setModalError('');
    setModalDetails(null);
    setComments('');
    
    const token = localStorage.getItem('adminToken');
    
    axios.get(`${API_BASE}/admin/applications/${appId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setModalDetails(res.data);
      setNewStatus(res.data.application.status);
      setModalLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setModalError('Failed to retrieve application file details.');
      setModalLoading(false);
    });
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setSubmittingStatus(true);
    const token = localStorage.getItem('adminToken');

    axios.post(`${API_BASE}/admin/applications/${selectedApp}/status`, {
      status: newStatus,
      comments: comments
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => {
      setSubmittingStatus(false);
      // Reload lists and refresh modal view
      loadApplications();
      viewApplicationDetails(selectedApp);
    })
    .catch((err) => {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating status');
      setSubmittingStatus(false);
    });
  };

  const getStatusBadge = (status) => {
    let color = '#475569';
    let bg = 'rgba(71,85,105,0.08)';
    if (status === 'Approved') {
      color = '#059669'; bg = 'rgba(5, 150, 105, 0.08)';
    } else if (status === 'Rejected') {
      color = '#dc2626'; bg = 'rgba(220, 38, 38, 0.08)';
    } else if (status === 'Under Verification') {
      color = '#d97706'; bg = 'rgba(217, 119, 6, 0.08)';
    }
    return (
      <span style={{ 
        padding: '4px 10px', 
        borderRadius: 'var(--radius-full)', 
        fontSize: '11px', 
        fontWeight: '700', 
        color, 
        backgroundColor: bg,
        border: `1px solid ${color}15`,
        display: 'inline-block'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Applications Portal</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Review academic profile records and update verify status.</p>
      </div>

      {/* Filter Control Box */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '24px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          alignItems: 'center',
          justifyContent: 'between'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input" 
            placeholder="Search by name, ID, email..." 
            style={{ paddingLeft: '44px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications List Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        {loading ? (
          <TableSkeleton cols={6} rows={6} />
        ) : errorMsg ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
            <p>{errorMsg}</p>
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>No applications match active filter criteria.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                <th style={{ padding: '12px 16px' }}>App ID</th>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Email</th>
                <th style={{ padding: '12px 16px' }}>Branch</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr 
                  key={app.id} 
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => viewApplicationDetails(app.id)}
                  className="hover:bg-slate-500/5"
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px', fontWeight: '700', color: 'var(--color-royal)' }}>{app.id}</td>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{app.full_name}</td>
                  <td style={{ padding: '16px' }}>{app.email}</td>
                  <td style={{ padding: '16px' }}>{app.department_code}</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(app.status)}</td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      className="btn-ripple btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); viewApplicationDetails(app.id); }}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-out details modal */}
      {selectedApp && (
        <div 
          style={{
            position: 'fixed',
            top: 0, right: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedApp(null)}
        >
          <div 
            style={{
              maxWidth: '650px',
              width: '100%',
              backgroundColor: 'var(--bg-secondary)',
              height: '100%',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              padding: '40px',
              overflowY: 'auto',
              borderLeft: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div style={{ display: 'flex', justify: 'between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.5px' }}>Application Record</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', marginTop: '4px' }}>{modalDetails?.application?.full_name || 'Loading File...'}</h3>
                <span style={{ fontSize: '14px', color: 'var(--color-royal)', fontWeight: '700' }}>ID: {selectedApp}</span>
              </div>
              <button 
                onClick={() => setSelectedApp(null)}
                style={{ padding: '8px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            {modalLoading ? (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-royal)' }} />
                <span>Opening Application Folder...</span>
              </div>
            ) : modalError ? (
              <div style={{ color: '#ef4444', textAlign: 'center', padding: '24px' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px auto' }} />
                <p>{modalError}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                
                {/* Profile Grid */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                    Candidate Profile
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>DOB: {modalDetails.application.dob}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>Gender: {modalDetails.application.gender}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{modalDetails.application.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{modalDetails.application.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                      <MapPin size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>Address: {modalDetails.application.address}</span>
                    </div>
                  </div>
                </div>

                {/* Parents Info */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                    Guardian Information
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                    <div>Parent: <strong>{modalDetails.application.parent_name}</strong></div>
                    <div>Phone: {modalDetails.application.parent_phone}</div>
                  </div>
                </div>

                {/* Applied Course info */}
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-primary)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Program</span>
                    <div style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>{modalDetails.application.department_code} - {modalDetails.application.department_name}</div>
                  </div>
                  {modalDetails.application.assigned_student_id && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student ID Assigned</span>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#059669' }}>{modalDetails.application.assigned_student_id}</div>
                    </div>
                  )}
                </div>

                {/* Uploaded Documents List with Preview links */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                    Uploaded Verification Files
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    {modalDetails.documents.map((doc) => {
                      const fileUrl = doc.file_path.startsWith('http') ? doc.file_path : `${SERVER_HOST}/${doc.file_path}`;
                      const isImage = doc.file_path.match(/\.(png|jpg|jpeg)$/i);
                      
                      return (
                        <div key={doc.id} style={{ 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-sm)', 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          backgroundColor: 'var(--bg-secondary)'
                        }}>
                          {isImage ? (
                            <img src={fileUrl} alt={doc.document_type} style={{ height: '70px', borderRadius: '4px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justify: 'center', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                              <FileCheck size={28} />
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700' }}>{doc.document_type}</span>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-royal)', fontWeight: '600' }}
                            >
                              Open File <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Update Form */}
                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Action Box / Verification Status
                  </h4>
                  
                  {modalDetails.application.status === 'Approved' ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.15)', color: '#059669' }}>
                      <Award size={20} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>This application is finalized and approved. No further actions required.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Set Verification Status</label>
                        <select 
                          value={newStatus} 
                          onChange={(e) => setNewStatus(e.target.value)} 
                          className="form-select"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Verification">Under Verification</option>
                          <option value="Approved">Approved (Enroll Student)</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Audit Remarks / Log Message</label>
                        <textarea 
                          value={comments} 
                          onChange={(e) => setComments(e.target.value)} 
                          rows="3" 
                          className="form-textarea" 
                          placeholder="Write feedback for the candidate regarding document statuses..."
                        ></textarea>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-ripple btn-primary"
                        disabled={submittingStatus}
                        style={{ padding: '12px', fontSize: '14px', display: 'flex', justifyContent: 'center', gap: '8px', opacity: submittingStatus ? 0.7 : 1 }}
                      >
                        {submittingStatus ? 'Updating Audit Log...' : 'Update Application Folder'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Audit Timeline */}
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                    Audit History / Progress Timeline
                  </h4>
                  <div className="timeline">
                    {modalDetails.timeline.map((log, idx) => {
                      const dt = new Date(log.updated_at);
                      const isApproved = log.status === 'Approved';
                      const isRejected = log.status === 'Rejected';
                      return (
                        <div key={log.id || idx} className="timeline-item">
                          <div className={`timeline-dot ${isApproved ? 'success' : isRejected ? 'danger' : 'active'}`} />
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                            <div style={{ display: 'flex', justify: 'between', flexWrap: 'wrap', gap: '6px' }}>
                              <strong>{log.status}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updater: {log.updater_name || 'System Auto'}</span>
                            <p style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{log.comments}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
