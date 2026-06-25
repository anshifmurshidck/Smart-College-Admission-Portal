import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState({ students: 0, placements: 0, faculty: 0, awards: 0 });

  useEffect(() => {
    // Smooth counting micro-animation on mount
    const duration = 1500;
    const steps = 50;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setStats({
        students: Math.min(Math.floor((5200 / steps) * step), 5200),
        placements: Math.min(Math.floor((98 / steps) * step), 98),
        faculty: Math.min(Math.floor((280 / steps) * step), 280),
        awards: Math.min(Math.floor((15 / steps) * step), 15)
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  const programs = [
    { title: 'Computer Science Engineering', code: 'CSE', desc: 'Study software design, systems, architecture, and coding frameworks.' },
    { title: 'Artificial Intelligence & Machine Learning', code: 'AIML', desc: 'Focus on neural networks, neural computing, deep learning, and automation.' },
    { title: 'Electronics & Communication Engineering', code: 'ECE', desc: 'Master IoT devices, VLSI designs, signal communications, and circuitry.' },
    { title: 'Mechanical Engineering', code: 'ME', desc: 'Design thermal power units, aerospace grids, machine systems, and robotics.' },
    { title: 'Civil Engineering', code: 'CE', desc: 'Engineer structural architectures, highway networks, and eco-infrastructure.' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section 
        style={{
          background: 'radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent), radial-gradient(circle at bottom left, rgba(37, 99, 235, 0.08), transparent)',
          padding: '120px 0 80px 0',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Floating circles decor */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'var(--color-royal)', filter: 'blur(150px)', opacity: 0.1, top: '-50px', right: '-50px', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'var(--color-purple)', filter: 'blur(130px)', opacity: 0.08, bottom: '-50px', left: '-50px', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          {/* Badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.15)',
              color: 'var(--color-royal)',
              fontWeight: '600',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '28px',
            }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: 'var(--color-royal)', borderRadius: '50%', animation: 'pulse-glow 1.5s infinite' }} />
            Admissions Open 2026-2027
          </div>

          <h1 
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              lineHeight: 1.15,
              marginBottom: '24px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-1px'
            }}
          >
            Empowering Minds, <span className="gradient-text-blue-purple">Engineering</span> the Future.
          </h1>

          <p 
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '40px',
              fontWeight: '400'
            }}
          >
            Join Thought Minds Engineering College (TMEC) and step into a legacy of innovation, A++ accredited pedagogy, and unparalleled placement records. Secure your admission today.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/apply" className="btn-ripple btn-primary" style={{ gap: '8px' }}>
              Apply for Admission <ArrowRight size={16} />
            </Link>
            <Link to="/departments" className="btn-ripple btn-secondary">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', textAlign: 'center' }}>
            {[
              { label: 'Students Enrolled', value: `${stats.students}+`, sub: 'Active community' },
              { label: 'Placements Success', value: `${stats.placements}%`, sub: 'Top-tier tech firms' },
              { label: 'Accredited Faculty', value: `${stats.faculty}+`, sub: 'Doctoral guidance' },
              { label: 'National Awards', value: `${stats.awards}+`, sub: 'Research excellence' }
            ].map((stat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-royal)', fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{stat.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About College / Accredited Accreditation */}
      <section className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-purple)' }}>Accredited Institution</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px', marginBottom: '20px', fontFamily: 'var(--font-secondary)' }}>
              Accredited with A++ Grade by National Boards
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
              Thought Minds Engineering College is universally recognized for research outputs and patent designs. Our syllabus is developed in collaboration with top IT developers and industry veterans, ensuring students graduate ready for work.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Global Standard Smart Campus Laboratories',
                'Advanced Artificial Intelligence Incubation Center',
                '98% Placement records inside Fortune 500 Companies',
                'Distinguished visiting professors from MIT, IITs'
              ].map((point) => (
                <div key={point} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={18} color="var(--color-royal)" />
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="glass-panel" 
            style={{ 
              padding: '40px', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(124,58,237,0.03) 100%)'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--color-royal)', boxShadow: 'var(--shadow-card)' }}>
                <Award size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Accreditation A++ Grade</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Highest academic recognition standard</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--color-purple)', boxShadow: 'var(--shadow-card)' }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '700' }}>ISO 9001:2015</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Standardized process implementation</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--color-gold)', boxShadow: 'var(--shadow-card)' }}>
                <Users size={32} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Global Alumni Group</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Network of 15,000+ professionals worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-royal)' }}>ACADEMIC DISCIPLINES</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px', fontFamily: 'var(--font-secondary)' }}>Our Five Core Engineering Branches</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '12px auto 0 auto' }}>
              We offer comprehensive 4-year Bachelor of Engineering courses featuring tailored electives and hands-on laboratory modules.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {programs.map((prog, idx) => (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '30px', 
                  borderRadius: 'var(--radius-md)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--color-royal)',
                  backgroundColor: 'rgba(37,99,235,0.08)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  width: 'fit-content'
                }}>
                  {prog.code}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.3' }}>{prog.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', flex: 1 }}>{prog.desc}</p>
                <Link to="/departments" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-royal)', fontSize: '14px', fontWeight: '600', width: 'fit-content' }}>
                  Learn More <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-purple)', letterSpacing: '1px' }}>STUDENT VOICES</span>
            <h2 style={{ fontSize: '32px', marginTop: '10px', fontFamily: 'var(--font-secondary)' }}>Alumni Testimonials</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            {[
              {
                text: "Applying to TMEC was the best decision of my career. The lab facilities and expert guidance in ECE got me placed as a Research Engineer at Silicon Labs.",
                name: "Samantha Miller",
                role: "ECE Graduate (Class of 2024)"
              },
              {
                text: "The AIML program is intensely structured. We worked on actual machine learning models with GPU clusters. The placement cell helped me secure a Software Engineer role at Google.",
                name: "Arjun Verma",
                role: "AIML Graduate (Class of 2025)"
              },
              {
                text: "CSE classes were highly engaging. The curriculum is completely aligned with modern tech standards. I run my own startup now, incubated inside TMEC.",
                name: "Daniel Craig",
                role: "CSE Graduate (Class of 2023)"
              }
            ].map((t, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '15px', fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-secondary)' }}>"{t.text}"</p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>{t.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)',
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ maxWidth: '700px', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Take the First Step Today</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
            Admissions for the current academic session are closing shortly. Fill out your details online, upload your documents, and track your application in real-time.
          </p>
          <Link to="/apply" className="btn-ripple btn-primary" style={{ padding: '14px 36px', fontSize: '16px' }}>
            Start Your Application Now
          </Link>
        </div>
      </section>
    </div>
  );
}
