import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');

  useEffect(() => {
    // If token already exists, redirect straight to dashboard
    if (localStorage.getItem('adminToken')) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Username and password are required.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    axios.post(`${API_BASE}/auth/login`, { username, password })
      .then((res) => {
        // Save auth data
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminData', JSON.stringify(res.data.admin));
        setLoading(false);
        navigate('/admin/dashboard');
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Login failed. Verify credentials and try again.');
        setLoading(false);
      });
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setTimeout(() => {
      setForgotSent(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top right, rgba(37,99,235,0.06), transparent), radial-gradient(circle at bottom left, rgba(124,58,237,0.06), transparent)',
        padding: '24px'
      }}
    >
      <div 
        className="glass-panel"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(15,23,42,0.1)'
        }}
      >
        {/* Academic Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo_sphere.png" 
            alt="TMEC Logo" 
            style={{ 
              height: '48px', 
              width: 'auto',
              marginBottom: '16px',
              filter: 'drop-shadow(var(--glow-royal))'
            }} 
          />
          <h3 style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Thought Minds College</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Registrar Administration Portal</p>
        </div>

        {errorMsg && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '12px', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                required
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="form-input" 
                placeholder="Enter admin username" 
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="Enter password" 
                style={{ paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              Remember Me
            </label>
            
            <button 
              type="button" 
              onClick={() => { setShowForgot(true); setForgotSent(false); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-royal)', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            className="btn-ripple btn-primary"
            disabled={loading}
            style={{ padding: '14px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '600', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          * Default credentials: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Reset Admin Password</h4>
            
            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                  If the email exists in our records, a secure password reset link has been dispatched to <strong>{forgotEmail}</strong>.
                </p>
                <button className="btn-ripple btn-primary" onClick={() => setShowForgot(false)} style={{ padding: '10px 20px', fontSize: '13px' }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                  Enter your registered institutional email address. We will email instructions to reset your account.
                </p>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    className="form-input" 
                    placeholder="prarthanaprajith9@gmail.com" 
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-ripple btn-secondary" onClick={() => setShowForgot(false)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-ripple btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
