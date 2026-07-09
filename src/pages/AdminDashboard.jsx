import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CardSkeleton, ChartSkeleton } from '../components/LoadingSkeleton';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 15;

  const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api');

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }

      const data = await response.json();

      setStats({
        cards: data.cards,
        departments: data.departments,
        monthly: data.monthly,
        activity: data.activity
      });
      setActivityPage(1);
      
    } catch (err) {
      console.warn('Backend API stats load failed, attempting Supabase direct fallback:', err);
      
      try {
        const { data: apps, error } = await supabase
          .from('applications')
          .select('*, department:departments(code, name), status_history(comments, status)');
          
        if (error) throw error;
        
        const getOcrStatusForApp = (app) => {
          const timeline = app.status_history || [];
          const firstLog = timeline.find(log => log.comments && log.comments.includes('OCR Pre-verification Report'));
          if (firstLog) {
            const comment = firstLog.comments;
            const name_matched = comment.includes('Name Match: SUCCESS');
            const aadhaar_matched = comment.includes('Aadhaar Match: SUCCESS');
            const tenth_matched = comment.includes('10th Marks Match: SUCCESS');
            const twelfth_matched = comment.includes('12th Marks Match: SUCCESS');
            const verified = name_matched && aadhaar_matched && tenth_matched && twelfth_matched;
            return verified ? 'Verified' : 'Flagged';
          }
          return 'Not Processed';
        };

        const total = apps.length;
        const approved = apps.filter(a => a.status === 'Approved').length;
        const rejected = apps.filter(a => a.status === 'Rejected').length;
        const pending = apps.filter(a => a.status === 'Pending' || a.status === 'Under Verification').length;
        const flagged = apps.filter(a => getOcrStatusForApp(a) === 'Flagged').length;

        // Group department stats
        const deptMap = {};
        apps.forEach(a => {
          const code = a.department?.code || 'Unknown';
          const name = a.department?.name || 'Unknown';
          if (!deptMap[code]) deptMap[code] = { code, name, count: 0 };
          deptMap[code].count++;
        });
        const departments = Object.values(deptMap);

        // Group monthly admissions (approved status)
        const monthlyMap = {};
        apps.filter(a => a.status === 'Approved').forEach(a => {
          const date = new Date(a.updated_at || a.created_at);
          const month = date.toLocaleString('default', { month: 'short' });
          if (!monthlyMap[month]) monthlyMap[month] = { month, count: 0, _date: date };
          monthlyMap[month].count++;
        });
        const monthly = Object.values(monthlyMap).sort((a, b) => a._date - b._date).slice(-6);

        // Recent activity
        const activity = [...apps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(a => ({
          id: a.id,
          full_name: a.full_name,
          department_code: a.department?.code,
          status: a.status,
          created_at: a.created_at
        }));

        setStats({
          cards: { total, approved, rejected, pending, flagged },
          departments,
          monthly,
          activity
        });
        setActivityPage(1);

      } catch (fallbackErr) {
        console.error('Supabase fallback failed:', fallbackErr);
        setErrorMsg('Failed to load dashboard metrics. Try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 16px auto' }} />
        <h3>Error Accessing Dashboard</h3>
        <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{errorMsg}</p>
        <button onClick={loadDashboardData} className="btn-ripple btn-primary" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '13px' }}>
          Retry Load
        </button>
      </div>
    );
  }

  const cardItems = [
    { label: 'Total Applications', value: stats.cards.total, icon: FileText, color: 'var(--color-royal)', bg: 'rgba(37, 99, 235, 0.08)' },
    { label: 'Approved Students', value: stats.cards.approved, icon: UserCheck, color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
    { label: 'Rejected Applications', value: stats.cards.rejected, icon: UserX, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' },
    { label: 'Pending Verification', value: stats.cards.pending, icon: Clock, color: '#d97706', bg: 'rgba(217, 119, 6, 0.08)' },
    { label: 'Mismatches (Manual Review)', value: stats.cards.flagged, icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)' }
  ];

  // Max value for scaling SVG chart heights
  const maxAppsCount = Math.max(...stats.departments.map(d => d.count), 1);
  const maxMonthlyCount = Math.max(...stats.monthly.map(m => m.count), 1);

  const totalActivityPages = Math.max(1, Math.ceil((stats?.activity?.length || 0) / ACTIVITY_PAGE_SIZE));
  const paginatedActivity = (stats?.activity || []).slice((activityPage - 1) * ACTIVITY_PAGE_SIZE, activityPage * ACTIVITY_PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Dashboard Overview</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Thought Minds Engineering College Admissions Registry</p>
        </div>
        <button onClick={loadDashboardData} className="btn-ripple btn-secondary" style={{ padding: '10px 16px', display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
          <RefreshCw size={16} />
          Refresh Status
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-grid">
        {cardItems.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: c.bg, color: c.color }}>
                <Icon size={24} />
              </div>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{c.label}</span>
                <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {c.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Premium SVG Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Chart 1: Department-wise Applications */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Applications by Department</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Total registration counts per engineering stream</p>
          </div>

          {/* Bar Chart Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {stats.departments.map((dept) => {
              const percentage = (dept.count / maxAppsCount) * 100;
              return (
                <div key={dept.code} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{dept.name} ({dept.code})</span>
                    <span style={{ color: 'var(--color-royal)' }}>{dept.count} apps</span>
                  </div>
                  
                  {/* Progress Track */}
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: 'linear-gradient(90deg, var(--color-royal) 0%, var(--color-purple) 100%)', 
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Monthly Admissions Area SVG */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Monthly Enrolled Admissions</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Approved registrations timeline (Last 6 Months)</p>
          </div>

          {/* SVG Line / Bar Representation */}
          <div style={{ display: 'flex', height: '220px', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 10px 0 10px', position: 'relative' }}>
            {stats.monthly.length === 0 ? (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', fontSize: '13px' }}>
                No enrollment data logged yet.
              </div>
            ) : (
              stats.monthly.map((m, idx) => {
                const heightPct = (m.count / maxMonthlyCount) * 120 + 20; // scale between 20px and 140px
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-purple)' }}>{m.count}</span>
                    
                    {/* Graphical Column */}
                    <div 
                      style={{ 
                        width: '32px', 
                        height: `${heightPct}px`, 
                        background: 'linear-gradient(180deg, var(--color-purple) 0%, rgba(124, 58, 237, 0.1) 100%)', 
                        borderRadius: '6px 6px 0 0',
                        boxShadow: '0 4px 10px rgba(124, 58, 237, 0.15)',
                        transition: 'height 1s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} 
                    />
                    
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{m.month}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>



    </div>
  );
}
