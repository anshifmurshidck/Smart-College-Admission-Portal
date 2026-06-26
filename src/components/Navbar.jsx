import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Menu, X, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Track scroll for enhanced nav blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Check admin session on path change
  useEffect(() => {
    setIsAdminLoggedIn(!!localStorage.getItem('adminToken'));
  }, [location]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const navLinks = [
    { name: 'Home',          path: '/' },
    { name: 'Departments',   path: '/departments' },
    { name: 'Apply Now',     path: '/apply' },
    { name: 'Track Status',  path: '/track' },
    { name: 'Contact',       path: '/contact' },
  ];

  const handlePortalClick = () => {
    navigate(isAdminLoggedIn ? '/admin/dashboard' : '/admin/login');
    setMobileOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '72px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.4s ease',
        background: scrolled
          ? 'rgba(3, 7, 18, 0.92)'
          : 'rgba(3, 7, 18, 0.6)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid rgba(59, 130, 246, 0.12)'
          : '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: scrolled ? '0 4px 40px rgba(0,0,0,0.4), 0 0 80px rgba(37,99,235,0.06)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ffffff', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
            padding: '9px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(37,99,235,0.4), 0 0 40px rgba(124,58,237,0.2)',
            animation: 'float 5s ease-in-out infinite',
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontWeight: 900, fontSize: '18px', letterSpacing: '0.5px',
              fontFamily: 'var(--font-display)', color: '#ffffff',
            }}>TMEC</span>
            <span style={{
              fontSize: '8px', color: 'var(--color-sky)', letterSpacing: '2px',
              fontWeight: 700, textTransform: 'uppercase', marginTop: '2px',
            }}>Admissions Portal</span>
          </div>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="md:flex" style={{ alignItems: 'center', gap: '6px' }}>
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  fontSize: '13px', fontWeight: 600,
                  padding: '8px 14px', borderRadius: '8px',
                  color: active ? '#ffffff' : 'rgba(148,163,184,0.85)',
                  background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
                  border: active ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'rgba(148,163,184,0.85)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.name}
                {active && (
                  <span style={{
                    position: 'absolute', bottom: '-1px', left: '14px', right: '14px',
                    height: '2px',
                    background: 'linear-gradient(90deg, var(--color-royal), var(--color-sky))',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px rgba(56,189,248,0.6)',
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Desktop Actions ── */}
        <div className="md:flex" style={{ alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(148,163,184,0.9)',
              borderRadius: '8px',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(37,99,235,0.15)';
              e.currentTarget.style.color = 'var(--color-sky)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(148,163,184,0.9)';
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Admin Portal Button */}
          <button
            onClick={handlePortalClick}
            className="btn-ripple btn-primary"
            style={{ padding: '9px 20px', fontSize: '13px', gap: '6px' }}
          >
            {isAdminLoggedIn ? 'Dashboard' : 'Admin Portal'}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* ── Mobile Toggle ── */}
        <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(148,163,184,0.9)', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: mobileOpen ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            top: '72px', left: 0, right: 0,
            background: 'rgba(3,7,18,0.97)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(59,130,246,0.12)',
            padding: '20px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 99,
            animation: 'slideUp 0.25s ease forwards',
          }}
        >
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '15px', fontWeight: 600, padding: '12px 16px',
                  borderRadius: '10px',
                  color: active ? '#ffffff' : 'rgba(148,163,184,0.85)',
                  background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
                  border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
              >
                {link.name}
              </Link>
            );
          })}

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />

          <button
            onClick={handlePortalClick}
            className="btn-ripple btn-primary"
            style={{ padding: '13px', fontSize: '14px', width: '100%', justifyContent: 'center' }}
          >
            {isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Portal'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </header>
  );
}