import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();



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
    { name: 'Departments', path: '/departments' },
    { name: 'Apply Now', path: '/apply' },
    { name: 'Track Status', path: '/track' },
    { name: 'Contact', path: '/contact' }
  ];

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '72px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.4s ease',
        background: scrolled ? 'var(--bg-secondary)' : 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid var(--border-glass)',
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
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                style={{
                  fontSize: '14px', fontWeight: 600,
                  padding: '8px 16px', borderRadius: '8px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(37,99,235,0.1)' : 'transparent',
                  border: '1px solid transparent',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  textDecoration: 'none',
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.background = 'rgba(124,58,237,0.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            style={{
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
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {/* Mobile Toggle Buttons */}
        <div className="flex items-center gap-4 md:hidden">
          <button 
            onClick={toggleTheme}
            style={{
              background: 'transparent', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: isOpen ? 'rgba(37,99,235,0.08)' : 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', borderRadius: '8px',
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 w-full md:hidden py-6 border-b shadow-2xl animate-fade-in"
          style={{
            position: 'fixed',
            top: '72px', left: 0, right: 0,
            background: 'var(--bg-secondary)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '20px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: '15px', fontWeight: 600, padding: '12px 16px',
                  borderRadius: '10px',
                  color: isActive ? 'var(--color-royal)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(37,99,235,0.08)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
