import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer 
      style={{
        backgroundColor: 'var(--color-navy)',
        color: '#ffffff',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: '60px',
        paddingBottom: '30px',
        fontSize: '14px'
      }}
    >
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>
        
        {/* About College */}
        <div>
          <div style={{ display: 'flex', itemsCenter: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '1px', fontFamily: 'var(--font-display)' }}>TMEC</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '20px' }}>
            Thought Minds Engineering College is a premier institution shaping future technology leaders through rigorous academics, cutting-edge research, and top-tier industrial placements.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '0.5px' }}>Academic Links</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Home', 'Apply Now', 'Academic Programs', 'Track Status'].map((text, idx) => {
              const paths = ['/', '/apply', '/departments', '/track'];
              return (
                <li key={text} style={{ marginBottom: '12px' }}>
                  <Link to={paths[idx]} style={{ color: 'rgba(255,255,255,0.7)', transition: 'var(--transition-fast)' }}
                    onMouseOver={(e) => e.target.style.color = 'var(--color-sky)'}
                    onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                  >
                    {text}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Engineering Branches */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '0.5px' }}>Departments</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {['Computer Science', 'AI & Machine Learning', 'Electronics & Comm', 'Mechanical Eng', 'Civil Eng'].map((name) => (
              <li key={name} style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.7)' }}>
                <Link to="/departments" style={{ color: 'inherit' }}
                  onMouseOver={(e) => e.target.style.color = 'var(--color-sky)'}
                  onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.7)'}
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '0.5px' }}>Contact Information</h4>
          <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.7)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <MapPin size={18} style={{ color: 'var(--color-sky)' }} />
              <span>100 Technology Parkway, Tech City, TC 90210</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Phone size={18} style={{ color: 'var(--color-sky)' }} />
              <span>+1 (555) 0199 / 0122</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Mail size={18} style={{ color: 'var(--color-sky)' }} />
              <span>admissions@thoughtminds.edu</span>
            </li>
          </ul>
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', margin: '30px 0' }} />

      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
        <span>© {new Date().getFullYear()} Thought Minds Engineering College. All rights reserved.</span>
        <span>Accredited A++ Grade | NIRF Top 50 Engineering Institute</span>
      </div>
    </footer>
  );
}
