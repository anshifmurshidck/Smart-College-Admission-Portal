import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  Award,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { TableSkeleton } from '../components/LoadingSkeleton';

const getOcrReport = (app, timeline) => {
  // 1. First try database columns
  if (app && app.ocr_status && app.ocr_status !== 'Not Processed') {
    try {
      const details = app.ocr_details ? JSON.parse(app.ocr_details) : {};
      return {
        ocrStatus: app.ocr_status,
        details: details
      };
    } catch (e) {
      // ignore JSON parse error
    }
  }
  
  // 2. Fallback to status history timeline comment
  if (timeline && timeline.length > 0) {
    const firstLog = timeline.find(log => log.comments && log.comments.includes('OCR Pre-verification Report'));
    if (firstLog) {
      const comment = firstLog.comments;
      const name_matched = comment.includes('Name Match: SUCCESS');
      const aadhaar_matched = comment.includes('Aadhaar Match: SUCCESS');
      const tenth_matched = comment.includes('10th Marks Match: SUCCESS');
      const twelfth_matched = comment.includes('12th Marks Match: SUCCESS');
      const verified = name_matched && aadhaar_matched && tenth_matched && twelfth_matched;
      
      return {
        ocrStatus: verified ? 'Verified' : 'Flagged',
        details: {
          name_matched,
          aadhaar_matched,
          tenth_matched,
          twelfth_matched
        }
      };
    }
  }
  
  return null;
};

export default function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;
  
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
  const [actionLoading, setActionLoading] = useState({});

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');
  const SERVER_HOST = 'http://127.0.0.1:5000'; // For file serving

  const loadApplications = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      let query = supabase
        .from('applications')
        .select(`
          id, 
          full_name, 
          email, 
          status,
          assigned_student_id,
          department:departments(name, code)
        `);
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,id.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      if (deptFilter) {
        query = query.eq('department_id', deptFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to retrieve applications database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    
    const loadDepts = async () => {
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    };
    loadDepts();
    setPage(1);
  }, [search, statusFilter, deptFilter]);

  const viewApplicationDetails = async (appId) => {
    setSelectedApp(appId);
    setModalLoading(true);
    setModalError('');
    setModalDetails(null);
    setComments('');
    
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`*, department:departments(name, code)`)
        .eq('id', appId)
        .single();
      
      if (appError) throw appError;

      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', appId);
        
      if (docsError) throw docsError;

      const { data: timelineData, error: timelineError } = await supabase
        .from('status_history')
        .select('*')
        .eq('application_id', appId)
        .order('updated_at', { ascending: true });

      if (timelineError) throw timelineError;

      let timeline = timelineData || [];
      if (timeline.length === 0) {
        timeline = [{
          status: appData.status,
          updated_at: appData.created_at,
          comments: appData.status === 'Pending' ? 'Application successfully submitted.' : 'Application status updated.',
          updater_name: 'System Auto'
        }];
      }

      let docs = docsData || [];
      if (docs.length === 0) {
        const docTypes = [
          { id: '10th', name: 'marksheet10', title: '10th Marksheet', fallback: '/graduation.png' },
          { id: '12th', name: 'marksheet12', title: '12th Marksheet', fallback: '/dept_cse.png' },
          { id: 'id', name: 'idProof', title: 'ID Proof', fallback: '/logo_transparent.png' }
        ];
        const exts = ['.pdf', '.png', '.jpg', '.jpeg', ''];
        
        docs = await Promise.all(docTypes.map(async (doc) => {
          let foundUrl = null;
          for (const ext of exts) {
            const publicUrl = supabase.storage.from('documents').getPublicUrl(`${appId}/${doc.name}${ext}`).data.publicUrl;
            try {
              const res = await fetch(publicUrl, { method: 'HEAD' });
              if (res.ok) {
                foundUrl = publicUrl;
                break;
              }
            } catch (e) {
              // ignore
            }
          }
          return {
            id: foundUrl ? `${appId}-${doc.id}` : `mock-${doc.id}`,
            document_type: doc.title,
            file_path: foundUrl || doc.fallback
          };
        }));
      }

      const formattedDetails = {
        application: {
          ...appData,
          department_code: appData.department.code,
          department_name: appData.department.name
        },
        documents: docs,
        timeline: timeline
      };

      setModalDetails(formattedDetails);
      setNewStatus(appData.status);
    } catch (err) {
      console.error(err);
      setModalError('Failed to retrieve application file details.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setSubmittingStatus(true);

    try {
      let studentId = modalDetails.application.assigned_student_id;

      if (newStatus === 'Approved' && !studentId) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        studentId = `STU-${year}-${rand}`;
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus, assigned_student_id: studentId })
        .eq('id', selectedApp);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('status_history')
        .insert([{
          application_id: selectedApp,
          status: newStatus,
          comments: comments || `Status changed to ${newStatus}`
        }]);

      if (logError) throw logError;

      loadApplications();
      viewApplicationDetails(selectedApp);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating status');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const updateApplicationStatus = async (appId, newStatus) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    setActionLoading(prev => ({ ...prev, [appId]: newStatus }));
    try {
      let studentId = null;

      if (newStatus === 'Approved') {
        studentId = app.assigned_student_id || `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus, assigned_student_id: studentId })
        .eq('id', appId);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('status_history')
        .insert([{
          application_id: appId,
          status: newStatus,
          comments: `Status updated to ${newStatus} directly from application list.`
        }]);

      if (logError) throw logError;

      await loadApplications();

      if (selectedApp === appId) {
        viewApplicationDetails(appId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating status');
    } finally {
      setActionLoading(prev => ({ ...prev, [appId]: null }));
    }
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

  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE));
  const paginatedApplications = applications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Applications Portal</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Review academic profile records and update application status.</p>
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
          <>
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
              {paginatedApplications.map((app) => (
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
                  <td style={{ padding: '16px' }}>{app.department?.name || '-'}</td>
                  <td style={{ padding: '16px' }}>{getStatusBadge(app.status)}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        className="btn-ripple" 
                        disabled={actionLoading[app.id] || app.status === 'Approved'}
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '11px', 
                          fontWeight: '800',
                          borderRadius: '9999px',
                          border: app.status === 'Rejected' ? '1px solid rgba(16, 185, 129, 0.2)' : 'none',
                          backgroundColor: app.status === 'Approved' 
                            ? '#10b981' 
                            : (app.status === 'Rejected' ? 'rgba(16, 185, 129, 0.06)' : '#10b981'),
                          color: app.status === 'Rejected' ? 'rgba(16, 185, 129, 0.6)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: (actionLoading[app.id] || app.status === 'Approved') ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: app.status === 'Approved' ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.2)'
                        }}
                        onClick={(e) => { 
                          e.stopPropagation();
                          updateApplicationStatus(app.id, 'Approved');
                        }}
                        onMouseOver={(e) => {
                          if (!actionLoading[app.id] && app.status !== 'Approved' && app.status !== 'Rejected') {
                            e.currentTarget.style.backgroundColor = '#059669';
                            e.currentTarget.style.transform = 'scale(1.04)';
                          } else if (app.status === 'Rejected') {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!actionLoading[app.id] && app.status !== 'Approved' && app.status !== 'Rejected') {
                            e.currentTarget.style.backgroundColor = '#10b981';
                            e.currentTarget.style.transform = 'scale(1)';
                          } else if (app.status === 'Rejected') {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.06)';
                          }
                        }}
                      >
                        {actionLoading[app.id] === 'Approved' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} style={{ strokeWidth: 3 }} />
                        )}
                        ACCEPT
                      </button>

                      <button 
                        className="btn-ripple" 
                        disabled={actionLoading[app.id] || app.status === 'Rejected'}
                        style={{ 
                          padding: '6px 14px', 
                          fontSize: '11px', 
                          fontWeight: '800',
                          borderRadius: '9999px',
                          border: app.status === 'Approved' ? '1px solid rgba(239, 68, 68, 0.2)' : 'none',
                          backgroundColor: app.status === 'Rejected' 
                            ? '#ef4444' 
                            : (app.status === 'Approved' ? 'rgba(239, 68, 68, 0.06)' : '#ef4444'),
                          color: app.status === 'Approved' ? 'rgba(239, 68, 68, 0.6)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: (actionLoading[app.id] || app.status === 'Rejected') ? 'default' : 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: app.status === 'Rejected' ? 'none' : '0 2px 6px rgba(239, 68, 68, 0.2)'
                        }}
                        onClick={(e) => { 
                          e.stopPropagation();
                          updateApplicationStatus(app.id, 'Rejected');
                        }}
                        onMouseOver={(e) => {
                          if (!actionLoading[app.id] && app.status !== 'Rejected' && app.status !== 'Approved') {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                            e.currentTarget.style.transform = 'scale(1.04)';
                          } else if (app.status === 'Approved') {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!actionLoading[app.id] && app.status !== 'Rejected' && app.status !== 'Approved') {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.transform = 'scale(1)';
                          } else if (app.status === 'Approved') {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)';
                          }
                        }}
                      >
                        {actionLoading[app.id] === 'Rejected' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={12} style={{ strokeWidth: 3 }} />
                        )}
                        REJECT
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Page {page} of {totalPages} — {applications.length} records</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          </>
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
                    {modalDetails.application.state && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600' }}>State:</span>
                        <span>{modalDetails.application.state}</span>
                      </div>
                    )}
                    {modalDetails.application.aadhaar_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600' }}>Aadhaar:</span>
                        <span>{modalDetails.application.aadhaar_number}</span>
                      </div>
                    )}
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

                {/* Academic Background */}
                {(modalDetails.application.tenth_percentage !== undefined && modalDetails.application.tenth_percentage !== null) && (
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '16px' }}>
                      Academic Background
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px', fontSize: '13px' }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>10th Grade Details</div>
                        <div style={{ marginTop: '4px' }}>
                          Percentage: <strong>{modalDetails.application.tenth_percentage}%</strong>
                        </div>
                        {modalDetails.application.tenth_total_marks !== undefined && modalDetails.application.tenth_total_marks !== null && (
                          <div style={{ marginTop: '2px' }}>
                            Marks: <strong>{modalDetails.application.tenth_total_marks} / {modalDetails.application.tenth_max_marks}</strong>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>12th Grade Details</div>
                        <div style={{ marginTop: '4px' }}>
                          Percentage: <strong>{modalDetails.application.twelfth_percentage}%</strong>
                        </div>
                        {modalDetails.application.twelfth_total_marks !== undefined && modalDetails.application.twelfth_total_marks !== null && (
                          <div style={{ marginTop: '2px' }}>
                            Marks: <strong>{modalDetails.application.twelfth_total_marks} / {modalDetails.application.twelfth_max_marks}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* OCR Pre-verification Card */}
                {(() => {
                  const report = getOcrReport(modalDetails.application, modalDetails.timeline);
                  if (!report) return null;
                  
                  const isVerified = report.ocrStatus === 'Verified';
                  
                  return (
                    <div style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      marginTop: '16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          🔍 AI OCR Verification Report
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: isVerified ? '#059669' : '#d97706'
                        }}>
                          {report.ocrStatus}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Applicant Name:</span>
                          <span style={{ fontWeight: '700', color: report.details.name_matched ? '#059669' : '#ef4444' }}>
                            {report.details.name_matched ? '✓ Match' : '✗ Mismatch'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Aadhaar Number:</span>
                          <span style={{ fontWeight: '700', color: report.details.aadhaar_matched ? '#059669' : '#ef4444' }}>
                            {report.details.aadhaar_matched ? '✓ Match' : '✗ Mismatch'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>10th Marksheet:</span>
                          <span style={{ fontWeight: '700', color: report.details.tenth_matched ? '#059669' : '#ef4444' }}>
                            {report.details.tenth_matched ? '✓ Match' : '✗ Mismatch'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>12th Marksheet:</span>
                          <span style={{ fontWeight: '700', color: report.details.twelfth_matched ? '#059669' : '#ef4444' }}>
                            {report.details.twelfth_matched ? '✓ Match' : '✗ Mismatch'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-royal)', fontWeight: '600' }}
                              >
                                Open File <ExternalLink size={12} />
                              </a>
                              <a 
                                href={fileUrl} 
                                download={doc.document_type}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-royal)', fontWeight: '600' }}
                              >
                                Download <Download size={12} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Update Form */}
                <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                    Action Box / Update Application Status
                  </h4>
                  
                  {modalDetails.application.status === 'Approved' ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(5, 150, 105, 0.06)', border: '1px solid rgba(5, 150, 105, 0.15)', color: '#059669' }}>
                      <Award size={20} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>This application is finalized and approved. No further actions required.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label className="form-label">Update Application Status</label>
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
                        {submittingStatus ? 'Updating Application Status...' : 'Update Application Status'}
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
