import React, { useState } from 'react';
import { Check, Copy, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function SuccessModal({ isOpen, applicationId, ocrResult, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isApproved = ocrResult?.verified;
  const studentId = ocrResult?.studentId;
  const details = ocrResult?.details || {};
  const hasMismatch = ocrResult && !isApproved;

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
        {/* Animated Icon Header (Check vs Warning) */}
        {hasMismatch ? (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
          }}>
            <AlertTriangle size={36} color="white" />
          </div>
        ) : (
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            <Check size={36} color="white" />
          </div>
        )}

        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          marginBottom: '12px', 
          fontFamily: 'var(--font-secondary)',
          color: hasMismatch ? '#ef4444' : 'var(--text-primary)'
        }}>
          {hasMismatch ? 'Verification Mismatch Detected' : 'Application Submitted!'}
        </h3>
        
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', fontSize: '14px' }}>
          {hasMismatch ? (
            <span>
              Your application was submitted, but a mismatch was detected between the details you entered and your uploaded documents (specifically {!details.aadhaar_matched ? <strong>your Aadhaar number</strong> : 'your academic/personal details'}). It has been <strong>flagged for Manual Review</strong> by the admissions office.
            </span>
          ) : (
            'Thank you! Your application has been successfully submitted and is now under administrative review. The admissions office will evaluate your academic details and documents shortly.'
          )}
        </p>

        {ocrResult && !ocrResult.tesseractActive && !ocrResult.details?.error && (
          <div 
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.04)',
              border: '1px solid rgba(245, 158, 11, 0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              fontSize: '12px',
              color: '#d97706',
              marginBottom: '20px',
              textAlign: 'left',
              lineHeight: '1.4'
            }}
          >
            <strong>💡 Demo Notice:</strong> Tesseract OCR engine was not found on this server. Document image contents were <strong>not</strong> read; verification has been simulated. Upload text-based <strong>PDF files</strong> to run real matching.
          </div>
        )}

        {isApproved ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(5,150,105,0.06) 100%)', 
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: '700', color: '#059669', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase' }}>
              ✓ AI OCR Document Pre-Verification
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              All uploaded documents (Marksheets & ID Proof) successfully matched the details you filled!
            </div>
          </div>
        ) : (
          Object.keys(details).length > 0 && (
            details.error ? (
              <div 
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.04)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontWeight: '700', color: '#ef4444', marginBottom: '6px', textTransform: 'uppercase', fontSize: '11px' }}>
                  ⚠️ AI OCR Pre-Verification Unavailable
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Automatic document verification could not be completed at this time (the verification server appears to be offline). The admissions office will evaluate your uploaded documents manually.
                </div>
              </div>
            ) : (
              <div 
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.06)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  fontSize: '12px',
                  textAlign: 'left',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontWeight: '700', color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase', fontSize: '11px' }}>
                  ⚠️ AI OCR Pre-Verification Flags:
                </div>
                <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {!details.name_matched && <li>Applicant name on ID Proof does not match filled name.</li>}
                  {!details.aadhaar_matched && <li style={{ fontWeight: '600', color: '#ef4444' }}>Aadhaar Number on ID Proof does not match filled number.</li>}
                  {!details.tenth_matched && <li>Marks or percentage on 10th Marksheet do not match filled details.</li>}
                  {!details.twelfth_matched && <li>Marks or percentage on 12th Marksheet do not match filled details.</li>}
                </ul>
              </div>
            )
          )
        )}

        {/* Display Application ID Card */}
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
            <span style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '1px', color: 'var(--text-muted)' }}>
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

        {/* Action Buttons */}
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
