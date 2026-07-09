import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, MessageSquare, X, CornerDownLeft, Loader2, User, MessageCircle } from 'lucide-react';

export default function AdminChatbot() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your AI Student Database Assistant. Ask me anything about student records, department averages, state distributions, or individual profiles.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGeminiActive, setIsGeminiActive] = useState(true);
  const messagesEndRef = useRef(null);

  const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || '/api');
  const token = () => localStorage.getItem('adminToken');
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  // Auto-scroll chat history
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for global toggle events
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-admin-chatbot', handleToggle);
    return () => window.removeEventListener('toggle-admin-chatbot', handleToggle);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    const userMsgId = `msg-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        timestamp: new Date()
      }
    ];
    setMessages(newMessages);

    try {
      const chatHistory = newMessages.map(m => ({
        sender: m.sender,
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
        parts: [m.text]
      }));

      const response = await axios.post(
        `${API_BASE}/admin/chat`,
        {
          message: userText,
          history: chatHistory.slice(-10)
        },
        {
          headers: authHeaders()
        }
      );

      setIsGeminiActive(response.data.gemini_active !== false);

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: response.data.reply,
          metadata: response.data.metadata,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.warn('Real AI Chatbot unreachable, switching to local assistant fallback:', err);
      
      // Simple local responder mock for offline/frontend-only mode
      let reply = "I am currently running in **Local Helper Mode** because the backend Flask server is offline on this host.\n\nHere are some quick shortcuts and navigation tips:\n* **Dashboard**: Displays overall application stats and graphs.\n* **Applications**: Shows all pending and under-verification submissions (use filters to see OCR mismatch flags).\n* **Students**: Look up enrolled student profiles, academic marksheets, and assigned IDs.\n\nIf you want full Gemini AI chat capability, please start the Flask backend API.";
      
      const lower = userText.toLowerCase();
      if (lower.includes('student') || lower.includes('profile') || lower.includes('lookup') || lower.includes('database')) {
        reply = "To search or manage student records, navigate to the **Students** page from the sidebar. You can search by Name, Email, or Student ID, and inspect document matches.";
      } else if (lower.includes('count') || lower.includes('total') || lower.includes('how many') || lower.includes('stats')) {
        reply = "For real-time statistics (total approved/rejected, monthly registration trends, and department breakdowns), head over to the **Dashboard** page.";
      } else if (lower.includes('status') || lower.includes('verify') || lower.includes('approve') || lower.includes('reject')) {
        reply = "You can update an applicant's status to **Approved** or **Rejected** directly from the **Applications** database page by selecting an application and clicking the status dropdown.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-bot`,
          sender: 'bot',
          text: reply,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inspectStudent = (studentId) => {
    // Navigate to student database page with inspect query param
    navigate(`/admin/students?inspect=${studentId}`);
  };

  const renderMessageText = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    const rendered = [];
    
    let inList = false;
    let listItems = [];
    let inTable = false;
    let tableRows = [];
    
    const parseInline = (str) => {
      let escaped = str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      escaped = escaped.replace(/`([^`]+)`/g, '<code class="glb-chatbot-code">$1</code>');
      escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="glb-chatbot-link">$1</a>');
      return escaped;
    };

    const renderTable = (rows, key) => {
      const parsedRows = rows.map(r => r.split('|').map(cell => cell.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1));
      const contentRows = parsedRows.filter(r => !r.every(cell => cell.startsWith('-')));
      if (contentRows.length === 0) return null;
      const headers = contentRows[0];
      const dataRows = contentRows.slice(1);

      return (
        <div key={key} className="glb-chatbot-table-wrapper">
          <table className="glb-chatbot-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} dangerouslySetInnerHTML={{ __html: parseInline(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Table processing
      if (line.trim().startsWith('|')) {
        if (inList) {
          rendered.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        inTable = true;
        tableRows.push(line);
        continue;
      } else if (inTable) {
        rendered.push(renderTable(tableRows, `table-${i}`));
        inTable = false;
        tableRows = [];
      }

      // Blockquote processing
      if (line.trim().startsWith('>')) {
        if (inList) {
          rendered.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        rendered.push(
          <blockquote key={i} className="glb-chatbot-blockquote" dangerouslySetInnerHTML={{ __html: parseInline(line.trim().substring(1).trim()) }} />
        );
        continue;
      }

      // Header processing
      if (line.startsWith('### ')) {
        if (inList) {
          rendered.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        rendered.push(<h4 key={i} className="glb-chatbot-h3" dangerouslySetInnerHTML={{ __html: parseInline(line.substring(4)) }} />);
        continue;
      }
      if (line.startsWith('#### ')) {
        if (inList) {
          rendered.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        rendered.push(<h5 key={i} className="glb-chatbot-h4" dangerouslySetInnerHTML={{ __html: parseInline(line.substring(5)) }} />);
        continue;
      }

      // List processing
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        inList = true;
        listItems.push(
          <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(line.trim().substring(2)) }} />
        );
      } else {
        if (inList) {
          rendered.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        if (line.trim() !== '') {
          rendered.push(
            <p key={i} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
          );
        }
      }
    }

    if (inList) {
      rendered.push(<ul key="list-end">{listItems}</ul>);
    }
    if (inTable) {
      rendered.push(renderTable(tableRows, "table-end"));
    }

    return rendered;
  };

  // Only show chatbot trigger/content on student database page, but keep state mounted in background
  const isVisible = location.pathname === '/admin/students' && !!localStorage.getItem('adminToken');

  return (
    <div style={{ display: isVisible ? 'contents' : 'none' }}>
      {/* Styles Injection */}
      <style>{`
        .glb-chatbot-trigger {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          border: none;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999;
        }
        .glb-chatbot-trigger:hover {
          transform: scale(1.1) rotate(5deg);
          background: #1d4ed8;
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.5);
        }
        .glb-chatbot-panel {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 380px;
          height: 600px;
          max-height: calc(100vh - 120px);
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 999;
          transform-origin: bottom right;
          animation: glbChatbotOpen 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes glbChatbotOpen {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .glb-chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .glb-chatbot-messages::-webkit-scrollbar {
          width: 6px;
        }
        .glb-chatbot-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .glb-chatbot-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .glb-chatbot-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .glb-chatbot-row {
          display: flex;
          width: 100%;
        }
        .glb-chatbot-row.user {
          justify-content: flex-end;
        }
        .glb-chatbot-row.bot {
          justify-content: flex-start;
        }
        .glb-chatbot-bubble {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          line-height: 1.5;
        }
        .glb-chatbot-row.user .glb-chatbot-bubble {
          background: var(--color-royal);
          color: white;
          border-bottom-right-radius: 2px;
        }
        .glb-chatbot-row.bot .glb-chatbot-bubble {
          background: var(--bg-primary);
          border: 1px solid var(--border-glass);
          color: var(--text-primary);
          border-bottom-left-radius: 2px;
        }
        .glb-chatbot-bubble p {
          margin: 0 0 8px 0;
        }
        .glb-chatbot-bubble p:last-child {
          margin-bottom: 0;
        }
        .glb-chatbot-bubble ul {
          margin: 0 0 8px 0;
          padding-left: 20px;
        }
        .glb-chatbot-bubble li {
          margin-bottom: 4px;
        }
        .glb-chatbot-code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 12px;
        }
        .glb-chatbot-link {
          color: var(--color-sky);
          text-decoration: underline;
        }
        .glb-chatbot-blockquote {
          margin: 8px 0;
          padding-left: 10px;
          border-left: 2px solid var(--color-royal);
          color: var(--text-secondary);
          font-style: italic;
        }
        .glb-chatbot-h3 {
          font-size: 14px;
          font-weight: 700;
          margin: 12px 0 6px 0;
          color: var(--text-primary);
        }
        .glb-chatbot-h4 {
          font-size: 13px;
          font-weight: 600;
          margin: 10px 0 4px 0;
          color: var(--text-secondary);
        }
        .glb-chatbot-table-wrapper {
          overflow-x: auto;
          margin: 8px 0;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-glass);
        }
        .glb-chatbot-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .glb-chatbot-table th, .glb-chatbot-table td {
          border: 1px solid var(--border-glass);
          padding: 6px 8px;
          text-align: left;
        }
        .glb-chatbot-table th {
          background: rgba(255, 255, 255, 0.05);
          font-weight: 600;
        }
        .glb-chatbot-table-wrapper {
          overflow-x: auto;
          margin: 8px 0;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-glass);
        }
        .glb-chatbot-card {
          margin-top: 10px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-glass);
          border-radius: var(--radius-sm);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .glb-chatbot-card-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 11px;
        }
        .glb-chatbot-card-label {
          color: var(--text-secondary);
          font-weight: 500;
          flex-shrink: 0;
        }
        .glb-chatbot-card-value {
          color: var(--text-primary);
          font-weight: 600;
          text-align: right;
          word-break: break-all;
        }
        .glb-chatbot-card-btn {
          margin-top: 4px;
          padding: 8px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          border-radius: var(--radius-sm);
          border: none;
          background: var(--color-royal);
          color: white;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .glb-chatbot-card-btn:hover {
          background: var(--color-royal-light);
        }
        .glb-chatbot-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 13px;
          resize: none;
          max-height: 80px;
          font-family: inherit;
        }
        .glb-chatbot-textarea::placeholder {
          color: var(--text-muted);
        }
        .glb-chatbot-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background-color: var(--text-secondary);
          animation: glbChatbotDotWave 1.4s infinite ease-in-out both;
        }
        .glb-chatbot-dot:nth-child(1) { animation-delay: -0.32s; }
        .glb-chatbot-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes glbChatbotDotWave {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        .glb-chatbot-typing {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }
      `}</style>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="glb-chatbot-trigger"
        title="AI Database Assistant"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Floating Panel Panel */}
      {isOpen && (
        <div className="glb-chatbot-panel">
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--color-royal) 0%, var(--color-purple) 100%)',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex'
              }}>
                <Sparkles size={16} color="white" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', fontFamily: 'var(--font-secondary)' }}>AI Database Assistant</span>
                {isGeminiActive ? (
                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    GEMINI AI ACTIVE
                  </span>
                ) : (
                  <span title="To enable Gemini AI, add GEMINI_API_KEY to your backend/.env file" style={{ fontSize: '9px', color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                    LOCAL ENGINE MODE
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="glb-chatbot-messages">
            {messages.map((m) => (
              <div key={m.id} className={`glb-chatbot-row ${m.sender}`}>
                <div className="glb-chatbot-bubble">
                  {renderMessageText(m.text)}

                  {m.metadata && m.metadata.type === 'student' && (
                    <div className="glb-chatbot-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <User size={12} style={{ color: 'var(--color-purple-light)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-sky)' }}>Student Profile</span>
                      </div>
                      <div className="glb-chatbot-card-row">
                        <span className="glb-chatbot-card-label">ID</span>
                        <span className="glb-chatbot-card-value">{m.metadata.id}</span>
                      </div>
                      <div className="glb-chatbot-card-row">
                        <span className="glb-chatbot-card-label">Name</span>
                        <span className="glb-chatbot-card-value">{m.metadata.details.name}</span>
                      </div>
                      <div className="glb-chatbot-card-row">
                        <span className="glb-chatbot-card-label">Department</span>
                        <span className="glb-chatbot-card-value">{m.metadata.details.department}</span>
                      </div>
                      <button 
                        onClick={() => inspectStudent(m.metadata.id)}
                        className="glb-chatbot-card-btn"
                      >
                        Inspect Student Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="glb-chatbot-row bot">
                <div className="glb-chatbot-bubble">
                  <div className="glb-chatbot-typing">
                    <span className="glb-chatbot-dot"></span>
                    <span className="glb-chatbot-dot"></span>
                    <span className="glb-chatbot-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderTop: '1px solid var(--border-glass)'
          }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              alignItems: 'center',
              padding: '6px 10px'
            }}>
              <textarea 
                className="glb-chatbot-textarea" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Query database stats/students..."
                rows={1}
              />
              <button 
                onClick={handleSend} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: input.trim() && !loading ? 'var(--color-royal-light)' : 'var(--text-secondary)',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={!input.trim() || loading}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Enter to send</span>
              <span>{isGeminiActive ? 'Gemini AI Connected' : 'Local Database Engine'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
