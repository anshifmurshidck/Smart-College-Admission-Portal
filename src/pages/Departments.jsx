import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Mail, Phone, Clock, ArrowRight, User } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    axios.get(`${API_BASE}/departments`)
      .then((res) => {
        setDepartments(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        // Static fallback
        setDepartments([
          {
            id: 1,
            name: 'Computer Science Engineering',
            code: 'CSE',
            description: 'Department of Computer Science Engineering focuses on software, hardware design, and cutting edge computational systems.',
            head_of_department: 'Dr. Alan Turing',
            email: 'hod.cse@thoughtminds.edu',
            phone: '+1-555-0101'
          },
          {
            id: 2,
            name: 'Artificial Intelligence & Machine Learning',
            code: 'AIML',
            description: 'Specialized department covering modern neural networks, machine learning algorithms, big data, and expert systems.',
            head_of_department: 'Dr. Ada Lovelace',
            email: 'hod.aiml@thoughtminds.edu',
            phone: '+1-555-0102'
          },
          {
            id: 3,
            name: 'Electronics & Communication Engineering',
            code: 'ECE',
            description: 'Focuses on communication networks, signal processing, VLSI design, and microelectronics.',
            head_of_department: 'Dr. Nikola Tesla',
            email: 'hod.ece@thoughtminds.edu',
            phone: '+1-555-0103'
          },
          {
            id: 4,
            name: 'Mechanical Engineering',
            code: 'ME',
            description: 'Covers thermo-dynamics, fluid mechanics, industrial robotics, and advanced mechanical systems design.',
            head_of_department: 'Dr. James Watt',
            email: 'hod.mech@thoughtminds.edu',
            phone: '+1-555-0104'
          },
          {
            id: 5,
            name: 'Civil Engineering',
            code: 'CE',
            description: 'Focuses on structural design, geotechnical modeling, urban engineering, and sustainable construction.',
            head_of_department: 'Dr. Thomas Telford',
            email: 'hod.civil@thoughtminds.edu',
            phone: '+1-555-0105'
          }
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '60px 0', minHeight: '100vh' }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontFamily: 'var(--font-secondary)', fontWeight: 800 }}>
            Academic Departments & Programs
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0 auto' }}>
            Explore our state-of-the-art laboratories, tailored engineering curricula, and specialized doctoral mentorship.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-panel" style={{ padding: '30px', height: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="skeleton" style={{ height: '30px', width: '30%' }} />
                <div className="skeleton" style={{ height: '24px', width: '70%' }} />
                <div className="skeleton" style={{ height: '80px', width: '100%' }} />
                <div className="skeleton" style={{ height: '20px', width: '50%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
            {departments.map((dept, idx) => (
              <div 
                key={dept.id} 
                className="glass-panel" 
                style={{ 
                  padding: '40px', 
                  borderRadius: 'var(--radius-lg)', 
                  display: 'flex', 
                  flexDirection: 'row', 
                  flexWrap: 'wrap',
                  gap: '40px',
                  alignItems: 'center',
                  background: idx % 2 === 0 
                    ? 'linear-gradient(135deg, rgba(37,99,235,0.02) 0%, rgba(124,58,237,0.02) 100%)' 
                    : 'var(--bg-secondary)'
                }}
              >
                
                {/* Visual Icon Box */}
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: 'var(--shadow-card)',
                  flexShrink: 0
                }}>
                  <GraduationCap size={44} />
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>
                      {dept.name}
                    </h3>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      color: 'var(--color-royal)', 
                      backgroundColor: 'rgba(37,99,235,0.08)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {dept.code}
                    </span>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>
                    {dept.description}
                  </p>

                  {/* HOD Card Sub-Layout */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '24px', 
                    marginTop: '12px', 
                    paddingTop: '16px', 
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} style={{ color: 'var(--color-royal)' }} />
                      <span>HOD: <strong>{dept.head_of_department}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} style={{ color: 'var(--color-royal)' }} />
                      <a href={`mailto:${dept.email}`} style={{ color: 'inherit' }}>{dept.email}</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={16} style={{ color: 'var(--color-royal)' }} />
                      <span>{dept.phone}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Action Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '150px' }}>
                  <Link to={`/apply?dept=${dept.id}`} className="btn-ripple btn-primary" style={{ padding: '12px 20px', fontSize: '13px', display: 'flex', gap: '6px' }}>
                    Apply Here <ArrowRight size={14} />
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', justifyContent: 'center' }}>
                    <Clock size={14} />
                    <span>Duration: 4 Years</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
