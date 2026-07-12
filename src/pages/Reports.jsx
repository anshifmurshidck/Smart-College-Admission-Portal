import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, Users, BarChart2, Loader2, CheckCircle, AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line 
} from 'recharts';

const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#8b5cf6'];

export default function Reports() {
  const [generating, setGenerating] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    status: '',
    start_date: '',
    end_date: ''
  });

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');
  const token = localStorage.getItem('adminToken');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`${API_BASE}/reports/stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setStatsError(err.response?.data?.message || 'Failed to load report data from the server.');
    } finally {
      setLoadingStats(false);
    }
  }, [filters, API_BASE, token]);

  useEffect(() => {
    // Debounce the search input
    const delayDebounceFn = setTimeout(() => {
      fetchStats();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchStats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = async (type) => {
    setGenerating(type);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      params.append('format', 'pdf');
      params.append('type', type);
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await axios.get(`${API_BASE}/reports/generate?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      });
      
      let prefix = type === 'approved' ? 'Approved_Students' : type === 'rejected' ? 'Rejected_Students' : 'Admission_Report';
      const fileName = `${prefix}_${new Date().toISOString().slice(0, 10)}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);

      setSuccessMsg(`${fileName} downloaded successfully!`);
    } catch (err) {
      setErrorMsg(`Error generating ${type} PDF report. Please try again.`);
    } finally {
      setGenerating('');
    }
  };

  // Prepare Chart Data
  const pieData = stats ? [
    { name: 'Approved', value: stats.approved_applications },
    { name: 'Pending', value: stats.pending_applications },
    { name: 'Rejected', value: stats.rejected_applications }
  ].filter(d => d.value > 0) : [];

  const barData = stats ? stats.department_wise.map(d => ({
    name: d.code,
    Total: d.total,
    Approved: d.approved,
    Rejected: d.rejected
  })) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Institutional Reports</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          View live statistics, filter data, and export comprehensive reports for academic audits.
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

      {/* Filters Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by Name, ID, or Dept..."
            style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
          />
        </div>
        
        <select 
          name="department" 
          value={filters.department} 
          onChange={handleFilterChange}
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', flex: '1 1 150px' }}
        >
          <option value="">All Departments</option>
          {stats?.departments_list?.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select 
          name="status" 
          value={filters.status} 
          onChange={handleFilterChange}
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', flex: '1 1 120px' }}
        >
          <option value="">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>


      </div>

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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Summary Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <StatCard label="Total Applications" value={stats.total_applications} color="var(--color-royal)" icon={FileText} />
            <StatCard label="Approved" value={stats.approved_applications} color="#059669" icon={CheckCircle} />
            <StatCard label="Pending" value={stats.pending_applications} color="#d97706" icon={BarChart2} />
            <StatCard label="Rejected" value={stats.rejected_applications} color="#dc2626" icon={AlertCircle} />
            <StatCard label="Students" value={stats.total_students} color="var(--color-purple)" icon={Users} />
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Pie Chart */}
            <div className="glass-panel" style={{ padding: '24px', height: '350px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Application Status</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
              )}
            </div>

            {/* Line Chart */}
            <div className="glass-panel" style={{ padding: '24px', height: '350px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Applications Over Time</h3>
              {stats.apps_over_time?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.apps_over_time} margin={{ top: 5, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: 'var(--text-secondary)'}} />
                    <YAxis tick={{fontSize: 10, fill: 'var(--text-secondary)'}} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    <Line type="monotone" dataKey="count" stroke="var(--color-royal)" strokeWidth={3} dot={{r: 4, fill: 'var(--color-royal)'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="glass-panel" style={{ padding: '24px', height: '350px', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Department-wise Applications</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} />
                    <YAxis tick={{fontSize: 12, fill: 'var(--text-secondary)'}} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Legend />
                    <Bar dataKey="Total" fill="var(--color-royal)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Approved" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rejected" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
              )}
            </div>
          </div>

          {/* Department Analytics Grid */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Department Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {stats.department_wise.map(dept => (
                <div key={dept.code} className="glass-panel" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3' }}>{dept.name}</h4>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(37,99,235,0.1)', color: 'var(--color-royal)', fontSize: '11px', fontWeight: '700' }}>{dept.code}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Applications</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{dept.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Approved</span>
                      <span style={{ fontWeight: '600', color: '#059669' }}>{dept.approved}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Pending</span>
                      <span style={{ fontWeight: '600', color: '#d97706' }}>{dept.pending}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Rejected</span>
                      <span style={{ fontWeight: '600', color: '#dc2626' }}>{dept.rejected}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Download Reports Section */}
      {!loadingStats && stats && (
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={20} color="var(--color-royal)" /> 
              Download Reports
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Export data as professional PDF reports. Active filters will be applied to the downloaded reports.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <ReportButton 
              title="Complete Admission Report" 
              desc="Includes all filtered students and summary stats." 
              type="comprehensive" 
              color="#2563eb"
              generating={generating} 
              onGenerate={generateReport} 
            />
            <ReportButton 
              title="Approved Students Report" 
              desc="Contains only approved students data." 
              type="approved" 
              color="#059669"
              generating={generating} 
              onGenerate={generateReport} 
            />
            <ReportButton 
              title="Rejected Students Report" 
              desc="Contains only rejected applications data." 
              type="rejected" 
              color="#dc2626"
              generating={generating} 
              onGenerate={generateReport} 
            />
          </div>
        </div>
      )}

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
        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1' }}>{value}</h3>
      </div>
    </div>
  );
}

function ReportButton({ title, desc, type, color, generating, onGenerate }) {
  const isGenerating = generating === type;
  const disabled = !!generating;
  
  return (
    <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${color}30`, backgroundColor: `${color}05`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{desc}</p>
      </div>
      <button
        onClick={() => onGenerate(type)}
        disabled={disabled}
        style={{
          padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          fontSize: '13px', fontWeight: '600', backgroundColor: color, color: 'white', border: 'none',
          borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
          marginTop: 'auto', transition: 'all 0.2s'
        }}
      >
        {isGenerating ? (
          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
        ) : (
          <><FileText size={16} /> Export PDF</>
        )}
      </button>
    </div>
  );
}
