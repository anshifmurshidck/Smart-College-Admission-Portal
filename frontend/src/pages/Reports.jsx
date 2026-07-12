import React, { useState, useEffect } from 'react';
import { 
  Download, FileText, Users, BarChart2, Loader2, CheckCircle, 
  TrendingUp, Activity, CheckCircle2, XCircle, Clock, Filter 
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../lib/apiBase';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

export default function Reports() {
  const [generating, setGenerating] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  
  // Filters
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');

  const [departmentsList, setDepartmentsList] = useState([]);

  const token = localStorage.getItem('adminToken');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (status) params.append('status', status);

      const response = await axios.get(`${API_BASE}/reports/analytics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching reports analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [departmentId, status]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_BASE}/departments`);
        setDepartmentsList(response.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const generateReport = async (type, format, statusFilter = '') => {
    const key = `${type}-${statusFilter}-${format}`;
    setGenerating(key);
    setSuccessMsg('');
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      params.append('format', format);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${API_BASE}/reports/generate?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const fileNameStr = response.headers['content-disposition'] 
        ? response.headers['content-disposition'].split('filename=')[1].replace(/"/g, '')
        : `Report_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      const blob = new Blob([response.data], { 
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'application/pdf' 
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileNameStr;
      link.click();
      URL.revokeObjectURL(link.href);

      setSuccessMsg(`${fileNameStr} downloaded successfully!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert('Error generating report: Ensure backend is running.');
    } finally {
      setGenerating('');
    }
  };

  const reportTypes = [
    {
      type: 'admission',
      status: '',
      title: 'Complete Admission Report',
      description: 'Complete listing of all submitted applications.',
      icon: FileText,
      color: 'var(--color-royal)',
      bg: 'rgba(37, 99, 235, 0.08)'
    },
    {
      type: 'admission',
      status: 'Approved',
      title: 'Approved Students Report',
      description: 'Detailed report of all approved students.',
      icon: CheckCircle2,
      color: 'var(--color-emerald)',
      bg: 'rgba(16, 185, 129, 0.08)'
    },
    {
      type: 'admission',
      status: 'Rejected',
      title: 'Rejected Students Report',
      description: 'Detailed report of all rejected applications.',
      icon: XCircle,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.08)'
    }
  ];

  const PIE_COLORS = ['#059669', '#d97706', '#dc2626'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '40px' }}>
      {/* Header & Success Banner */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Reports & Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Real-time analytics and professional PDF generation.
        </p>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#059669', animation: 'fade-in 0.3s' }}>
          <CheckCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{successMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: '600', fontSize: '13px' }}>Filters:</span>
        </div>
        
        <select 
          value={departmentId} 
          onChange={e => setDepartmentId(e.target.value)}
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
        >
          <option value="">All Departments</option>
          {departmentsList.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        
        <select 
          value={status} 
          onChange={e => setStatus(e.target.value)}
          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
        >
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {!analytics ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 20px' }}>
          {loading ? (
            <Loader2 className="animate-spin" size={32} color="var(--color-sky)" />
          ) : (
            <div style={{ color: 'var(--color-red)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <XCircle size={32} />
              <span>Failed to load analytics data. Ensure the backend server is running.</span>
              <button 
                onClick={fetchAnalytics}
                style={{ marginTop: '12px', padding: '8px 16px', background: 'var(--color-sky)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-royal)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Apps</span>
                <FileText size={18} color="var(--color-royal)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800' }}>{analytics?.cards.total}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-emerald)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Approved</span>
                <CheckCircle2 size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-emerald)' }}>{analytics?.cards.approved}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Pending</span>
                <Clock size={18} color="#d97706" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706' }}>{analytics?.cards.pending}</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Rejected</span>
                <XCircle size={18} color="#dc2626" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626' }}>{analytics?.cards.rejected}</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--color-purple)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Total Students</span>
                <Users size={18} color="var(--color-purple)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--color-purple)' }}>{analytics?.cards.total_students}</div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

            {/* Department Bar Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="var(--color-royal-light)" /> Department Breakdown
              </h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.departments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="code" stroke="var(--text-secondary)" fontSize={12} />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="approved" stackId="a" fill="#059669" name="Approved" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="pending" stackId="a" fill="#d97706" name="Pending" />
                    <Bar dataKey="rejected" stackId="a" fill="#dc2626" name="Rejected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Pie Chart */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--color-purple-light)" /> Status Distribution
              </h3>
              <div style={{ height: '250px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.pieChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {analytics?.pieChart?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PDF Export Section */}
      <h3 style={{ fontSize: '20px', fontWeight: '700', marginTop: '20px' }}>Export PDF Reports</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {reportTypes.map(report => {
          const Icon = report.icon;
          const genKey = `${report.type}-${report.status}-pdf`;
          return (
            <div key={genKey} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: report.bg, color: report.color, flexShrink: 0 }}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '700', lineHeight: '1.3' }}>{report.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '6px' }}>{report.description}</p>
                </div>
              </div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />
              <button
                onClick={() => generateReport(report.type, 'pdf', report.status)}
                disabled={!!generating}
                style={{
                  width: '100%',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  opacity: generating === genKey ? 0.7 : 1,
                  transition: 'transform 0.2s, opacity 0.2s'
                }}
                onMouseOver={e => { if(!generating) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {generating === genKey ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating PDF...</>
                ) : (
                  <><Download size={14} /> Download PDF</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
