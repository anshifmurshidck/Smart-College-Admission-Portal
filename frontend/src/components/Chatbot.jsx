import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { 
  MessageCircle, X, Send, Bot, Loader2, 
  CheckCircle2, XCircle, AlertCircle, Calendar, 
  ArrowRight, Sparkles 
} from 'lucide-react';

/* ─── Simple Helper Component for Formatting Messages ─────────────────── */
const FormattedText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {lines.map((line, idx) => {
        let content = line;
        
        // Handle bullet list items
        const isListItem = line.startsWith('* ') || line.startsWith('- ');
        if (isListItem) {
          content = line.substring(2);
        }

        const parts = [];
        let index = 0;
        const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/g;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const matchIndex = match.index;
          const matchStr = match[0];
          
          if (matchIndex > index) {
            parts.push(content.substring(index, matchIndex));
          }
          
          if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
            parts.push(<strong key={matchIndex} style={{ color: '#fff', fontWeight: 700 }}>{matchStr.slice(2, -2)}</strong>);
          } else if (matchStr.startsWith('[') && matchStr.includes('](')) {
            const endTextIndex = matchStr.indexOf('](');
            const linkText = matchStr.slice(1, endTextIndex);
            const linkUrl = matchStr.slice(endTextIndex + 2, -1);
            
            if (linkUrl.startsWith('/')) {
              parts.push(
                <Link 
                  key={matchIndex} 
                  to={linkUrl} 
                  style={{ color: 'var(--color-sky)', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {linkText}
                </Link>
              );
            } else {
              parts.push(
                <a 
                  key={matchIndex} 
                  href={linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-sky)', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {linkText}
                </a>
              );
            }
          }
          
          index = regex.lastIndex;
        }
        
        if (index < content.length) {
          parts.push(content.substring(index));
        }

        const renderedLine = parts.length > 0 ? parts : content;

        if (isListItem) {
          return (
            <div key={idx} style={{ display: 'flex', gap: '6px', marginLeft: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--color-sky)', fontSize: '12px', marginTop: '3px' }}>•</span>
              <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.9)' }}>{renderedLine}</span>
            </div>
          );
        }

        return (
          <p key={idx} style={{ margin: '3px 0', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255, 255, 255, 0.9)' }}>
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! Welcome to Thought Minds Engineering College (TMEC) Admission Portal. I am your AI assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWaitingForAppId, setIsWaitingForAppId] = useState(false);
  const [hoveredChip, setHoveredChip] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  // Local keyword responder used as a fallback when the AI backend is unreachable.
  const localKeywordReply = (lowerText) => {
    if (['apply', 'admission', 'register', 'process', 'enroll'].some(k => lowerText.includes(k))) {
      return "TMEC Admissions are fully digital. You can submit your form in under 10 minutes at the [Apply Now Page](/apply).\n\nSteps:\n1. Fill details\n2. Upload Marksheets & ID proof\n3. Wait for our committee review (usually 24 hours)\n4. Receive your unique TMEC Student ID upon approval!";
    }
    if (['branch', 'department', 'course', 'cse', 'aiml', 'ece', 'mech', 'civil'].some(k => lowerText.includes(k))) {
      return "TMEC offers 5 specialized B.Tech programs:\n\n* **Computer Science (CSE)**\n* **Artificial Intelligence (AIML)**\n* **Electronics (ECE)**\n* **Mechanical (ME)**\n* **Civil Engineering (CE)**\n\nLearn more details about curriculum, HODs, and labs on our [Academic Departments Page](/departments).";
    }
    if (['fee', 'cost', 'price', 'scholarship', 'criteria', 'eligibility'].some(k => lowerText.includes(k))) {
      return "**Admissions Eligibility:**\n* B.Tech Programs: Minimum 60% aggregate in 12th (Physics, Chemistry, Maths).\n\n**Fee Structure (per semester):**\n* CSE / AIML: ₹95,000\n* ECE / ME / CE: ₹80,000\n\n*Scholarships: Students with >90% in 12th Boards get 25% tuition fee waiver!*";
    }
    if (['track', 'status', 'check'].some(k => lowerText.includes(k))) {
      return "To track your application, please provide your **Application ID** (in the format `APP-2026-XXXX`). Enter it below and I'll fetch it instantly!";
    }
    if (['contact', 'phone', 'email', 'call', 'address', 'location'].some(k => lowerText.includes(k))) {
      return "Reach the TMEC Admissions office at:\n* 📞 Phone: +91 98765 43210\n* ✉️ Email: admissions@tmec.edu.in\n* 📍 Campus: Thought Minds Engineering College, Bengaluru.\n\nYou can also leave an inquiry message on our [Contact Page](/contact).";
    }
    if (['hi', 'hello', 'hey', 'greetings'].some(k => lowerText.includes(k))) {
      return "Hello! I am here to help you navigate TMEC Admissions. Ask me about our courses, eligibility criteria, semesters fees, or tracking status.";
    }
    return "I apologize, I did not fully understand that query. I can help you with:\n\n* **Applying for Admissions**\n* **Tuition Fees & Eligibility**\n* **Engineering Branches & HOD details**\n* **Tracking Application Status (provide ID: APP-YYYY-XXXX)**\n* **Admissions Contact details**\n\nAlternatively, you can navigate using the quick reply buttons below.";
  };

  // Auto scroll to bottom when messages or open state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const quickReplies = [
    { label: '🗓️ Admission Process', topic: 'process' },
    { label: '🎓 Engineering Branches', topic: 'branches' },
    { label: '💵 Eligibility & Fees', topic: 'fees' },
    { label: '🔍 Track Application', topic: 'track' },
    { label: '📞 Contact Support', topic: 'contact' }
  ];

  const handleQuickReply = (label, topic) => {
    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: label,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    // Process response
    setLoading(true);
    setTimeout(async () => {
      let botResponseText = '';
      
      switch (topic) {
        case 'process':
          botResponseText = "TMEC Admissions follow a simple 4-step digital process:\n\n1. **Apply Online**: Fill in your personal & academic details in the [Admission Form](/apply).\n2. **Upload Documents**: Submit your 10th & 12th marksheets along with a Government ID proof.\n3. **Evaluation**: The admissions committee reviews credentials and validates documents (usually within 24 hours).\n4. **Student ID**: Approved students are auto-enrolled with a unique TMEC Student ID!\n\nWould you like to [Apply Now](/apply) or [Track your application](/track)?";
          setIsWaitingForAppId(false);
          break;
        case 'branches':
          botResponseText = "TMEC offers five premium B.Tech engineering disciplines, each featuring advanced lab infrastructure and expert faculty:\n\n* **Computer Science Engineering (CSE)** - Directed by Dr. Alan Turing. Focuses on software systems and computational theory.\n* **Artificial Intelligence & Machine Learning (AIML)** - Directed by Dr. Ada Lovelace. Focuses on deep learning, neural networks, and data sciences.\n* **Electronics & Communication (ECE)** - Directed by Dr. Nikola Tesla. Covers signal processing, VLSI design, and telecommunication.\n* **Mechanical Engineering (ME)** - Directed by Dr. James Watt. Focuses on robotics, thermodynamics, and manufacturing systems.\n* **Civil Engineering (CE)** - Directed by Dr. Thomas Telford. Covers structural analysis and sustainable construction designs.\n\nWhich program matches your interest? You can check details in our [Departments](/departments) page.";
          setIsWaitingForAppId(false);
          break;
        case 'fees':
          botResponseText = "**Admission Eligibility:**\n* B.Tech Programs: Minimum 60% aggregate in 12th standard (with Physics, Chemistry, Mathematics).\n\n**Fee Structure (per semester):**\n* **CSE / AIML**: ₹95,000\n* **ECE / ME / CE**: ₹80,000\n\n*Scholarships: Merit-based scholarship programs are available. Students securing >90% in their 12th boards qualify for a 25% tuition fee waiver.*";
          setIsWaitingForAppId(false);
          break;
        case 'track':
          botResponseText = "Please enter your **Application ID** (in the format `APP-2026-XXXX`, for example, `APP-2026-0042`) in the input box below, and I will query our database for your real-time status.";
          setIsWaitingForAppId(true);
          break;
        case 'contact':
          botResponseText = "You can reach the TMEC Admissions Desk through these details:\n\n* 📞 Phone: **+91 98765 43210** / 080-23456789\n* ✉️ Email: **admissions@tmec.edu.in**\n* 📍 Campus: Thought Minds Engineering College, Tech Park Road, Bengaluru, Karnataka - 560001\n\nHours: Mon-Sat, 9:00 AM - 5:00 PM.";
          setIsWaitingForAppId(false);
          break;
        default:
          botResponseText = "How else can I help you today?";
          setIsWaitingForAppId(false);
      }
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    setTimeout(async () => {
      let botResponseText = '';
      const lowerText = userText.toLowerCase();

      // Check if user is typing an Application ID format
      const appIdRegex = /APP-\d{4}-\d{4}/i;
      const matchedAppId = userText.match(appIdRegex);

      if (matchedAppId || (isWaitingForAppId && userText.toUpperCase().startsWith('APP-'))) {
        const idToQuery = (matchedAppId ? matchedAppId[0] : userText).toUpperCase();
        try {
          const { data: appData, error: appError } = await supabase
            .from('applications')
            .select(`
              full_name,
              status,
              assigned_student_id,
              created_at,
              department:departments(name, code)
            `)
            .eq('id', idToQuery)
            .single();

          if (appError || !appData) {
            botResponseText = `❌ I could not find any application with ID **${idToQuery}**. Please check the ID format and try again.\n\nIf you need help, you can [Contact Support](/contact) or check the manual [Track Status Page](/track).`;
          } else {
            let statusEmoji = '⌛';
            let statusInstruction = '';
            
            if (appData.status === 'Approved') {
              statusEmoji = '🎉';
              statusInstruction = `Your TMEC Student ID is **${appData.assigned_student_id}**. Welcome aboard! Our team has sent the onboarding kit to your registered email.`;
            } else if (appData.status === 'Rejected') {
              statusEmoji = '❌';
              statusInstruction = 'Unfortunately, your application was not approved. Please contact our admissions desk for further clarification or appeal options.';
            } else if (appData.status === 'Under Verification') {
              statusEmoji = '⚙️';
              statusInstruction = 'Your documents are currently undergoing physical verification. We will update you shortly.';
            } else {
              statusEmoji = '⌛';
              statusInstruction = 'Your application has been received and is waiting in line for document evaluation.';
            }

            botResponseText = `🔍 **Application Status Found!**\n\n* **Applicant Name:** ${appData.full_name}\n* **Branch Selected:** ${appData.department.name} (${appData.department.code})\n* **Current Status:** ${statusEmoji} **${appData.status}**\n\n${statusInstruction}`;
          }
        } catch (err) {
          console.error(err);
          botResponseText = `❌ Error querying database for ID **${idToQuery}**. Please verify your network connection and try again.`;
        }
        setIsWaitingForAppId(false);
      } else {
        // If the user asks to track, prime the input to accept an Application ID next.
        if (['track', 'status', 'check'].some(k => lowerText.includes(k))) {
          setIsWaitingForAppId(true);
        }
        // Ask the backend AI assistant (real Gemini when configured), with a
        // local keyword responder as fallback if the backend is unreachable.
        try {
          const history = messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }));
          const resp = await axios.post(`${API_BASE}/chatbot/chat`, { message: userText, history });
          botResponseText = (resp.data && resp.data.reply) ? resp.data.reply : localKeywordReply(lowerText);
        } catch (err) {
          console.warn('Public chatbot backend unreachable, using local fallback:', err);
          botResponseText = localKeywordReply(lowerText);
        }
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  return (
    <>
      {/* ── Chatbot Floating Action Button (FAB) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
          color: '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1000,
          boxShadow: isOpen 
            ? '0 8px 32px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
            : '0 8px 32px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
          transform: `scale(${isOpen ? 0.95 : 1})`,
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = `scale(${isOpen ? 0.95 : 1})`; }}
        title="Open Support Chat"
        aria-label="Toggle Support Chat"
        id="chatbot-fab"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
      </button>

      {/* ── Chatbot Drawer Window ── */}
      {isOpen && (
        <>
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 1000,
            animation: 'chatBackdropIn 0.25s ease both',
          }}
        />
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '440px',
            maxWidth: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            animation: 'slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
            overflow: 'hidden',
          }}
          id="chatbot-window"
        >
          {/* Custom style overrides for animations inside component scope */}
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            @keyframes chatBackdropIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes pulseGreen {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
              70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            .chat-msg-container::-webkit-scrollbar {
              width: 5px;
            }
            .chat-msg-container::-webkit-scrollbar-track {
              background: transparent;
            }
            .chat-msg-container::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              border-radius: 99px;
            }
            .chat-msg-container::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.2);
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '18px 20px',
              background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: 'rgba(255,255,255,0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  TMEC Assistant
                  <Sparkles size={11} color="var(--color-gold-light)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>
                  <div 
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: 'var(--color-emerald)',
                      animation: 'pulseGreen 1.8s infinite'
                    }} 
                  />
                  AI Online • Admissions Desk
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              aria-label="Close Chat"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages List Area */}
          <div
            ref={messagesContainerRef}
            className="chat-msg-container"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'rgba(11, 15, 25, 0.3)',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '80%' : '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, var(--color-royal-light) 0%, var(--color-royal) 100%)'
                        : 'rgba(30, 41, 59, 0.65)',
                      border: isUser ? 'none' : '1px solid rgba(255,255,255,0.06)',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      padding: '10px 14px',
                      boxShadow: isUser ? '0 4px 12px rgba(37,99,235,0.15)' : '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {isUser ? (
                      <span style={{ fontSize: '13px', lineHeight: 1.5, color: '#ffffff', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {msg.text}
                      </span>
                    ) : (
                      <FormattedText text={msg.text} />
                    )}
                  </div>
                  
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      color: 'var(--text-muted)', 
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      margin: '0 4px'
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Spinner indicator when loading */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.4)', padding: '10px 16px', borderRadius: '16px 16px 16px 2px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-sky)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Chips */}
          <div
            style={{
              padding: '10px 16px 8px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              background: 'rgba(11, 15, 25, 0.4)',
              borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            {quickReplies.map((qr) => (
              <button
                key={qr.topic}
                onClick={() => handleQuickReply(qr.label, qr.topic)}
                onMouseEnter={() => setHoveredChip(qr.topic)}
                onMouseLeave={() => setHoveredChip(null)}
                style={{
                  background: hoveredChip === qr.topic ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.08)',
                  border: hoveredChip === qr.topic ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid rgba(59, 130, 246, 0.22)',
                  borderRadius: '999px',
                  padding: '5px 11px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--color-sky)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 16px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask anything or enter Application ID..."
              style={{
                flex: 1,
                background: 'rgba(3, 7, 18, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '999px',
                padding: '9px 16px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-royal-light)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
            />
            
            <button
              type="submit"
              disabled={!inputVal.trim()}
              style={{
                background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
                color: '#ffffff',
                border: 'none',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputVal.trim() ? 'pointer' : 'default',
                opacity: inputVal.trim() ? 1 : 0.5,
                transition: 'transform 0.2s, opacity 0.2s',
              }}
              onMouseOver={e => { if (inputVal.trim()) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              aria-label="Send Message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
        </>
      )}
    </>
  );
}
