import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('inquiries').insert([{
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      }]);
      
      if (error) throw error;
      
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch(err) {
      console.error(err);
      alert('Failed to send inquiry. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '100vh' }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontFamily: 'var(--font-secondary)', fontWeight: 800 }}>
            Connect with TMEC
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0 auto' }}>
            Reach out to our admission office, admissions advisory board, or technical support desks. We reply within 24 hours.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px' }}>
          
          {/* Column 1: Contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Admissions Desk</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                <MapPin size={20} style={{ color: 'var(--color-royal)', flexShrink: 0 }} />
                <span>Administration Block A, Thought Minds Campus, TC 90210</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                <Phone size={20} style={{ color: 'var(--color-royal)', flexShrink: 0 }} />
                <span>+1 (555) 0199 (10:00 AM - 5:00 PM EST)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                <Mail size={20} style={{ color: 'var(--color-royal)', flexShrink: 0 }} />
                <a href="mailto:admissions@thoughtminds.edu" style={{ color: 'var(--color-royal)', fontWeight: '500' }}>admissions@thoughtminds.edu</a>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Support Hotlines</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div>
                  <strong>Admission Office</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>+1 (555) 0122</p>
                </div>
                <div>
                  <strong>Dean of Academics</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>+1 (555) 0155</p>
                </div>
                <div>
                  <strong>Accounts & Fees</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>+1 (555) 0166</p>
                </div>
                <div>
                  <strong>Hostel & Lodging</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>+1 (555) 0188</p>
                </div>
              </div>
            </div>

          </div>

          {/* Column 2: Inquiry Form */}
          <div className="glass-panel" style={{ padding: '40px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '24px', fontFamily: 'var(--font-secondary)' }}>Send an Inquiry</h3>
            
            {submitted ? (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '30px', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  textAlign: 'center'
                }}
              >
                <CheckCircle size={44} />
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '18px' }}>Message Sent!</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', lineHeight: '1.5' }}>
                    Thank you for writing to us. Our academic support representative will contact you shortly.
                  </p>
                </div>
                <button className="btn-ripple btn-secondary" onClick={() => setSubmitted(false)} style={{ marginTop: '12px' }}>
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="form-input" 
                    placeholder="Jane Doe" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className="form-input" 
                    placeholder="jane@example.com" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    value={formData.subject} 
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                    className="form-input" 
                    placeholder="General Admission Question" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Inquiry Message</label>
                  <textarea 
                    required 
                    value={formData.message} 
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                    rows="4" 
                    className="form-textarea" 
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn-ripple btn-primary"
                  disabled={loading}
                  style={{ padding: '14px', cursor: 'pointer', display: 'flex', gap: '8px', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                >
                  <Send size={16} />
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
