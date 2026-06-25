import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Plus, Edit2, Trash2, Download, User, AlertCircle,
  X, Phone, Mail, Calendar, GraduationCap, ChevronLeft, ChevronRight, CheckCircle
} from 'lucide-react';
import { TableSkeleton } from '../components/LoadingSkeleton';

export default function StudentDatabase() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Selected student modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Edit Modal
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ fullName:'', email:'', phone:'', dob:'', gender:'', departmentId:'', address:'' });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const API_BASE = 'http://localhost:5000/api';
  const token = () => localStorage.getItem('adminToken');
  const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

  const loadStudents = () => {
    setLoading(true);
    setErrorMsg('');
    axios.get(`${API_BASE}/admin/students`, {
      params: { search, departmentId: deptFilter },
      headers: authHeaders()
    }).then(res => {
      setStudents(res.data);
      setPage(1);
      setLoading(false);
    }).catch(err => {
      setErrorMsg('Failed to load student database.');
      setLoading(false);
    });
  };

  const loadDepartments = () => {
    axios.get(`${API_BASE}/departments`).then(res => setDepartments(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadStudents();
    loadDepartments();
  }, [search, deptFilter]);

  const viewStudent = (studentId) => {
    setSelectedStudent(studentId);
    setEditMode(false);
    setDetailsLoading(true);
    setStudentDetails(null);
    axios.get(`${API_BASE}/admin/students/${studentId}`, { headers: authHeaders() })
      .then(res => {
        setStudentDetails(res.data);
        setEditForm({
          full_name: res.data.student.full_name,
          email: res.data.student.email,
          phone: res.data.student.phone,
          dob: res.data.student.dob,
          gender: res.data.student.gender,
          department_id: res.data.student.department_id
        });
        setDetailsLoading(false);
      })
      .catch(() => setDetailsLoading(false));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    axios.put(`${API_BASE}/admin/students/${selectedStudent}`, editForm, { headers: authHeaders() })
      .then(() => {
        loadStudents();
        viewStudent(selectedStudent);
        setEditMode(false);
      })
      .catch(err => alert(err.response?.data?.message || 'Edit failed'));
  };

  const handleDelete = (studentId) => {
    axios.delete(`${API_BASE}/admin/students/${studentId}`, { headers: authHeaders() })
      .then(() => {
        setDeleteTarget(null);
        setSelectedStudent(null);
        loadStudents();
      })
      .catch(err => alert(err.response?.data?.message || 'Delete failed'));
  };

  const handleAddStudent = (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddSuccess('');
    axios.post(`${API_BASE}/admin/students/add`, addForm, { headers: authHeaders() })
      .then(res => {
        setAddSuccess(`Student registered! ID: ${res.data.studentId}`);
        setAddLoading(false);
        loadStudents();
        setAddForm({ fullName:'', email:'', phone:'', dob:'', gender:'', departmentId:'', address:'' });
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Failed to add student');
        setAddLoading(false);
      });
  };

  const handleCSVExport = () => {
    const token_val = token();
    window.open(`${API_BASE}/admin/students?export=csv`, '_blank');
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const paginated = students.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-secondary)' }}>Student Database</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {students.length} enrolled student{students.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleCSVExport} className="btn-ripple btn-secondary" style={{ padding: '10px 16px', display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setShowAddModal(true); setAddSuccess(''); }} className="btn-ripple btn-primary" style={{ padding: '10px 16px', display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'center' }}>
            <Plus size={16} /> Add Student
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
                          {s.department_code}
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
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Page {page} of {totalPages} — {students.length} records</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === 1 ? 0.4 : 1 }}>
                      <ChevronLeft size={14} />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ripple btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', opacity: page === totalPages ? 0.4 : 1 }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        }
      </div>

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
                    { label: 'Phone', key: 'phone', type: 'tel' },
                    { label: 'Date of Birth', key: 'dob', type: 'date' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input type={f.type} value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))} className="form-input" />
                    </div>
                  ))}
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
                  { label: 'Phone', key: 'phone', type: 'tel', placeholder: '9876543210' },
                  { label: 'Date of Birth', key: 'dob', type: 'date', placeholder: '' },
                  { label: 'Residential Address', key: 'address', type: 'text', placeholder: 'Full address' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input required type={f.type} value={addForm[f.key]} onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))} className="form-input" placeholder={f.placeholder} />
                  </div>
                ))}
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
