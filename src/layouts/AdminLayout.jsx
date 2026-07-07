import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  FolderGit2, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  UserCircle 
} from 'lucide-react';
import AdminChatbot from '../components/AdminChatbot';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth Guard
  const token = localStorage.getItem('adminToken');
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');

  if (!token) {
    // If no JWT token is stored, redirect to login
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Applications', path: '/admin/applications', icon: FileText },
    { name: 'Student Database', path: '/admin/students', icon: Users },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Sidebar - Desktop */}
      <aside 
        style={{
          width: collapsed ? '80px' : '260px',
          backgroundColor: 'var(--color-navy)',
          color: '#ffffff',
          flexDirection: 'column',
          transition: 'var(--transition-smooth)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          zIndex: 40,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto'
        }}
        className="md:flex"
      >
        {/* Header */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justify: collapsed ? 'center' : 'between', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo_sphere.png" 
              alt="TMEC Logo" 
              style={{ 
                height: '32px', 
                width: 'auto',
                filter: 'drop-shadow(var(--glow-royal))'
              }} 
            />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'var(--font-display)' }}>TMEC ADMIN</span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>MANAGEMENT</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  backgroundColor: isActive ? 'var(--color-royal)' : 'transparent',
                  transition: 'var(--transition-fast)',
                  justifyContent: collapsed ? 'center' : 'flex-start'
                }}
                title={item.name}
              >
                <Icon size={20} />
                {!collapsed && <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Admin Info / Collapse & Logout */}
        <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
              <UserCircle size={32} style={{ color: 'var(--color-sky)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{adminData.name || 'Admin'}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{adminData.role === 'admin' ? 'Administrator' : 'Superadmin'}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              color: 'rgba(239, 68, 68, 0.8)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={20} />
            {!collapsed && <span style={{ fontSize: '14px', fontWeight: '500' }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '260px',
            height: '100vh',
            backgroundColor: 'var(--color-navy)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
            <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>TMEC Portal</span>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>
          
          <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    backgroundColor: isActive ? 'var(--color-royal)' : 'transparent',
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                color: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                background: 'transparent',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              <LogOut size={20} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header 
          style={{
            height: '70px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            gap: '16px'
          }}
        >
          {/* Mobile hamburger menu */}
          <button 
            onClick={() => setMobileOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
            className="md:hidden"
          >
            <Menu size={24} />
          </button>

          {/* Collapse sidebar button (Desktop) */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            className="md:block"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={20} />
          </button>

          <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }} className="md:block">
            College Management System
          </span>


        </header>

        {/* Scrollable Main Content Pane */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <AdminChatbot />
    </div>
  );
}
