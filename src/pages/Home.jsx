import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, Award, Users, TrendingUp,
  BookOpen, CheckCircle2, ShieldCheck, Cpu, BrainCircuit,
  Radio, Wrench, Building2, ChevronRight
} from 'lucide-react';

/* ─── Floating Particle Component ─────────────────────────────── */
function Particle({ style }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.6)',
        animation: `particleRise ${3 + Math.random() * 4}s ease-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
        ...style
      }}
    />
  );
}

/* ─── 3D Tilt Card ─────────────────────────────────────────────── */
function TiltCard({ children, style = {}, className = '' }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;
    const rotateY = ((x - cx) / cx) * 8;
    ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    }
  };

  return (
    <div
      ref={ref}
      className={`glass-panel ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.15s ease, box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
        cursor: 'default',
        ...style
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
        zIndex: 2
      }} />
    </div>
  );
}

/* ─── Animated Counter ────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const numericTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
        const duration = 1800;
        const steps = 60;
        const increment = numericTarget / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= numericTarget) {
            setCount(numericTarget);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current * 10) / 10);
          }
        }, duration / steps);
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const displayVal = () => {
    const n = parseFloat(target.replace(/[^0-9.]/g, ''));
    if (target.includes('.')) return count.toFixed(1) + suffix;
    if (target.includes('+')) return Math.floor(count).toLocaleString() + '+' + suffix;
    return Math.floor(count) + suffix;
  };

  return <span ref={ref}>{displayVal()}</span>;
}

/* ─── Department SVG Illustrations ─────────────────────────── */
const IllustCSE = ({ color }) => (
  <svg viewBox="0 0 120 90" fill="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="cseS" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="cseG" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="55" rx="52" ry="30" fill="url(#cseG)" />
    <rect x="15" y="62" width="90" height="7" rx="3" fill="#1e3a8a" opacity="0.8" />
    <rect x="30" y="69" width="60" height="2" rx="1" fill={color} opacity="0.4" />
    <rect x="18" y="20" width="84" height="42" rx="4" fill="url(#cseS)" />
    <rect x="21" y="23" width="78" height="36" rx="2" fill="#030712" opacity="0.95" />
    <rect x="27" y="30" width="30" height="2.5" rx="1.2" fill={color} opacity="0.9" />
    <rect x="27" y="36" width="22" height="2.5" rx="1.2" fill="#a78bfa" opacity="0.8" />
    <rect x="27" y="42" width="34" height="2.5" rx="1.2" fill={color} opacity="0.7" />
    <rect x="27" y="48" width="18" height="2.5" rx="1.2" fill="#34d399" opacity="0.8" />
    <rect x="27" y="54" width="26" height="2.5" rx="1.2" fill={color} opacity="0.55" />
    <rect x="58" y="54" width="2" height="2.5" rx="0.5" fill="#fff" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0;0.9" dur="1.2s" repeatCount="indefinite" />
    </rect>
    <ellipse cx="85" cy="33" rx="9" ry="6" fill={color} fillOpacity="0.12" />
    <ellipse cx="80" cy="36" rx="5" ry="3.5" fill={color} fillOpacity="0.1" />
    <ellipse cx="90" cy="36" rx="5" ry="3" fill={color} fillOpacity="0.1" />
    <circle cx="85" cy="33" r="2" fill={color} opacity="0.7">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </circle>
    <rect x="73" y="44" width="20" height="14" rx="2" fill="#1e3a8a" opacity="0.8" stroke={color} strokeWidth="0.8" strokeOpacity="0.5" />
    <rect x="76" y="47" width="14" height="8" rx="1" fill={color} opacity="0.15" />
    <line x1="78" y1="51" x2="87" y2="51" stroke={color} strokeWidth="0.9" opacity="0.7" />
    <line x1="78" y1="54" x2="84" y2="54" stroke={color} strokeWidth="0.9" opacity="0.5" />
  </svg>
);

const IllustAIML = ({ color }) => (
  <svg viewBox="0 0 120 90" fill="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <radialGradient id="aiG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="46" rx="40" ry="30" fill="url(#aiG)" />
    <path d="M60 18 C44 16 30 25 28 38 C26 49 33 58 40 62 C46 65 53 66 59 65 L60 64" stroke={color} strokeWidth="1.8" fill="none" strokeOpacity="0.9" />
    <path d="M60 18 C76 16 90 25 92 38 C94 49 87 58 80 62 C74 65 67 66 61 65 L60 64" stroke={color} strokeWidth="1.8" fill="none" strokeOpacity="0.9" />
    <path d="M60 18 C44 16 30 25 28 38 C26 49 33 58 40 62 C47 66 53 67 60 66 C67 67 73 66 80 62 C87 58 94 49 92 38 C90 25 76 16 60 18Z" fill={color} fillOpacity="0.07" />
    <line x1="60" y1="18" x2="60" y2="65" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="3 2" />
    <path d="M37 34 C41 31 50 33 54 37" stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.55" />
    <path d="M35 44 C39 41 46 43 48 47" stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.45" />
    <path d="M83 34 C79 31 70 33 66 37" stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.55" />
    <path d="M85 44 C81 41 74 43 72 47" stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.45" />
    {[[18,28],[18,54],[102,28],[102,54],[34,74],[86,74]].map(([x,y],i) => (
      <g key={i}>
        <circle cx={x} cy={y} r="4" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1" strokeOpacity="0.5" />
        <circle cx={x} cy={y} r="1.8" fill={color} fillOpacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur={`${1.5+i*0.4}s`} repeatCount="indefinite" />
        </circle>
      </g>
    ))}
    <line x1="22" y1="28" x2="28" y2="36" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    <line x1="22" y1="54" x2="28" y2="46" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    <line x1="98" y1="28" x2="92" y2="36" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    <line x1="98" y1="54" x2="92" y2="46" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    <line x1="37" y1="72" x2="44" y2="64" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    <line x1="83" y1="72" x2="76" y2="64" stroke={color} strokeWidth="0.8" strokeOpacity="0.35" strokeDasharray="2 2" />
    {[[46,13],[74,13],[60,80]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="2.2" fill={color} fillOpacity="0.6">
        <animate attributeName="cy" values={`${y};${y-7};${y}`} dur={`${2+i}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur={`${2+i}s`} repeatCount="indefinite" />
      </circle>
    ))}
  </svg>
);

const IllustECE = ({ color }) => (
  <svg viewBox="0 0 120 90" fill="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <radialGradient id="eceG" cx="50%" cy="75%" r="60%">
        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="60" cy="62" rx="52" ry="26" fill="url(#eceG)" />
    <rect x="54" y="66" width="12" height="14" rx="2" fill="#0e4f6e" opacity="0.9" />
    <rect x="47" y="78" width="26" height="3" rx="1.5" fill={color} opacity="0.45" />
    <path d="M24 63 Q34 28 60 22 Q86 28 96 63" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.75" />
    <path d="M29 63 Q39 34 60 30 Q81 34 91 63" fill={color} fillOpacity="0.05" />
    <line x1="24" y1="63" x2="96" y2="63" stroke={color} strokeWidth="2" strokeOpacity="0.65" />
    <line x1="60" y1="63" x2="60" y2="40" stroke={color} strokeWidth="1.5" strokeOpacity="0.75" />
    <circle cx="60" cy="38" r="4" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.2" />
    <circle cx="60" cy="38" r="1.8" fill={color}>
      <animate attributeName="r" values="1.8;2.8;1.8" dur="2s" repeatCount="indefinite" />
    </circle>
    {[1,2,3].map(i => (
      <path key={i}
        d={`M${60+i*10} ${22-i*4} Q${66+i*10} ${15-i*4} ${72+i*10} ${22-i*4}`}
        stroke={color} strokeWidth={1.5-i*0.3} fill="none" strokeOpacity={0.8-i*0.22}>
        <animate attributeName="opacity" values={`${0.8-i*0.22};0.2;${0.8-i*0.22}`} dur={`${1.5+i*0.5}s`} repeatCount="indefinite" />
      </path>
    ))}
    <rect x="10" y="50" width="22" height="18" rx="2" fill="#0c3044" stroke={color} strokeWidth="0.9" strokeOpacity="0.55" />
    <rect x="13" y="53" width="16" height="12" rx="1" fill={color} fillOpacity="0.12" />
    {[0,1,2].map(i => (
      <g key={i}>
        <line x1={15+i*5} y1="50" x2={15+i*5} y2="47" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
        <line x1={15+i*5} y1="68" x2={15+i*5} y2="71" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
      </g>
    ))}
    <line x1="10" y1="56" x2="7" y2="56" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
    <line x1="10" y1="62" x2="7" y2="62" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
    <line x1="32" y1="56" x2="35" y2="56" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
    <line x1="32" y1="62" x2="35" y2="62" stroke={color} strokeWidth="1.1" strokeOpacity="0.55" />
  </svg>
);

const IllustME = ({ color }) => (
  <svg viewBox="0 0 120 90" fill="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <radialGradient id="meG" cx="38%" cy="55%" r="55%">
        <stop offset="0%" stopColor={color} stopOpacity="0.18" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="44" cy="52" rx="38" ry="28" fill="url(#meG)" />
    <circle cx="44" cy="50" r="22" fill="#130e01" stroke={color} strokeWidth="1.5" strokeOpacity="0.65" />
    <circle cx="44" cy="50" r="15" fill="#0a0800" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
    <circle cx="44" cy="50" r="6" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.2" />
    <circle cx="44" cy="50" r="2.5" fill={color} opacity="0.95" />
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      return <circle key={i} cx={44 + 22 * Math.cos(rad)} cy={50 + 22 * Math.sin(rad)} r="3.2" fill={color} fillOpacity="0.7" />;
    })}
    <circle cx="44" cy="50" r="20" stroke={color} strokeWidth="0.5" strokeOpacity="0.18" strokeDasharray="4 6">
      <animateTransform attributeName="transform" type="rotate" from="0 44 50" to="360 44 50" dur="8s" repeatCount="indefinite" />
    </circle>
    <circle cx="80" cy="34" r="13" fill="#130e01" stroke={color} strokeWidth="1.2" strokeOpacity="0.55" />
    <circle cx="80" cy="34" r="8" fill="#0a0800" />
    <circle cx="80" cy="34" r="3" fill={color} fillOpacity="0.9" />
    {[0,45,90,135,180,225,270,315].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      return <circle key={i} cx={80 + 13 * Math.cos(rad)} cy={34 + 13 * Math.sin(rad)} r="2.2" fill={color} fillOpacity="0.6" />;
    })}
    <circle cx="80" cy="34" r="11" stroke={color} strokeWidth="0.5" strokeOpacity="0.18" strokeDasharray="3 5">
      <animateTransform attributeName="transform" type="rotate" from="360 80 34" to="0 80 34" dur="4s" repeatCount="indefinite" />
    </circle>
    <rect x="84" y="46" width="30" height="6" rx="3" fill="#1c1003" stroke={color} strokeWidth="1" strokeOpacity="0.65" transform="rotate(-20 84 49)" />
    <rect x="98" y="55" width="19" height="5" rx="2.5" fill="#1c1003" stroke={color} strokeWidth="1" strokeOpacity="0.55" transform="rotate(10 98 57)" />
    <path d="M113 60 L118 55 L118 65" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const IllustCE = ({ color }) => (
  <svg viewBox="0 0 120 90" fill="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="ceG" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.12" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="120" height="90" fill="url(#ceG)" rx="4" />
    <line x1="6" y1="78" x2="114" y2="78" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
    <rect x="10" y="26" width="20" height="52" rx="1.5" fill="#052e1e" stroke={color} strokeWidth="0.8" strokeOpacity="0.65" />
    {[30,37,44,51,58,65,72].map(y => (
      <g key={y}>
        <rect x="12" y={y} width="5" height="4" rx="0.5" fill={color} fillOpacity="0.55" />
        <rect x="19" y={y} width="5" height="4" rx="0.5" fill={color} fillOpacity="0.35" />
      </g>
    ))}
    <rect x="35" y="38" width="22" height="40" rx="1.5" fill="#042618" stroke={color} strokeWidth="0.8" strokeOpacity="0.55" />
    {[42,49,56,63,70].map(y => (
      <g key={y}>
        <rect x="37" y={y} width="5" height="4" rx="0.5" fill={color} fillOpacity="0.45" />
        <rect x="45" y={y} width="5" height="4" rx="0.5" fill={color} fillOpacity="0.28" />
      </g>
    ))}
    <rect x="62" y="52" width="15" height="26" rx="1.5" fill="#052e1e" stroke={color} strokeWidth="0.7" strokeOpacity="0.5" />
    {[56,62,68].map(y => (
      <rect key={y} x="64" y={y} width="5" height="4" rx="0.5" fill={color} fillOpacity="0.4" />
    ))}
    <line x1="82" y1="70" x2="116" y2="70" stroke={color} strokeWidth="2" strokeOpacity="0.75" />
    <line x1="82" y1="70" x2="82" y2="60" stroke={color} strokeWidth="1.5" strokeOpacity="0.65" />
    <line x1="116" y1="70" x2="116" y2="60" stroke={color} strokeWidth="1.5" strokeOpacity="0.65" />
    <path d="M82 60 Q99 52 116 60" stroke={color} strokeWidth="1.2" fill="none" strokeOpacity="0.65" />
    {[88,99,110].map(x => (
      <line key={x} x1={x} y1={x===99?55:58} x2={x} y2="70" stroke={color} strokeWidth="0.9" strokeOpacity="0.45" />
    ))}
    <line x1="92" y1="78" x2="92" y2="26" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
    <line x1="92" y1="26" x2="114" y2="26" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
    <line x1="110" y1="26" x2="110" y2="40" stroke={color} strokeWidth="1" strokeOpacity="0.45" strokeDasharray="2 2">
      <animate attributeName="y2" values="40;46;40" dur="3s" repeatCount="indefinite" />
    </line>
    <rect x="106" y="40" width="8" height="5" rx="1" fill={color} fillOpacity="0.45">
      <animate attributeName="y" values="40;46;40" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);

/* ─── Single Department Card ────────────────────────────────── */
function DeptCard({ dept, index, Illustration }) {
  const [hovered, setHovered] = React.useState(false);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const [visible, setVisible] = React.useState(false);
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const onMouseMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const hex = dept.color.replace('#', '');
  const cr = parseInt(hex.slice(0, 2), 16);
  const cg = parseInt(hex.slice(2, 4), 16);
  const cb = parseInt(hex.slice(4, 6), 16);
  const rgba = (a) => `rgba(${cr},${cg},${cb},${a})`;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); }}
      onMouseMove={onMouseMove}
      style={{
        position: 'relative',
        borderRadius: '20px',
        background: hovered
          ? `linear-gradient(145deg, ${rgba(0.1)} 0%, rgba(6,11,24,0.88) 100%)`
          : 'rgba(15,23,42,0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${hovered ? rgba(0.45) : 'rgba(255,255,255,0.07)'}`,
        boxShadow: hovered
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 40px ${rgba(0.2)}, inset 0 1px 0 rgba(255,255,255,0.09)`
          : '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: visible
          ? `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${hovered ? -8 : 0}px) scale(${hovered ? 1.01 : 1})`
          : 'perspective(1000px) translateY(28px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.09}s, transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s, background 0.3s`,
        overflow: 'hidden',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        willChange: 'transform, opacity',
      }}
    >
      {/* Top shimmer on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: `linear-gradient(180deg, ${rgba(hovered ? 0.07 : 0)} 0%, transparent 100%)`,
        pointerEvents: 'none', zIndex: 0, borderRadius: '20px 20px 0 0',
        transition: 'background 0.3s ease',
      }} />

      {/* ── Illustration panel ── */}
      <div style={{
        position: 'relative', height: '148px', overflow: 'hidden',
        borderRadius: '20px 20px 0 0',
        background: `linear-gradient(160deg, ${rgba(0.1)} 0%, rgba(6,11,24,0.7) 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 14px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 65%, ${rgba(hovered ? 0.2 : 0.09)} 0%, transparent 70%)`,
          transition: 'background 0.4s ease',
        }} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%',
          animation: `deptIllFloat ${6.5 + index * 0.8}s ease-in-out infinite`,
          animationDelay: `${index * 0.4}s`,
          filter: hovered ? `drop-shadow(0 6px 20px ${rgba(0.45)})` : `drop-shadow(0 2px 8px ${rgba(0.2)})`,
          transition: 'filter 0.35s ease',
          willChange: 'transform',
        }}>
          <Illustration color={dept.color} />
        </div>
        {/* Bottom fade into card body */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '32px',
          background: 'linear-gradient(to top, rgba(6,11,24,0.7) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: '18px 22px 22px', position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Badge + dot row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px',
            padding: '3px 11px', borderRadius: '999px',
            background: rgba(0.14),
            color: dept.color,
            border: `1px solid ${rgba(hovered ? 0.5 : 0.28)}`,
            boxShadow: hovered ? `0 0 12px ${rgba(0.3)}` : 'none',
            transition: 'all 0.3s ease',
          }}>
            {dept.code}
          </span>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: dept.color,
            boxShadow: `0 0 ${hovered ? 14 : 7}px ${dept.color}`,
            transition: 'box-shadow 0.3s ease',
          }} />
        </div>

        {/* Name */}
        <h3 style={{
          fontSize: '16px', fontWeight: 800,
          fontFamily: 'var(--font-secondary)',
          color: '#ffffff',
          lineHeight: 1.3, marginBottom: '8px',
        }}>
          {dept.name}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '12.5px', color: 'rgba(148,163,184,0.85)',
          lineHeight: 1.65, marginBottom: '16px', flex: 1,
        }}>
          {dept.desc}
        </p>

        {/* Footer */}
        <div style={{
          paddingTop: '14px',
          borderTop: `1px solid ${rgba(hovered ? 0.22 : 0.08)}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'border-color 0.3s ease',
        }}>
          <div style={{ fontSize: '11px', color: 'rgba(100,116,139,0.9)' }}>
            HOD: <strong style={{ color: 'rgba(148,163,184,0.9)', fontWeight: 600 }}>{dept.HOD}</strong>
          </div>
          <Link
            to="/apply"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 700,
              color: dept.color,
              padding: '5px 13px', borderRadius: '999px',
              background: rgba(hovered ? 0.18 : 0.09),
              border: `1px solid ${rgba(hovered ? 0.45 : 0.22)}`,
              transition: 'all 0.3s ease',
              textDecoration: 'none',
            }}
          >
            Apply
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Departments Section Component ────────────────────────── */
function DepartmentsSection({ departments }) {
  const illustMap = { CSE: IllustCSE, AIML: IllustAIML, ECE: IllustECE, ME: IllustME, CE: IllustCE };
  return (
    <section style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes deptIllFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          40%      { transform: translateY(-9px) rotate(0.8deg); }
          70%      { transform: translateY(-4px) rotate(-0.6deg); }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.03) 40%, rgba(124,58,237,0.025) 60%, transparent 100%)',
      }} />
      <div className="container">
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <p style={{
            color: 'var(--color-sky)', fontSize: '11px', fontWeight: 700,
            letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '14px',
            display: 'inline-flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ display: 'inline-block', width: 28, height: 1.5, background: 'var(--color-sky)', borderRadius: 2 }} />
            Academic Programs
            <span style={{ display: 'inline-block', width: 28, height: 1.5, background: 'var(--color-sky)', borderRadius: 2 }} />
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: 1.1, marginBottom: '14px' }}>
            Five Engineering <span className="gradient-text-blue-purple">Disciplines</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '15px', lineHeight: 1.7 }}>
            World-class research centers, advanced laboratories, and expert faculty across every branch.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {departments.map((dept, idx) => (
            <DeptCard
              key={dept.code}
              dept={dept}
              index={idx}
              Illustration={illustMap[dept.code] || IllustCSE}
            />
          ))}
        </div>

        {/* View all link */}
        <div style={{ textAlign: 'center', marginTop: '52px' }}>
          <Link
            to="/departments"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 32px', borderRadius: '999px',
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.24)',
              color: 'var(--color-sky)', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.3s ease',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            View All Departments
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Home Page ─────────────────────────────────────────── */
export default function Home() {

  const stats = [
    { label: 'NIRF Ranking',    value: '38',    suffix: '',    prefix: '#',  desc: 'Ranked nationally by NIRF',       icon: Award,       color: 'var(--color-gold)',    glow: 'rgba(245, 158, 11, 0.25)' },
    { label: 'Placement Rate',  value: '98.2',  suffix: '%',   prefix: '',   desc: 'Industry-leading placements',     icon: TrendingUp,  color: 'var(--color-sky)',     glow: 'rgba(56, 189, 248, 0.25)' },
    { label: 'Accreditation',   value: 'A++',   suffix: '',    prefix: '',   desc: 'Highest NAAC grade awarded',      icon: ShieldCheck, color: 'var(--color-emerald)', glow: 'rgba(16, 185, 129, 0.25)' },
    { label: 'Active Students', value: '4500',  suffix: '+',   prefix: '',   desc: 'Across 5 specialized programs',   icon: Users,       color: 'var(--color-purple-light)', glow: 'rgba(139, 92, 246, 0.25)' },
  ];

  const roadmap = [
    { step: '01', title: 'Submit Application',   desc: 'Fill personal details, academic scores, select your engineering branch.' },
    { step: '02', title: 'Upload Documents',      desc: 'Upload 10th, 12th marksheets, and valid government ID proof.' },
    { step: '03', title: 'Registrar Evaluation',  desc: 'Admission committee reviews credentials and validates uploaded documents.' },
    { step: '04', title: 'Student ID Assigned',   desc: 'Approved students are auto-enrolled with a unique TMEC Student ID.' },
  ];

  const departments = [
    { name: 'Computer Science Engineering',           code: 'CSE',  HOD: 'Dr. Alan Turing',    desc: 'Software systems, hardware design, and cutting-edge computational theory.',     icon: Cpu,         color: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
    { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', HOD: 'Dr. Ada Lovelace',  desc: 'Neural networks, deep learning, big data pipelines, and expert systems.',        icon: BrainCircuit, color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)' },
    { name: 'Electronics & Communication Engineering', code: 'ECE',  HOD: 'Dr. Nikola Tesla',   desc: 'Signal processing, VLSI design, communication networks, microelectronics.',      icon: Radio,       color: '#38bdf8', glow: 'rgba(56,189,248,0.2)' },
    { name: 'Mechanical Engineering',                 code: 'ME',   HOD: 'Dr. James Watt',     desc: 'Thermodynamics, fluid mechanics, industrial robotics, and advanced systems.',     icon: Wrench,      color: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
    { name: 'Civil Engineering',                      code: 'CE',   HOD: 'Dr. Thomas Telford', desc: 'Structural design, geotechnical modeling, and sustainable construction.',          icon: Building2,   color: '#10b981', glow: 'rgba(16,185,129,0.2)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Background Image with overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'url(/hero_campus.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Multi-layer dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(3,7,18,0.92) 0%, rgba(15,23,42,0.85) 50%, rgba(3,7,18,0.95) 100%)',
        }} />

        {/* Animated background orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '5%', width: '400px', height: '400px', zIndex: 1,
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          borderRadius: '50%', animation: 'orbMove 12s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%', width: '500px', height: '500px', zIndex: 1,
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          borderRadius: '50%', animation: 'orbMove 16s ease-in-out infinite reverse',
        }} />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <Particle key={i} style={{ left: `${8 + i * 8}%`, bottom: `${10 + (i % 4) * 15}%`, zIndex: 2 }} />
        ))}

        {/* Hero content */}
        <div className="container" style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '80px 24px' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 18px', borderRadius: 'var(--radius-full)',
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            color: 'var(--color-sky)',
            fontSize: '12px', fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase', marginBottom: '32px',
            backdropFilter: 'blur(8px)',
            animation: 'fadeInUp 0.6s ease both',
          }}>
            <GraduationCap size={14} />
            Academic Session 2026–27 Admissions Open
          </div>

          {/* Main heading */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 900, letterSpacing: '-2px', lineHeight: 1.05,
            fontFamily: 'var(--font-display)', marginBottom: '24px',
            animation: 'fadeInUp 0.7s ease both 0.1s', animationFillMode: 'both',
          }}>
            <span style={{ color: '#ffffff' }}>Shape Tomorrow's</span><br />
            <span className="gradient-text-blue-purple">Engineers</span>
            <span style={{ color: '#ffffff' }}> at TMEC</span>
          </h1>

          {/* Sub-heading */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 20px)', color: 'rgba(148,163,184,0.9)',
            lineHeight: 1.65, maxWidth: '680px', margin: '0 auto 48px auto',
            animation: 'fadeInUp 0.8s ease both 0.2s', animationFillMode: 'both',
          }}>
            Apply to Thought Minds Engineering College via our smart, fully digital admission portal.
            Upload documents, track status live, and receive your student ID automatically upon approval.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeInUp 0.9s ease both 0.3s', animationFillMode: 'both',
          }}>
            <Link
              to="/apply"
              className="btn-ripple btn-primary animate-pulse-glow"
              style={{ padding: '16px 36px', fontSize: '16px', letterSpacing: '0.3px' }}
            >
              Apply for Admission <ArrowRight size={18} />
            </Link>
            <Link
              to="/track"
              className="btn-ripple btn-secondary"
              style={{ padding: '16px 36px', fontSize: '16px' }}
            >
              Track Application Status
            </Link>
          </div>

          {/* Quick stat pills */}
          <div style={{
            display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '56px',
            animation: 'fadeInUp 1s ease both 0.4s', animationFillMode: 'both',
          }}>
            {['#38 NIRF Rank', '98.2% Placements', 'A++ NAAC', '5 Branches'].map((pill) => (
              <div key={pill} style={{
                padding: '8px 18px', borderRadius: 'var(--radius-full)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.75)',
                fontSize: '13px', fontWeight: 600, backdropFilter: 'blur(8px)',
              }}>
                {pill}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade gradient */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', zIndex: 4,
          background: 'linear-gradient(to top, var(--bg-primary) 0%, transparent 100%)',
        }} />
      </section>

      {/* ── STATS SECTION ────────────────────────────────────── */}
      <section className="container" style={{ padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ color: 'var(--color-sky)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
            By The Numbers
          </p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Why Students Choose <span className="gradient-text-blue-purple">TMEC</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <TiltCard
                key={idx}
                style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}
              >
                {/* Background glow blob */}
                <div style={{
                  position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px',
                  borderRadius: '50%', background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`,
                  pointerEvents: 'none', zIndex: 0,
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `rgba(${stat.glow.replace('rgba(', '').replace(')', '')})`,
                    border: `1px solid ${stat.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px', color: stat.color,
                    boxShadow: `0 0 20px ${stat.glow}`,
                    animation: 'float 4s ease-in-out infinite',
                    animationDelay: `${idx * 0.5}s`,
                  }}>
                    <Icon size={22} />
                  </div>

                  <div style={{
                    fontSize: '42px', fontWeight: 900, fontFamily: 'var(--font-display)',
                    lineHeight: 1, marginBottom: '6px', color: stat.color,
                    textShadow: `0 0 30px ${stat.glow}`,
                  }}>
                    {stat.prefix}
                    {stat.value === 'A++' ? 'A++' : <AnimatedCounter target={stat.value + stat.suffix} />}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.desc}</div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </section>

      {/* ── ADMISSIONS ROADMAP ───────────────────────────────── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.04) 50%, transparent 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid pattern background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '64px', alignItems: 'center' }}>

            {/* Left: Intro + image */}
            <div>
              <p style={{ color: 'var(--color-sky)', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Admissions Roadmap
              </p>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, fontFamily: 'var(--font-secondary)', lineHeight: 1.2, marginBottom: '16px' }}>
                Four Steps to <span className="gradient-text-blue-purple">Secure Your Seat</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
                Our fully digital admissions system eliminates queues. The entire process — from application to student ID — happens online, with real-time status updates.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
                {['Encrypted & secure document processing', 'Automated TMEC Student ID generation', 'Real-time application status tracking', '24-hour registrar response SLA'].map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px' }}>
                    <CheckCircle2 size={18} color="var(--color-emerald)" style={{ flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* Tech lab image */}
              <div style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                border: '1px solid var(--border-glass)',
                boxShadow: 'var(--glow-royal)',
                animation: 'float 7s ease-in-out infinite',
              }}>
                <img
                  src="/tech_lab.png"
                  alt="TMEC Engineering Laboratory"
                  style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="timeline">
              {roadmap.map((item, idx) => (
                <div key={idx} className="timeline-item" style={{ animationDelay: `${idx * 0.15}s` }}>
                  <div className="timeline-dot active" />
                  <TiltCard style={{ padding: '24px', marginLeft: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{item.title}</h3>
                      <span style={{
                        fontSize: '28px', fontWeight: 900, color: 'rgba(59,130,246,0.15)',
                        fontFamily: 'var(--font-display)', lineHeight: 1,
                      }}>
                        {item.step}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                  </TiltCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPARTMENTS ──────────────────────────────────────── */}
      <DepartmentsSection departments={departments} />

      {/* ── GRADUATION SHOWCASE ──────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', margin: '0 0 80px 0' }}>
        <div style={{
          position: 'relative', height: '420px',
          backgroundImage: 'url(/graduation.png)',
          backgroundSize: 'cover', backgroundPosition: 'center top',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(3,7,18,0.85) 0%, rgba(15,23,42,0.6) 50%, rgba(3,7,18,0.9) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '24px', textAlign: 'center', padding: '24px',
          }}>
            <p style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
              Class of 2026
            </p>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 900, letterSpacing: '-1.5px',
              fontFamily: 'var(--font-display)', color: '#ffffff', lineHeight: 1.1,
            }}>
              Your Future Starts <span className="gradient-text-blue-purple">Today</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '580px', fontSize: '16px', lineHeight: 1.6 }}>
              Join 4,500+ students already building their careers in engineering, AI, and innovation at TMEC.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/apply" className="btn-ripple btn-primary" style={{ padding: '14px 36px', fontSize: '15px' }}>
                Apply Now <ArrowRight size={16} />
              </Link>
              <Link to="/departments" className="btn-ripple btn-secondary" style={{ padding: '14px 36px', fontSize: '15px' }}>
                Explore Departments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO APPLY QUICK GUIDE ─────────────────────────── */}
      <section className="container" style={{ paddingBottom: '100px' }}>
        <div className="glass-panel" style={{
          padding: '60px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)',
          border: '1px solid rgba(59,130,246,0.15)',
          textAlign: 'center',
          animation: 'pulse-glow 5s ease infinite',
        }}>
          <BookOpen size={48} style={{ color: 'var(--color-royal-light)', margin: '0 auto 24px', display: 'block' }} />
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, fontFamily: 'var(--font-secondary)', marginBottom: '14px' }}>
            Ready to Begin Your <span className="gradient-text-blue-purple">Engineering Journey?</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto 36px auto', fontSize: '15px', lineHeight: 1.65 }}>
            The entire admissions process takes less than 10 minutes. Submit your scores, upload credentials, and we'll handle the rest.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/apply" className="btn-ripple btn-primary" style={{ padding: '14px 40px', fontSize: '15px' }}>
              Start Application <ArrowRight size={16} />
            </Link>
            <Link to="/contact" className="btn-ripple btn-secondary" style={{ padding: '14px 40px', fontSize: '15px' }}>
              Contact Admissions Desk
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
