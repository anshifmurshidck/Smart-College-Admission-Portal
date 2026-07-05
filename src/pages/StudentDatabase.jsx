import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import {
  Search, Edit2, Trash2, Download, User, AlertCircle,
  X, Phone, Mail, Calendar, GraduationCap, ChevronLeft, ChevronRight, CheckCircle,
  MapPin, Hash, Award, FileCheck, ExternalLink, Sparkles, MessageSquare, Send, CornerDownLeft, Loader2
} from 'lucide-react';
import { TableSkeleton } from '../components/LoadingSkeleton';

const countryCodes = [
  { code: '+91', name: 'India', flag: '🇮🇳', length: 10, placeholder: '98765 43210' },
  { code: '+1', name: 'US / Canada', flag: '🇺🇸', length: 10, placeholder: '201 555 0123' },
  { code: '+44', name: 'UK', flag: '🇬🇧', length: 10, placeholder: '7700 900077' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', length: 9, placeholder: '412 345 678' },
  { code: '+86', name: 'China', flag: '🇨🇳', length: 11, placeholder: '138 1234 5678' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', length: 9, placeholder: '50 123 4567' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', length: 8, placeholder: '8123 4567' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', minLength: 10, maxLength: 11, placeholder: '170 1234567' },
  { code: '+33', name: 'France', flag: '🇫🇷', length: 9, placeholder: '6 1234 5678' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', length: 10, placeholder: '300 1234567' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', length: 10, placeholder: '1712 345678' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', length: 9, placeholder: '71 234 5678' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', length: 10, placeholder: '985 1012345' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', minLength: 9, maxLength: 10, placeholder: '12 345 6789' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', minLength: 9, maxLength: 12, placeholder: '812 3456 7890' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', length: 10, placeholder: '312 345 6789' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', length: 9, placeholder: '612 345 678' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', length: 9, placeholder: '82 123 4567' },
  { code: 'Other', name: 'Other', flag: '🌐', minLength: 7, maxLength: 15, placeholder: 'Enter phone' },
];

const parsePhoneNumber = (combinedPhone) => {
  if (!combinedPhone) return { countryCode: '+91', localPhone: '' };
  
  const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
  for (const c of sortedCodes) {
    if (c.code !== 'Other' && combinedPhone.startsWith(c.code)) {
      return {
        countryCode: c.code,
        localPhone: combinedPhone.slice(c.code.length)
      };
    }
  }
  
  const match = combinedPhone.match(/^(\+[0-9]+)([0-9]{7,15})$/);
  if (match) {
    return { countryCode: match[1], localPhone: match[2] };
  }
  
  return { countryCode: 'Other', localPhone: combinedPhone };
};

const handlePhoneKeyDown = (e, countryCode) => {
  const ctrl = e.ctrlKey || e.metaKey;
  if (
    ctrl ||
    ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
  )
    return;
  if (countryCode === 'Other' && e.key === '+' && e.target.selectionStart === 0) return;
  if (!/\d/.test(e.key)) {
    e.preventDefault();
  }
};

export default function StudentDatabase() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // Selected student modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Edit Modal
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ fullName:'', email:'', phoneCountryCode: '+91', phone:'', dob:'', gender:'', departmentId:'', address:'' });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const API_BASE = (import.meta.env.VITE_API_URL || '/api');
  const token = () => localStorage.getItem('adminToken');
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  // AI Chatbot Sidebar States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I am your AI Student Database Assistant. Ask me anything about student records, department averages, state distributions, or individual profiles.',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isGeminiActive, setIsGeminiActive] = useState(true);
  const chatMessagesEndRef = useRef(null);

  // Auto-scroll chat history
  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Inject Chatbot styles on mount
  useEffect(() => {
    const styleId = 'student-chatbot-styles-injected';
    if (document.getElementById(styleId)) return;

    const styles = document.createElement('style');
    styles.id = styleId;
    styles.innerHTML = `
      .db-chatbot-bubble {
        max-width: 85%;
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        position: relative;
        font-size: 13px;
        line-height: 1.5;
        box-shadow: var(--shadow-card);
        color: var(--text-primary);
      }
      .db-chatbot-row {
        display: flex;
        width: 100%;
      }
      .db-chatbot-row.user { justify-content: flex-end; }
      .db-chatbot-row.bot { justify-content: flex-start; }
      
      .db-chatbot-row.user .db-chatbot-bubble {
        background: linear-gradient(135deg, var(--color-royal) 0%, rgba(37, 99, 235, 0.8) 100%);
        color: white;
        border-top-right-radius: 2px;
      }
      .db-chatbot-row.bot .db-chatbot-bubble {
        background: var(--bg-glass-light);
        border: 1px solid var(--border-glass);
        border-top-left-radius: 2px;
      }
      
      .db-chatbot-link {
        color: var(--color-sky);
        text-decoration: underline;
        font-weight: 500;
      }
      .db-chatbot-link:hover {
        color: var(--color-royal-light);
      }
      .db-chatbot-code {
        background: rgba(0,0,0,0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 11px;
      }
      
      .db-chatbot-textarea {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-primary);
        font-size: 13px;
        resize: none;
        max-height: 60px;
        height: 20px;
        line-height: 20px;
        padding: 2px 0;
      }
      .db-chatbot-textarea::placeholder {
        color: var(--text-muted);
      }
      
      .db-chatbot-typing {
        display: flex;
        gap: 4px;
        padding: 4px 6px;
        align-items: center;
      }
      .db-chatbot-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: var(--text-secondary);
        animation: dbChatbotDotWave 1.4s infinite ease-in-out both;
      }
      .db-chatbot-dot:nth-child(1) { animation-delay: -0.32s; }
      .db-chatbot-dot:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes dbChatbotDotWave {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      /* Rich Card styling */
      .db-chatbot-card {
        margin-top: 10px;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      }
      .db-chatbot-card-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 11px;
      }
      .db-chatbot-card-label {
        color: var(--text-secondary);
        font-weight: 500;
        flex-shrink: 0;
      }
      .db-chatbot-card-value {
        color: var(--text-primary);
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }
      .db-chatbot-card-btn {
        margin-top: 4px;
        padding: 6px;
        font-size: 10px;
        font-weight: 600;
        text-align: center;
        border-radius: var(--radius-sm);
        border: none;
        background: var(--color-royal);
        color: white;
        cursor: pointer;
        transition: var(--transition-fast);
      }
      .db-chatbot-card-btn:hover {
        background: var(--color-royal-light);
      }
    `;
    document.head.appendChild(styles);
  }, []);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput;
    setChatInput('');
    setChatLoading(true);

    const userMsgId = `msg-${Date.now()}`;
    const newMessages = [
      ...chatMessages,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        timestamp: new Date()
      }
    ];
    setChatMessages(newMessages);

    try {
      const chatHistory = newMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
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

      setChatMessages(prev => [
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
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'bot',
          text: '⚠️ **System Error**: Could not deliver message. Please ensure the backend is running and you are authenticated.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChatMessage();
    }
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
      escaped = escaped.replace(/`([^`]+)`/g, '<code class="db-chatbot-code">$1</code>');
      escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="db-chatbot-link">$1</a>');
      return escaped;
    };

    const renderTable = (rows, key) => {
      const parsedRows = rows.map(r => r.split('|').map(cell => cell.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1));
      const contentRows = parsedRows.filter(r => !r.every(cell => cell.startsWith('-')));
      if (contentRows.length === 0) return null;
      const headers = contentRows[0];
      const body = contentRows.slice(1);
      return (
        <div key={`table-${key}`} style={{ overflowX: 'auto', margin: '8px 0', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                {headers.map((h, idx) => (
                  <th key={idx} style={{ padding: '4px 8px', fontWeight: '700', color: 'var(--text-primary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: rIdx < body.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '4px 8px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('* ') || line.startsWith('- ')) {
        if (inTable) {
          rendered.push(renderTable(tableRows, i));
          inTable = false;
          tableRows = [];
        }
        inList = true;
        listItems.push(line.substring(2));
        continue;
      }
      
      if (inList && !line.startsWith('* ') && !line.startsWith('- ')) {
        rendered.push(
          <ul key={`list-${i}`} style={{ paddingLeft: '16px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      
      if (line.startsWith('|')) {
        inTable = true;
        tableRows.push(line);
        continue;
      }
      
      if (inTable && !line.startsWith('|')) {
        rendered.push(renderTable(tableRows, i));
        inTable = false;
        tableRows = [];
      }
      
      if (line === '') {
        rendered.push(<div key={`br-${i}`} style={{ height: '4px' }} />);
        continue;
      }
      
      if (line.startsWith('### ')) {
        rendered.push(<h5 key={`h-${i}`} style={{ margin: '8px 0 2px 0', fontWeight: '700', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: parseInline(line.substring(4)) }} />);
      } else if (line.startsWith('## ')) {
        rendered.push(<h4 key={`h-${i}`} style={{ margin: '10px 0 4px 0', fontWeight: '700', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: parseInline(line.substring(3)) }} />);
      } else if (line.startsWith('# ')) {
        rendered.push(<h3 key={`h-${i}`} style={{ margin: '12px 0 6px 0', fontWeight: '800', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: parseInline(line.substring(2)) }} />);
      } else {
        rendered.push(<p key={`p-${i}`} style={{ margin: '2px 0', lineHeight: '1.4', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />);
      }
    }
    
    if (inList) {
      rendered.push(
        <ul key="list-end" style={{ paddingLeft: '16px', margin: '4px 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
    }
    if (inTable) {
      rendered.push(renderTable(tableRows, 'end'));
    }
    return rendered;
  };

  const loadStudents = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let query = supabase.from('applications').select('*, department:departments(code, name)').eq('status', 'Approved');
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,assigned_student_id.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (deptFilter) {
        query = query.eq('department_id', deptFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const formatted = data.map(app => ({
        id: app.assigned_student_id || `TMP-${app.id}`,
        application_id: app.id,
        full_name: app.full_name,
        email: app.email,
        phone: app.phone,
        dob: app.dob,
        gender: app.gender,
        department_id: app.department_id,
        department_code: app.department?.code,
        department_name: app.department?.name,
        enroll_date: app.updated_at
      }));
      setStudents(formatted);
      setPage(1);
    } catch (err) {
      setErrorMsg('Failed to load student database.');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    } catch(e) {}
  };

  useEffect(() => {
    loadStudents();
    loadDepartments();
  }, [search, deptFilter]);

  const viewStudent = async (studentId) => {
    setSelectedStudent(studentId);
    setEditMode(false);
    setDetailsLoading(true);
    setStudentDetails(null);
    
    try {
      const appIdMatch = studentId.replace('TMP-', '');
      const { data, error } = await supabase.from('applications')
        .select('*, department:departments(code, name)')
        .or(`assigned_student_id.eq.${studentId},id.eq.${appIdMatch}`)
        .single();
        
      if (error) throw error;
      
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('application_id', data.id);

      if (docsError) throw docsError;

      let docs = docsData || [];
      if (docs.length === 0) {
        const appIdForUrl = data.id;
        const docTypes = [
          { id: '10th', name: 'marksheet10', title: '10th Marksheet', fallback: '/graduation.png' },
          { id: '12th', name: 'marksheet12', title: '12th Marksheet', fallback: '/dept_cse.png' },
          { id: 'id', name: 'idProof', title: 'ID Proof', fallback: '/logo_transparent.png' }
        ];
        const exts = ['.pdf', '.png', '.jpg', '.jpeg', ''];
        
        docs = await Promise.all(docTypes.map(async (doc) => {
          let foundUrl = null;
          for (const ext of exts) {
            const publicUrl = supabase.storage.from('documents').getPublicUrl(`${appIdForUrl}/${doc.name}${ext}`).data.publicUrl;
            try {
              const res = await fetch(publicUrl, { method: 'HEAD' });
              if (res.ok) {
                foundUrl = publicUrl;
                break;
              }
            } catch (e) {
              // ignore
            }
          }
          return {
            id: foundUrl ? `${appIdForUrl}-${doc.id}` : `mock-${doc.id}`,
            document_type: doc.title,
            file_path: foundUrl || doc.fallback
          };
        }));
      }

      setStudentDetails({
        student: {
          ...data,
          department_name: data.department?.name
        },
        documents: docs
      });
      const parsed = parsePhoneNumber(data.phone);
      setEditForm({
        full_name: data.full_name,
        email: data.email,
        phoneCountryCode: parsed.countryCode,
        phone: parsed.localPhone,
        dob: data.dob,
        gender: data.gender,
        department_id: data.department_id,
        aadhaar_number: data.aadhaar_number,
        state: data.state,
        tenth_percentage: data.tenth_percentage,
        twelfth_percentage: data.twelfth_percentage
      });
    } catch(err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const studentCountry = countryCodes.find(c => c.code === editForm.phoneCountryCode);
    const cleanPhone = (editForm.phone || '').trim();
    if (!cleanPhone) {
      alert('Phone Number is required');
      return;
    }
    if (editForm.phoneCountryCode === 'Other') {
      if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
        alert('Phone must be between 7 and 15 digits');
        return;
      }
    } else {
      if (!/^[0-9]+$/.test(cleanPhone)) {
        alert('Phone number must contain only digits');
        return;
      } else if (studentCountry.length && cleanPhone.length !== studentCountry.length) {
        alert(`Phone number must be exactly ${studentCountry.length} digits for ${studentCountry.name} (${studentCountry.code})`);
        return;
      } else if (studentCountry.minLength && (cleanPhone.length < studentCountry.minLength || cleanPhone.length > studentCountry.maxLength)) {
        alert(`Phone number must be between ${studentCountry.minLength} and ${studentCountry.maxLength} digits for ${studentCountry.name} (${studentCountry.code})`);
        return;
      }
    }

    const combinedPhone = editForm.phoneCountryCode === 'Other' ? cleanPhone : editForm.phoneCountryCode + cleanPhone;

    const cleanAadhaar = (editForm.aadhaar_number || '').trim();
    if (!cleanAadhaar) {
      alert('Aadhaar Number is required');
      return;
    }
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      alert('Aadhaar Number must be exactly 12 digits');
      return;
    }

    if (!editForm.dob) {
      alert('Date of Birth is required');
      return;
    } else {
      const birthDate = new Date(editForm.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 17) {
        alert('Student must be at least 17 years old');
        return;
      }
    }

    const cleanTenth = String(editForm.tenth_percentage || '').trim();
    if (!cleanTenth) {
      alert('10th Percentage is required');
      return;
    }
    const tenthVal = parseFloat(cleanTenth);
    if (isNaN(tenthVal) || tenthVal < 0 || tenthVal > 100) {
      alert('10th Percentage must be between 0 and 100');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cleanTenth)) {
      alert('10th Percentage must have at most 2 decimal places (e.g. 78.90)');
      return;
    }

    const cleanTwelfth = String(editForm.twelfth_percentage || '').trim();
    if (!cleanTwelfth) {
      alert('12th Percentage is required');
      return;
    }
    const twelfthVal = parseFloat(cleanTwelfth);
    if (isNaN(twelfthVal) || twelfthVal < 0 || twelfthVal > 100) {
      alert('12th Percentage must be between 0 and 100');
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cleanTwelfth)) {
      alert('12th Percentage must have at most 2 decimal places (e.g. 78.90)');
      return;
    }

    try {
      const appIdMatch = selectedStudent.replace('TMP-', '');
      const updatedForm = {
        ...editForm,
        phone: combinedPhone,
        tenth_percentage: editForm.tenth_percentage ? parseFloat(editForm.tenth_percentage) : null,
        twelfth_percentage: editForm.twelfth_percentage ? parseFloat(editForm.twelfth_percentage) : null
      };
      delete updatedForm.phoneCountryCode;

      const { error } = await supabase.from('applications')
        .update(updatedForm)
        .or(`assigned_student_id.eq.${selectedStudent},id.eq.${appIdMatch}`);
      
      if (error) throw error;
      loadStudents();
      viewStudent(selectedStudent);
      setEditMode(false);
    } catch(err) {
      alert(err.message || 'Edit failed');
    }
  };

  const handleDelete = async (studentId) => {
    try {
      const appIdMatch = studentId.replace('TMP-', '');
      const { error } = await supabase.from('applications')
        .update({ status: 'Pending', assigned_student_id: null })
        .or(`assigned_student_id.eq.${studentId},id.eq.${appIdMatch}`);
      
      if (error) throw error;
      setDeleteTarget(null);
      setSelectedStudent(null);
      loadStudents();
    } catch(err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const studentCountry = countryCodes.find(c => c.code === addForm.phoneCountryCode);
    const cleanPhone = (addForm.phone || '').trim();
    if (!cleanPhone) {
      alert('Phone Number is required');
      return;
    }
    if (addForm.phoneCountryCode === 'Other') {
      if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
        alert('Phone must be between 7 and 15 digits');
        return;
      }
    } else {
      if (!/^[0-9]+$/.test(cleanPhone)) {
        alert('Phone number must contain only digits');
        return;
      } else if (studentCountry.length && cleanPhone.length !== studentCountry.length) {
        alert(`Phone number must be exactly ${studentCountry.length} digits for ${studentCountry.name} (${studentCountry.code})`);
        return;
      } else if (studentCountry.minLength && (cleanPhone.length < studentCountry.minLength || cleanPhone.length > studentCountry.maxLength)) {
        alert(`Phone number must be between ${studentCountry.minLength} and ${studentCountry.maxLength} digits for ${studentCountry.name} (${studentCountry.code})`);
        return;
      }
    }

    const combinedPhone = addForm.phoneCountryCode === 'Other' ? cleanPhone : addForm.phoneCountryCode + cleanPhone;

    setAddLoading(true);
    setAddSuccess('');
    
    try {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const studentId = `STU-${year}-${rand}`;
      const appId = `APP-${year}-${rand}`;
      
      const { error } = await supabase.from('applications').insert([{
        id: appId,
        full_name: addForm.fullName,
        email: addForm.email,
        phone: combinedPhone,
        dob: addForm.dob,
        gender: addForm.gender,
        department_id: addForm.departmentId,
        address: addForm.address,
        status: 'Approved',
        assigned_student_id: studentId,
        parent_name: 'N/A',
        parent_phone: 'N/A'
      }]);
      
      if (error) throw error;
      
      setAddSuccess(`Student registered! ID: ${studentId}`);
      setAddForm({ fullName:'', email:'', phoneCountryCode: '+91', phone:'', dob:'', gender:'', departmentId:'', address:'' });
      loadStudents();
    } catch(err) {
      alert(err.message || 'Failed to add student');
    } finally {
      setAddLoading(false);
    }
  };

  const handleCSVExport = () => {
    alert("CSV Export is disabled in mock mode.");
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const paginated = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', gap: '30px', position: 'relative', alignItems: 'flex-start' }}>
      
      {/* Left Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Student Database</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {students.length} enrolled student{students.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)} 
              className={`btn-ripple ${isChatOpen ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ padding: '10px 16px', display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}
            >
              <Sparkles size={16} /> AI Assistant
            </button>
            <button onClick={handleCSVExport} className="btn-ripple btn-secondary" style={{ padding: '10px 16px', display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="form-input" placeholder="Search by name, ID, email..." style={{ paddingLeft: '40px' }} />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="form-select" style={{ padding: '10px 14px', fontSize: '13px' }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Students Table */}
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          {loading ? <TableSkeleton cols={5} rows={8} /> :
            errorMsg ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#ef4444' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 12px auto' }} />
                <p>{errorMsg}</p>
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <GraduationCap size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                <h4 style={{ fontSize: '18px', fontWeight: '600' }}>No Students Found</h4>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Approve applicants to see them here, or add one manually.</p>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                      <th style={{ padding: '12px 16px' }}>Student ID</th>
                      <th style={{ padding: '12px 16px' }}>Full Name</th>
                      <th style={{ padding: '12px 16px' }}>Department</th>
                      <th style={{ padding: '12px 16px' }}>Email</th>
                      <th style={{ padding: '12px 16px' }}>Enroll Date</th>
                      <th style={{ padding: '12px 16px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-primary)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        onClick={() => viewStudent(s.id)}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-royal)', fontFamily: 'var(--font-display)' }}>{s.id}</td>
                        <td style={{ padding: '14px 16px', fontWeight: '600' }}>{s.full_name}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-purple)', backgroundColor: 'rgba(124,58,237,0.08)', padding: '3px 8px', borderRadius: '4px' }}>
                            {s.department_name}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{s.email}</td>
                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{String(s.enroll_date).substring(0, 10)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={e => { e.stopPropagation(); viewStudent(s.id); setEditMode(true); }} style={{ padding: '6px', border: 'none', background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal)', borderRadius: '6px', cursor: 'pointer' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setDeleteTarget(s.id); }} style={{ padding: '6px', border: 'none', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Page {page} of {totalPages} — {students.length} records</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )
          }
        </div>
      </div>

      {/* Right Collapsible AI Sidebar */}
      {isChatOpen && (
        <div style={{
          width: '420px',
          flexShrink: 0,
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-premium)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          position: 'sticky',
          top: '32px',
          overflow: 'hidden',
          zIndex: 90
        }}>
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
              onClick={() => setIsChatOpen(false)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            scrollBehavior: 'smooth'
          }}>
            {chatMessages.map((m) => (
              <div key={m.id} className={`db-chatbot-row ${m.sender}`}>
                <div className="db-chatbot-bubble">
                  {renderMessageText(m.text)}

                  {m.metadata && m.metadata.type === 'student' && (
                    <div className="db-chatbot-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <User size={12} style={{ color: 'var(--color-purple-light)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-sky)' }}>Student Profile</span>
                      </div>
                      <div className="db-chatbot-card-row">
                        <span className="db-chatbot-card-label">ID</span>
                        <span className="db-chatbot-card-value">{m.metadata.id}</span>
                      </div>
                      <div className="db-chatbot-card-row">
                        <span className="db-chatbot-card-label">Name</span>
                        <span className="db-chatbot-card-value">{m.metadata.details.name}</span>
                      </div>
                      <div className="db-chatbot-card-row">
                        <span className="db-chatbot-card-label">Department</span>
                        <span className="db-chatbot-card-value">{m.metadata.details.department}</span>
                      </div>
                      <button 
                        onClick={() => viewStudent(m.metadata.id)}
                        className="db-chatbot-card-btn"
                      >
                        Inspect Student Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="db-chatbot-row bot">
                <div className="db-chatbot-bubble">
                  <div className="db-chatbot-typing">
                    <span className="db-chatbot-dot"></span>
                    <span className="db-chatbot-dot"></span>
                    <span className="db-chatbot-dot"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatMessagesEndRef} />
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
                className="db-chatbot-textarea" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Query database stats/students..."
                rows={1}
              />
              <button 
                onClick={handleSendChatMessage} 
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: chatInput.trim() && !chatLoading ? 'var(--color-royal-light)' : 'var(--text-secondary)',
                  cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={!chatInput.trim() || chatLoading}
              >
                {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <CornerDownLeft size={14} />}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Enter to send</span>
              <span>{isGeminiActive ? 'Gemini AI Connected' : 'Local Database Engine'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedStudent(null)}>
          <div style={{ maxWidth: '550px', width: '100%', backgroundColor: 'var(--bg-secondary)', height: '100%', boxShadow: '-10px 0 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto', borderLeft: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{studentDetails?.student?.full_name || '...'}</h3>
                <span style={{ fontSize: '13px', color: 'var(--color-royal)', fontWeight: '700' }}>{selectedStudent}</span>
              </div>
              <button onClick={() => setSelectedStudent(null)} style={{ padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={22} />
              </button>
            </div>

            {detailsLoading ? (
              <div style={{ textAlign: 'center', paddingTop: '50px' }}>Loading student profile...</div>
            ) : studentDetails && (
              editMode ? (
                /* Edit Form */
                <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Edit Student Profile</h4>
                  {[
                    { label: 'Full Name', key: 'full_name', type: 'text' },
                    { label: 'Email', key: 'email', type: 'email' },
                    { label: 'Date of Birth', key: 'dob', type: 'date' },
                    { label: 'Aadhaar Number', key: 'aadhaar_number', type: 'text', maxLength: 12 },
                    { label: 'State', key: 'state', type: 'text' },
                    { label: '10th Percentage (%)', key: 'tenth_percentage', type: 'text' },
                    { label: '12th Percentage (%)', key: 'twelfth_percentage', type: 'text' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input
                        type={f.type}
                        value={editForm[f.key] || ''}
                        onChange={e => {
                          const val = e.target.value;
                          if (f.key === 'tenth_percentage' || f.key === 'twelfth_percentage') {
                            if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                              setEditForm(p => ({ ...p, [f.key]: val }));
                            }
                          } else {
                            setEditForm(p => ({ ...p, [f.key]: val }));
                          }
                        }}
                        className="form-input"
                        maxLength={f.maxLength}
                        onKeyDown={(e) => {
                          if (f.key === 'aadhaar_number') {
                            const ctrl = e.ctrlKey || e.metaKey;
                            if (ctrl || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                            if (!/\d/.test(e.key)) e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  ))}

                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={editForm.phoneCountryCode || '+91'}
                        onChange={e => {
                          const code = e.target.value;
                          const selected = countryCodes.find(c => c.code === code);
                          const maxLen = selected ? (selected.maxLength || selected.length || 15) : 15;
                          setEditForm(p => ({
                            ...p,
                            phoneCountryCode: code,
                            phone: (p.phone || '').slice(0, maxLen)
                          }));
                        }}
                        className="form-select"
                        style={{ width: '110px', flexShrink: 0 }}
                      >
                        {countryCodes.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                        onKeyDown={e => handlePhoneKeyDown(e, editForm.phoneCountryCode)}
                        className="form-input"
                        placeholder={
                          countryCodes.find((c) => c.code === editForm.phoneCountryCode)?.placeholder || 'Enter phone'
                        }
                        maxLength={
                          (() => {
                            const selected = countryCodes.find(c => c.code === editForm.phoneCountryCode);
                            return selected ? (selected.maxLength || selected.length || 15) : 15;
                          })()
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select value={editForm.gender || ''} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className="form-select">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select value={editForm.department_id || ''} onChange={e => setEditForm(p => ({ ...p, department_id: e.target.value }))} className="form-select">
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="button" onClick={() => setEditMode(false)} className="btn-ripple btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                    <button type="submit" className="btn-ripple btn-primary" style={{ flex: 1, padding: '12px' }}>Save Changes</button>
                  </div>
                </form>
              ) : (
                /* View Mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { icon: Mail, label: 'Email', val: studentDetails.student.email },
                    { icon: Phone, label: 'Phone', val: studentDetails.student.phone },
                    { icon: Calendar, label: 'Date of Birth', val: String(studentDetails.student.dob).substring(0, 10) },
                    { icon: User, label: 'Gender', val: studentDetails.student.gender },
                    { icon: GraduationCap, label: 'Department', val: studentDetails.student.department_name },
                    { icon: MapPin, label: 'State', val: studentDetails.student.state || 'N/A' },
                    { icon: Hash, label: 'Aadhaar Number', val: studentDetails.student.aadhaar_number || 'N/A' },
                    { icon: Award, label: '10th Percentage', val: studentDetails.student.tenth_percentage ? `${studentDetails.student.tenth_percentage}%` : 'N/A' },
                    { icon: Award, label: '12th Percentage', val: studentDetails.student.twelfth_percentage ? `${studentDetails.student.twelfth_percentage}%` : 'N/A' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '14px' }}>
                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(37,99,235,0.08)', color: 'var(--color-royal)' }}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                          <div style={{ fontWeight: '600', marginTop: '2px' }}>{item.val}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Uploaded Documents List with Preview links */}
                  {studentDetails.documents && studentDetails.documents.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Uploaded Verification Files
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                        {studentDetails.documents.map((doc) => {
                          const fileUrl = doc.file_path;
                          const isImage = doc.file_path.match(/\.(png|jpg|jpeg)$/i);
                          
                          return (
                            <div key={doc.id} style={{ 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              backgroundColor: 'var(--bg-primary)'
                            }}>
                              {isImage ? (
                                <img src={fileUrl} alt={doc.document_type} style={{ height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                  <FileCheck size={24} />
                                </div>
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700' }}>{doc.document_type}</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--color-royal)', fontWeight: '600' }}
                                  >
                                    Open File <ExternalLink size={10} />
                                  </a>
                                  <a 
                                    href={fileUrl} 
                                    download={doc.document_type}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--color-royal)', fontWeight: '600' }}
                                  >
                                    Download <Download size={10} />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => setEditMode(true)} className="btn-ripple btn-secondary" style={{ flex: 1, padding: '10px', display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '13px' }}>
                      <Edit2 size={15} /> Edit Profile
                    </button>
                    <button onClick={() => setDeleteTarget(selectedStudent)} style={{ flex: 1, padding: '10px', display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '13px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-full)', fontWeight: '600', cursor: 'pointer' }}>
                      <Trash2 size={15} /> Remove
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Remove Student Record?</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px', lineHeight: '1.6' }}>
              This will permanently remove the student entry and revert the associated application to Pending. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setDeleteTarget(null)} className="btn-ripple btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 'var(--radius-full)', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(5px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Add Student Manually</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            {addSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#059669' }}>
                <CheckCircle size={48} style={{ margin: '0 auto 16px auto' }} />
                <h4 style={{ fontSize: '18px', fontWeight: '700' }}>Student Added!</h4>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{addSuccess}</p>
                <button onClick={() => setShowAddModal(false)} className="btn-ripple btn-primary" style={{ marginTop: '20px', padding: '10px 24px' }}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text', placeholder: 'John Doe' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'john@example.com' },
                  { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                  { label: 'Residential Address', key: 'address', type: 'text', placeholder: 'Full address' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input required type={f.type} value={addForm[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))} className="form-input" placeholder={f.placeholder} />
                  </div>
                ))}

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      required
                      value={addForm.phoneCountryCode}
                      onChange={e => {
                        const code = e.target.value;
                        const selected = countryCodes.find(c => c.code === code);
                        const maxLen = selected ? (selected.maxLength || selected.length || 15) : 15;
                        setAddForm(p => ({
                          ...p,
                          phoneCountryCode: code,
                          phone: (p.phone || '').slice(0, maxLen)
                        }));
                      }}
                      className="form-select"
                      style={{ width: '110px', flexShrink: 0 }}
                    >
                      {countryCodes.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="tel"
                      value={addForm.phone}
                      onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                      onKeyDown={e => handlePhoneKeyDown(e, addForm.phoneCountryCode)}
                      className="form-input"
                      placeholder={
                        countryCodes.find((c) => c.code === addForm.phoneCountryCode)?.placeholder || 'Enter phone'
                      }
                      maxLength={
                        (() => {
                          const selected = countryCodes.find(c => c.code === addForm.phoneCountryCode);
                          return selected ? (selected.maxLength || selected.length || 15) : 15;
                        })()
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select required value={addForm.gender} onChange={e => setAddForm(p => ({ ...p, gender: e.target.value }))} className="form-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select required value={addForm.departmentId} onChange={e => setAddForm(p => ({ ...p, departmentId: e.target.value }))} className="form-select">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-ripple btn-primary" disabled={addLoading} style={{ padding: '14px', fontSize: '15px', cursor: addLoading ? 'not-allowed' : 'pointer', opacity: addLoading ? 0.7 : 1 }}>
                  {addLoading ? 'Registering...' : 'Register Student'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
