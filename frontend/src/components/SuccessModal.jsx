import React, { useState } from 'react';
import { Check, Copy, CheckCircle2 } from 'lucide-react';

export default function SuccessModal({ isOpen, applicationId, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '40px',
          textAlign: 'center',
          animation: 'float 6s ease-in-out infinite',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Check size={36} color="white" />
          </div>

        <h3
          style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '12px',
            fontFamily: 'var(--font-secondary)',
            color: 'var(--text-primary)'
          }}
        >
          Application Submitted!
        </h3>

        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', fontSize: '14px' }}>
          Thank you! Your application and documents were received successfully.
          Please save your application ID to track the review status.
        </p>



        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px dashed var(--color-royal)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            gap: '12px',
            marginBottom: '32px'
          }}
        >
          <div style={{ textAlign: 'left', flex: 1 }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
              Your Application ID
            </span>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-royal)', fontFamily: 'var(--font-display)' }}>
              {applicationId}
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-royal)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn-ripple btn-primary"
            onClick={onClose}
            style={{ width: '100%', padding: '14px 20px', cursor: 'pointer' }}
          >
            Go to Tracking Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
