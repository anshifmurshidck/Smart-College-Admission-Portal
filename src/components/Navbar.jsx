import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
<<<<<<< Updated upstream
  const location = useLocation();
=======
  const [theme, setTheme] = useState('light');
>>>>>>> Stashed changes

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Admissions', path: '/apply' },
    { name: 'Departments', path: '/departments' },
    { name: 'Application Status', path: '/track' },
    { name: 'Admin Portal', path: '/admin/login' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-900/90 dark:bg-black/80 backdrop-blur-md shadow-lg border-b border-white/5 py-3' 
          : 'bg-transparent py-5'
      }`}
      style={{
<<<<<<< Updated upstream
        backgroundColor: scrolled ? 'var(--bg-glass)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border-color)' : 'none',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'var(--transition-smooth)'
      }}
    >
      <div className="container flex items-center justify-between">
        {/* Academic TMEC Custom Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-md group-hover:scale-105 transition-transform"
               style={{
                 background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
                 borderRadius: 'var(--radius-sm)',
                 padding: '8px'
               }}
          >
            {/* SVG Logo incorporating Shield, Graduation Cap, and Circuit patterns */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
              {/* Shield Outline */}
              <path d="M50,10 L85,25 C85,60 50,90 50,90 C50,90 15,60 15,25 Z" fill="none" stroke="currentColor" strokeWidth="6" />
              {/* Graduation Cap */}
              <path d="M50,25 L75,35 L50,45 L25,35 Z" />
              <rect x="45" y="42" width="10" height="15" />
              <path d="M70,37 L70,55 L73,55 L73,37 Z" />
              {/* Circuit Pattern (subtle lines) */}
              <circle cx="50" cy="72" r="5" />
              <line x1="50" y1="58" x2="50" y2="67" stroke="currentColor" strokeWidth="4" />
              <line x1="35" y1="67" x2="45" y2="72" stroke="currentColor" strokeWidth="4" />
              <line x1="65" y1="67" x2="55" y2="72" stroke="currentColor" strokeWidth="4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-wider" style={{ fontFamily: 'var(--font-display)', color: scrolled ? 'var(--text-primary)' : 'var(--color-navy)', color: 'var(--text-primary)' }}>
              TMEC
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400" style={{ color: 'var(--text-secondary)' }}>
              Thought Minds
            </span>
=======
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '72px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.4s ease',
        background: scrolled
          ? 'var(--bg-secondary)'
          : 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled
          ? '1px solid var(--border-color)'
          : '1px solid var(--border-glass)',
        boxShadow: scrolled ? 'var(--shadow-card)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
            padding: '9px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--glow-royal)',
            animation: 'float-fast 4s ease-in-out infinite',
          }}>
            <GraduationCap size={20} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontWeight: 900, fontSize: '18px', letterSpacing: '0.5px',
              fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
            }}>TMEC</span>
            <span style={{
              fontSize: '8px', color: 'var(--color-royal)', letterSpacing: '2px',
              fontWeight: 700, textTransform: 'uppercase', marginTop: '2px',
            }}>Admissions Portal</span>
>>>>>>> Stashed changes
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                className={`relative py-2 text-sm font-medium transition-colors hover:text-blue-500`}
                style={{
<<<<<<< Updated upstream
                  color: isActive ? 'var(--color-royal)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500'
                }}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] rounded-full"
                        style={{ background: 'linear-gradient(95deg, var(--color-royal), var(--color-purple))' }}
                  />
                )}
=======
                  fontSize: '13px', fontWeight: 600,
                  padding: '8px 14px', borderRadius: '8px',
                  color: active ? 'var(--color-royal)' : 'var(--text-secondary)',
                  background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(124,58,237,0.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.name}
>>>>>>> Stashed changes
              </Link>
            );
          })}

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-700/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-500/10 transition-colors"
            style={{
<<<<<<< Updated upstream
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
=======
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              width: '38px', height: '38px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(37,99,235,0.08)';
              e.currentTarget.style.color = 'var(--color-royal)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
>>>>>>> Stashed changes
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {/* Mobile Toggle Buttons */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-700/10 dark:border-white/10 text-slate-600 dark:text-slate-300"
            style={{
<<<<<<< Updated upstream
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
=======
              background: 'transparent', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
>>>>>>> Stashed changes
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
<<<<<<< Updated upstream
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-300"
            style={{ color: 'var(--text-primary)' }}
=======
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: mobileOpen ? 'rgba(37,99,235,0.08)' : 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
>>>>>>> Stashed changes
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 w-full md:hidden py-6 border-b shadow-2xl animate-fade-in"
          style={{
<<<<<<< Updated upstream
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
=======
            position: 'fixed',
            top: '72px', left: 0, right: 0,
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '20px 24px 28px',
>>>>>>> Stashed changes
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '24px'
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setIsOpen(false)}
                className="text-base font-semibold py-2 px-4 rounded-lg"
                style={{
<<<<<<< Updated upstream
                  color: isActive ? 'var(--color-royal)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent'
=======
                  fontSize: '15px', fontWeight: 600, padding: '12px 16px',
                  borderRadius: '10px',
                  color: active ? 'var(--color-royal)' : 'var(--text-secondary)',
                  background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s ease',
>>>>>>> Stashed changes
                }}
              >
                {link.name}
              </Link>
            );
          })}
<<<<<<< Updated upstream
=======

          <div style={{ height: '1px', background: 'var(--border-color)', margin: '10px 0' }} />

          <button
            onClick={handlePortalClick}
            className="btn-ripple btn-primary"
            style={{ padding: '13px', fontSize: '14px', width: '100%', justifyContent: 'center' }}
          >
            {isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Portal'}
            <ArrowRight size={16} />
          </button>
>>>>>>> Stashed changes
        </div>
      )}
    </nav>
  );
}
