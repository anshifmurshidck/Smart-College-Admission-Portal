import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Loader2, AlertCircle, FileText, Calendar, CheckCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import bgImage from '../assets/track_bg.jpg';

export default function TrackStatus() {
  const [searchParams] = useSearchParams();
  const [appId, setAppId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState(null);

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');

  useEffect(() => {
    // If ID is in query string, trigger track automatically
    const queryId = searchParams.get('id');
    if (queryId) {
      setAppId(queryId);
      trackApplication(queryId);
    }
  }, [searchParams]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!appId.trim()) {
      setErrorMsg('Please enter a valid Application ID');
      return;
    }
    trackApplication(appId.trim());
  };

  const trackApplication = async (id) => {
    setLoading(true);
    setErrorMsg('');
    setData(null);

    try {
      // Fetch application with department details
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          full_name,
          status,
          assigned_student_id,
          created_at,
          department:departments(name, code)
        `)
        .eq('id', id)
        .single();

      if (appError || !appData) {
        throw new Error('Failed to locate application. Verify the ID and try again.');
      }

      // Fetch status history
      const { data: historyData, error: historyError } = await supabase
        .from('status_history')
        .select('*')
        .eq('application_id', id)
        .order('updated_at', { ascending: true });

      let timeline = [];
      if (historyData && historyData.length > 0) {
        timeline = historyData;
      } else {
        // Provide a default timeline entry if history is empty
        timeline = [{
          status: appData.status,
          updated_at: appData.created_at,
          comments: appData.status === 'Pending' 
            ? 'Application successfully submitted and is awaiting review.'
            : 'Application status updated.'
        }];
      }

      setData({
        application: {
          fullName: appData.full_name,
          departmentCode: appData.department.code,
          departmentName: appData.department.name,
          status: appData.status,
          studentId: appData.assigned_student_id
        },
        timeline: timeline
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to locate application. Verify the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'Approved':
        return { color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', icon: CheckCircle2 };
      case 'Rejected':
        return { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', icon: XCircle };
      case 'Under Verification':
        return { color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', icon: Clock };
      default:
        return { color: 'var(--color-royal)', bg: 'rgba(37, 99, 235, 0.08)', icon: Clock };
    }
  };

  return (
    <div style={{ 
      padding: '120px 0 60px 0', 
      minHeight: '100vh',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-primary)', opacity: 0.85, zIndex: 0 }}></div>
      <div className="container" style={{ maxWidth: '700px', position: 'relative', zIndex: 1 }}>
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-secondary)', fontWeight: 800 }}>
            Track Application Status
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Enter your system generated Application ID below to monitor verification stages.
          </p>
        </div>

        {/* Search Bar Panel */}
        <form onSubmit={handleTrackSubmit} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={appId} 
              onChange={(e) => setAppId(e.target.value)} 
              className="form-input" 
              placeholder="e.g. APP-2026-4731" 
              style={{ paddingLeft: '48px' }} 
            />
          </div>
          <button 
            type="submit" 
            className="btn-ripple btn-primary"
            disabled={loading}
            style={{ padding: '12px 28px', display: 'flex', gap: '8px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
          </button>
        </form>

        {errorMsg && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Block */}
        {data && (
          <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Status Card */}
            <div style={{ display: 'flex', justifyContent: 'between', flexWrap: 'wrap', gap: '20px', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.5px' }}>Applicant</span>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{data.application.fullName}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Program: {data.application.departmentCode} - {data.application.departmentName}</span>
              </div>
              
              {/* Badge */}
              {(() => {
                const s = getStatusDetails(data.application.status);
                const Icon = s.icon;
                return (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    borderRadius: 'var(--radius-full)', 
                    color: s.color, 
                    backgroundColor: s.bg,
                    fontWeight: '700',
                    fontSize: '14px',
                    border: `1px solid ${s.color}25`
                  }}>
                    <Icon size={16} />
                    {data.application.status}
                  </div>
                );
              })()}
            </div>

            {/* Enrolled ID Card if approved */}
            {data.application.status === 'Approved' && data.application.studentId && (
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.06) 100%)', 
                  border: '1px solid rgba(37, 99, 235, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div style={{ fontSize: '32px' }}>🎓</div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-royal)' }}>Congratulations!</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    You have been admitted to Thought Minds Engineering College. Your official Student Identification Number is:
                  </p>
                  <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '8px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {data.application.studentId}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>Application History</h4>
              
              <div className="timeline">
                {data.timeline.map((item, idx) => {
                  const s = getStatusDetails(item.status);
                  const dt = new Date(item.updated_at);
                  const isLast = idx === data.timeline.length - 1;
                  
                  return (
                    <div key={idx} className="timeline-item">
                      <div className={`timeline-dot ${isLast ? (item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'active') : ''}`} />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: isLast ? s.color : 'var(--text-primary)' }}>
                          {item.status}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {dt.toLocaleDateString()} {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.5' }}>
                          {item.comments}
                        </p>
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
  );
}
