import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

/* ─────────────────────────────────────────────────────────────
   DEPARTMENT DATA — static fallback + enrichment meta
───────────────────────────────────────────────────────────── */
const DEPT_META = {
  CSE: {
    image: '/dept_cse.png',
    accent: '#3B82F6',
    accentRgb: '59,130,246',
    accentSecondary: '#06B6D4',
    badge: 'CS & Engineering',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="m8 21 4-4 4 4" /><path d="M12 17v4" />
        <path d="m9 8 2 2-2 2" /><path d="M13 12h2" />
      </svg>
    ),
    features: ['AI / ML Integration', 'Cloud Computing', 'Cyber Security', 'Full-Stack Dev'],
    seats: 120,
    duration: '4 Years',
  },
  AIML: {
    image: '/dept_aiml.png',
    accent: '#7C3AED',
    accentRgb: '124,58,237',
    accentSecondary: '#A855F7',
    badge: 'AI & Machine Learning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M6 10a4 4 0 0 0-4 4v2h4" /><path d="M18 10a4 4 0 0 1 4 4v2h-4" />
        <path d="M9 20v-2a3 3 0 0 1 6 0v2" /><circle cx="12" cy="20" r="2" />
      </svg>
    ),
    features: ['Neural Networks', 'Deep Learning', 'NLP & Vision', 'Robotics AI'],
    seats: 60,
    duration: '4 Years',
  },
  ECE: {
    image: '/dept_ece.png',
    accent: '#06B6D4',
    accentRgb: '6,182,212',
    accentSecondary: '#22D3EE',
    badge: 'Electronics & Comm',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0Z" />
        <path d="M14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0Z" />
        <path d="M1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
        <path d="M17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" />
      </svg>
    ),
    features: ['VLSI Design', 'Signal Processing', 'IoT & Sensors', '5G Networks'],
    seats: 90,
    duration: '4 Years',
  },
  ME: {
    image: '/dept_mech.png',
    accent: '#F97316',
    accentRgb: '249,115,22',
    accentSecondary: '#FB923C',
    badge: 'Mechanical Engg.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    features: ['Robotics', 'Thermodynamics', 'CNC Machining', 'Industrial Auto.'],
    seats: 60,
    duration: '4 Years',
  },
  CE: {
    image: '/dept_civil.png',
    accent: '#10B981',
    accentRgb: '16,185,129',
    accentSecondary: '#34D399',
    badge: 'Civil Engineering',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    features: ['Smart Cities', 'Structural Design', 'Geo-tech Eng.', 'Green Build'],
    seats: 60,
    duration: '4 Years',
  },
};

const STATIC_DEPTS = [
  { id: 1, name: 'Computer Science Engineering', code: 'CSE', description: 'Master software architecture, cloud-native systems, AI integrations, and full-stack development with industry-grade tools.', head_of_department: 'Dr. Alan Turing', email: 'hod.cse@thoughtminds.edu', phone: '+1-555-0101' },
  { id: 2, name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'Dive deep into neural networks, generative AI, computer vision, natural language processing, and autonomous intelligent systems.', head_of_department: 'Dr. Ada Lovelace', email: 'hod.aiml@thoughtminds.edu', phone: '+1-555-0102' },
  { id: 3, name: 'Electronics & Communication Engineering', code: 'ECE', description: 'Design next-gen communication networks, VLSI chips, IoT ecosystems, 5G protocols, and embedded signal-processing systems.', head_of_department: 'Dr. Nikola Tesla', email: 'hod.ece@thoughtminds.edu', phone: '+1-555-0103' },
  { id: 4, name: 'Mechanical Engineering', code: 'ME', description: 'Engineer precision machines, robotic automation, thermodynamic systems, and industrial manufacturing for the future.', head_of_department: 'Dr. James Watt', email: 'hod.mech@thoughtminds.edu', phone: '+1-555-0104' },
  { id: 5, name: 'Civil Engineering', code: 'CE', description: 'Build resilient smart cities, sustainable infrastructure, cutting-edge structural systems, and intelligent transportation networks.', head_of_department: 'Dr. Thomas Telford', email: 'hod.civil@thoughtminds.edu', phone: '+1-555-0105' },
];

/* ─────────────────────────────────────────────────────────────
   PARTICLE SYSTEM
───────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    const N = 120;
    const COLORS = ['#3B82F6', '#7C3AED', '#06B6D4', '#A855F7', '#38BDF8'];
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const CONNECTION_DIST = 120;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `,${p.alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(') ;
        // simple hex→rgba
        const hex = p.color.slice(1);
        const num = parseInt(hex, 16);
        const r2 = (num >> 16) & 255, g2 = (num >> 8) & 255, b2 = num & 255;
        ctx.fillStyle = `rgba(${r2},${g2},${b2},${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,130,246,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0, opacity: 0.7,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED BACKGROUND BLOBS
───────────────────────────────────────────────────────────── */
function AuroraBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none',
    }}>
      {/* Neon grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Aurora blobs */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-15%',
        width: '70vw', height: '70vw',
        background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, rgba(124,58,237,0.08) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'deptBlobA 18s ease-in-out infinite',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.08) 50%, transparent 70%)',
        borderRadius: '50%',
        animation: 'deptBlobB 22s ease-in-out infinite',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '30%',
        width: '50vw', height: '40vw',
        background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.10) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'deptBlobC 26s ease-in-out infinite',
        filter: 'blur(80px)',
      }} />

      {/* Light rays */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '2px', height: '60vh',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.25) 0%, transparent 100%)',
        filter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: '30%',
        width: '1px', height: '40vh',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.2) 0%, transparent 100%)',
        filter: 'blur(1px)',
      }} />

      {/* Floating glass cubes */}
      {[
        { top: '10%', left: '5%', size: 40, delay: '0s', color: 'rgba(59,130,246,0.12)' },
        { top: '20%', right: '8%', size: 28, delay: '2s', color: 'rgba(124,58,237,0.12)' },
        { top: '60%', left: '3%', size: 20, delay: '4s', color: 'rgba(6,182,212,0.12)' },
        { bottom: '15%', right: '5%', size: 35, delay: '1s', color: 'rgba(124,58,237,0.10)' },
        { top: '45%', right: '3%', size: 16, delay: '3s', color: 'rgba(59,130,246,0.10)' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: c.top, left: c.left, right: c.right, bottom: c.bottom,
          width: c.size, height: c.size,
          background: c.color,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          animation: `deptFloat ${6 + i}s ease-in-out infinite`,
          animationDelay: c.delay,
          transform: `rotate(${15 + i * 10}deg)`,
        }} />
      ))}

      {/* Stars */}
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          width: Math.random() < 0.3 ? '2px' : '1px',
          height: Math.random() < 0.3 ? '2px' : '1px',
          background: `rgba(255,255,255,${0.2 + Math.random() * 0.5})`,
          borderRadius: '50%',
          animation: `starTwinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEPARTMENT CARD
───────────────────────────────────────────────────────────── */
function DeptCard({ dept, meta, index, visible }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [hovered, setHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -8;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 8;
    setTilt({ rx, ry });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0 });
    setHovered(false);
  }, []);

  const accent = meta.accent;
  const accentRgb = meta.accentRgb;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        borderRadius: '28px',
        background: `linear-gradient(135deg, rgba(6,11,24,0.85) 0%, rgba(15,23,42,0.75) 100%)`,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${hovered ? `rgba(${accentRgb},0.45)` : 'rgba(255,255,255,0.08)'}`,
        boxShadow: hovered
          ? `0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(${accentRgb},0.25), inset 0 1px 0 rgba(255,255,255,0.08)`
          : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
        transform: hovered
          ? `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateY(-10px) scale(1.02)`
          : `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)`,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
        overflow: 'hidden',
        cursor: 'default',
        opacity: visible ? 1 : 0,
        animationDelay: `${index * 0.12}s`,
        animation: visible ? `deptCardIn 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s both` : 'none',
        willChange: 'transform',
      }}
    >
      {/* Gradient border overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '28px', pointerEvents: 'none', zIndex: 1,
        background: hovered
          ? `linear-gradient(135deg, rgba(${accentRgb},0.12) 0%, transparent 50%)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
        transition: 'background 0.3s ease',
      }} />

      {/* Glow reflection */}
      {hovered && (
        <div style={{
          position: 'absolute', top: '-40%', left: '-20%', width: '140%', height: '80%',
          background: `radial-gradient(ellipse at 50% 0%, rgba(${accentRgb},0.12) 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 1,
          transition: 'opacity 0.3s ease',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Image Section ── */}
        <div style={{
          position: 'relative',
          height: '260px',
          overflow: 'hidden',
          borderRadius: '28px 28px 0 0',
          background: `linear-gradient(135deg, rgba(${accentRgb},0.1) 0%, rgba(6,11,24,0.8) 100%)`,
        }}>
          {/* Shimmer while loading */}
          {!imgLoaded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s infinite',
            }} />
          )}
          <img
            src={meta.image}
            alt={dept.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.06) translateY(-4px)' : 'scale(1) translateY(0)',
              transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
              filter: hovered
                ? `brightness(1.1) saturate(1.2) drop-shadow(0 0 20px rgba(${accentRgb},0.4))`
                : `brightness(0.95) saturate(1.05)`,
              opacity: imgLoaded ? 1 : 0,
              willChange: 'transform',
            }}
          />

          {/* Bottom gradient fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
            background: 'linear-gradient(to top, rgba(6,11,24,0.95) 0%, transparent 100%)',
          }} />

          {/* Badge */}
          <div style={{
            position: 'absolute', top: 16, left: 16,
            padding: '5px 12px',
            borderRadius: '999px',
            background: `rgba(${accentRgb},0.18)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid rgba(${accentRgb},0.35)`,
            color: accent,
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px',
            textTransform: 'uppercase',
            boxShadow: `0 0 12px rgba(${accentRgb},0.2)`,
          }}>
            {meta.badge}
          </div>

          {/* Icon circle */}
          <div style={{
            position: 'absolute', top: 16, right: 16,
            width: 40, height: 40, borderRadius: '12px',
            background: `rgba(${accentRgb},0.2)`,
            backdropFilter: 'blur(12px)',
            border: `1px solid rgba(${accentRgb},0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
            boxShadow: hovered ? `0 0 20px rgba(${accentRgb},0.4)` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}>
            {meta.icon}
          </div>

          {/* Dept code pill */}
          <div style={{
            position: 'absolute', bottom: 14, right: 16,
            padding: '4px 10px', borderRadius: '6px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px',
            color: 'rgba(255,255,255,0.7)',
          }}>
            {dept.code}
          </div>
        </div>

        {/* ── Card Body ── */}
        <div style={{ padding: '24px 28px 28px' }}>

          {/* Department Name */}
          <h3 style={{
            fontSize: '20px', fontWeight: 800,
            fontFamily: 'var(--font-secondary)',
            color: '#ffffff',
            lineHeight: 1.25, marginBottom: '10px',
            background: hovered
              ? `linear-gradient(135deg, #ffffff 0%, ${accent} 120%)`
              : 'none',
            WebkitBackgroundClip: hovered ? 'text' : 'unset',
            WebkitTextFillColor: hovered ? 'transparent' : '#ffffff',
            backgroundClip: hovered ? 'text' : 'unset',
            transition: 'all 0.3s ease',
          }}>
            {dept.name}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: '13.5px', color: 'rgba(148,163,184,0.9)',
            lineHeight: 1.7, marginBottom: '20px',
          }}>
            {dept.description}
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {meta.features.map((f) => (
              <span key={f} style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: `rgba(${accentRgb},0.1)`,
                border: `1px solid rgba(${accentRgb},0.2)`,
                color: accent,
                fontSize: '11px', fontWeight: 600,
                transition: 'all 0.2s ease',
              }}>
                {f}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '20px', marginBottom: '24px',
            paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.6)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seats</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: accent }}>{meta.seats}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.6)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>{meta.duration}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(148,163,184,0.6)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HOD</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{dept.head_of_department}</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to={`/apply?dept=${dept.id}`}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accent} 0%, ${meta.accentSecondary} 100%)`,
                color: '#ffffff',
                fontSize: '13px', fontWeight: 700,
                textDecoration: 'none',
                border: 'none',
                boxShadow: hovered ? `0 8px 24px rgba(${accentRgb},0.5)` : `0 4px 12px rgba(${accentRgb},0.3)`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            >
              Apply Now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={() => window.location.href = `mailto:${dept.email}`}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovered ? `rgba(${accentRgb},0.35)` : 'rgba(255,255,255,0.1)'}`,
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px', fontWeight: 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(8px)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────────────────────── */
function SectionHeading({ visible }) {
  return (
    <div style={{
      textAlign: 'center', marginBottom: '80px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {/* Overline */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '6px 18px', borderRadius: '999px',
        background: 'rgba(59,130,246,0.1)',
        border: '1px solid rgba(59,130,246,0.25)',
        marginBottom: '24px',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#3B82F6',
          boxShadow: '0 0 8px rgba(59,130,246,0.8)',
          animation: 'pulse-dot 2s ease infinite',
        }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6', letterSpacing: '1px', textTransform: 'uppercase' }}>
          World-Class Education
        </span>
      </div>

      {/* Main title */}
      <h1 style={{
        fontSize: 'clamp(36px, 6vw, 68px)',
        fontWeight: 900,
        fontFamily: 'var(--font-display)',
        lineHeight: 1.1,
        marginBottom: '20px',
        color: '#ffffff',
      }}>
        Explore Our{' '}
        <span style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.4))',
        }}>
          Departments
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 'clamp(15px, 2vw, 18px)',
        color: 'rgba(148,163,184,0.85)',
        maxWidth: '640px', margin: '0 auto 32px',
        lineHeight: 1.75,
      }}>
        Discover world-class education, cutting-edge laboratories, experienced faculty,
        and industry-focused learning designed to{' '}
        <span style={{ color: '#3B82F6', fontWeight: 600 }}>shape your future</span>.
      </p>

      {/* Stats row */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Departments', value: '5+', color: '#3B82F6' },
          { label: 'Students', value: '5,000+', color: '#7C3AED' },
          { label: 'Faculty', value: '200+', color: '#06B6D4' },
          { label: 'Placements', value: '98%', color: '#10B981' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.7)', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN DEPARTMENTS PAGE
───────────────────────────────────────────────────────────── */
export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    axios.get(`${API_BASE}/departments`)
      .then((res) => { setDepartments(res.data); setLoading(false); })
      .catch(() => { setDepartments(STATIC_DEPTS); setLoading(false); });
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setHeadingVisible(true), 100);
    const t2 = setTimeout(() => setCardsVisible(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const enriched = departments.map((d) => ({
    dept: d,
    meta: DEPT_META[d.code] || DEPT_META.CSE,
  }));

  return (
    <>
      {/* ── Global keyframe injection ── */}
      <style>{`
        @keyframes deptBlobA {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(80px,-60px) scale(1.1); }
          66%  { transform: translate(-40px,40px) scale(0.9); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes deptBlobB {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(-60px,50px) scale(1.08); }
          66%  { transform: translate(50px,-30px) scale(0.93); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes deptBlobC {
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(40px,-40px) scale(1.05); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes deptFloat {
          0%,100% { transform: translateY(0px) rotate(15deg); }
          50%     { transform: translateY(-18px) rotate(20deg); }
        }
        @keyframes starTwinkle {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50%     { opacity: 1; transform: scale(1.5); }
        }
        @keyframes deptCardIn {
          from { opacity:0; transform: perspective(1200px) translateY(40px) scale(0.97); }
          to   { opacity:1; transform: perspective(1200px) translateY(0) scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes pulse-dot {
          0%  { box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
          100%{ box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        @keyframes deptSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Animated backgrounds ── */}
      <AuroraBackground />
      <ParticleCanvas />

      {/* ── Page Content ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        paddingTop: '110px',
        paddingBottom: '100px',
      }}>
        <div className="container" style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px' }}>

          {/* ── Section Heading ── */}
          <SectionHeading visible={headingVisible} />

          {/* ── Cards Grid ── */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
            }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{
                  borderRadius: '28px', height: '520px',
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '260px',
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.8s infinite',
                  }} />
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[70, 90, 60].map((w, i) => (
                      <div key={i} style={{
                        height: i === 0 ? 22 : i === 1 ? 48 : 14,
                        width: `${w}%`,
                        borderRadius: '6px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.8s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '28px',
            }}>
              {enriched.map(({ dept, meta }, idx) => (
                <DeptCard
                  key={dept.id}
                  dept={dept}
                  meta={meta}
                  index={idx}
                  visible={cardsVisible}
                />
              ))}
            </div>
          )}

          {/* ── Bottom CTA ── */}
          {!loading && (
            <div style={{
              textAlign: 'center', marginTop: '80px',
              opacity: cardsVisible ? 1 : 0,
              transform: cardsVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s',
            }}>
              <div style={{
                display: 'inline-block',
                padding: '40px 60px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(124,58,237,0.08) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
                backdropFilter: 'blur(20px)',
              }}>
                <h2 style={{
                  fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800,
                  fontFamily: 'var(--font-display)', color: '#ffffff',
                  marginBottom: '12px',
                }}>
                  Ready to Begin Your Journey?
                </h2>
                <p style={{ color: 'rgba(148,163,184,0.8)', marginBottom: '24px', fontSize: '15px' }}>
                  Applications are open. Secure your seat in one of our world-class programs.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    to="/apply"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '14px 32px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)',
                      color: '#ffffff', fontSize: '14px', fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 8px 30px rgba(59,130,246,0.4)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(59,130,246,0.55)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(59,130,246,0.4)'; }}
                  >
                    Apply Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to="/contact"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '14px 32px', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 600,
                      textDecoration: 'none',
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    Contact Admissions
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
