import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Upload, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';

/* ─── Inline error helper ───────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '5px',
        fontSize: '12px',
        color: '#ef4444',
        fontWeight: 500,
      }}
    >
      <AlertCircle size={13} />
      {msg}
    </span>
  ) : null;

/* ─── Input border helper ────────────────────────────────────────────── */
const inputStyle = (hasError) => ({
  borderColor: hasError ? '#ef4444' : undefined,
  boxShadow: hasError ? '0 0 0 3px rgba(239,68,68,0.12)' : undefined,
});

export default function Apply() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDept = queryParams.get('dept') || '';

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    parentName: '',
    parentPhone: '',
    departmentId: initialDept,
  });

  /* per-field error map */
  const [fieldErrors, setFieldErrors] = useState({});

  /* File States */
  const [files, setFiles] = useState({
    marksheet10: null,
    marksheet12: null,
    idProof: null,
  });

  const [previews, setPreviews] = useState({
    marksheet10: '',
    marksheet12: '',
    idProof: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [agreed, setAgreed] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    axios
      .get(`${API_BASE}/departments`)
      .then((res) => {
        setDepartments(res.data);
        setLoadingDepts(false);
      })
      .catch(() => {
        setDepartments([
          { id: 1, name: 'Computer Science Engineering' },
          { id: 2, name: 'Artificial Intelligence & Machine Learning' },
          { id: 3, name: 'Electronics & Communication Engineering' },
          { id: 4, name: 'Mechanical Engineering' },
          { id: 5, name: 'Civil Engineering' },
        ]);
        setLoadingDepts(false);
      });
  }, []);

  /* ── Input change: clear field error on edit ─────────────────────── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /* ── Allow only letters/spaces/dots/hyphens in name fields ──────── */
  const handleNameKeyDown = (e) => {
    // Allow: backspace, delete, tab, arrows, home, end
    const ctrl = e.ctrlKey || e.metaKey;
    if (
      ctrl ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(e.key)
    )
      return;
    // Block digits
    if (/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  /* ── Allow only digits (+) in phone fields ───────────────────────── */
  const handlePhoneKeyDown = (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (
      ctrl ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
    )
      return;
    // Allow + only at position 0
    if (e.key === '+' && e.target.selectionStart === 0) return;
    // Block anything that isn't a digit
    if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  /* ── File change ─────────────────────────────────────────────────── */
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File "${name}" must be less than 5 MB.`);
        return;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setErrorMsg('Allowed formats: PDF, PNG, JPG, JPEG');
        return;
      }
      setErrorMsg('');
      setFiles((prev) => ({ ...prev, [name]: file }));
      if (file.type.startsWith('image/')) {
        setPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(file) }));
      } else {
        setPreviews((prev) => ({ ...prev, [name]: 'pdf' }));
      }
      // clear file error
      if (fieldErrors[name]) {
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  /* ─── Per-field validation → returns errors object ──────────────── */
  const buildErrors = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full Name is required';
    else if (/\d/.test(formData.fullName)) errs.fullName = 'Name must not contain numbers';

    if (!formData.email.trim()) errs.email = 'Email Address is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
      errs.email = 'Enter a valid email address';

    if (!formData.phone.trim()) errs.phone = 'Phone Number is required';
    else if (!/^\+?[0-9]{10,15}$/.test(formData.phone))
      errs.phone = 'Phone must be 10–15 digits';

    if (!formData.address.trim()) errs.address = 'Residential Address is required';
    if (!formData.dob) errs.dob = 'Date of Birth is required';
    if (!formData.gender) errs.gender = 'Gender is required';

    if (!formData.parentName.trim()) errs.parentName = 'Parent / Guardian Name is required';
    else if (/\d/.test(formData.parentName)) errs.parentName = 'Name must not contain numbers';

    if (!formData.parentPhone.trim()) errs.parentPhone = 'Parent Contact Number is required';
    else if (!/^\+?[0-9]{10,15}$/.test(formData.parentPhone))
      errs.parentPhone = 'Phone must be 10–15 digits';

    if (!formData.departmentId) errs.departmentId = 'Please select a department';
    if (!files.marksheet10) errs.marksheet10 = '10th Marksheet is required';
    if (!files.marksheet12) errs.marksheet12 = '12th Marksheet is required';
    if (!files.idProof) errs.idProof = 'Government ID Proof is required';
    if (!agreed) errs.agreed = 'You must assure the details are correct to submit';

    return errs;
  };

  /* ─── Submit ─────────────────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = buildErrors();

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setErrorMsg('Please fix the highlighted fields before submitting.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setFieldErrors({});
    setErrorMsg('');
    setSubmitting(true);

    const uploadData = new FormData();
    Object.keys(formData).forEach((key) => uploadData.append(key, formData[key]));
    uploadData.append('marksheet10', files.marksheet10);
    uploadData.append('marksheet12', files.marksheet12);
    uploadData.append('idProof', files.idProof);

    axios
      .post(`${API_BASE}/admissions/apply`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => {
        setApplicationId(res.data.applicationId);
        setIsSuccessOpen(true);
        setSubmitting(false);
      })
      .catch((err) => {
        setErrorMsg(
          err.response?.data?.message || 'Server connection error. Please try again later.'
        );
        setSubmitting(false);
        window.scrollTo({ top: 150, behavior: 'smooth' });
      });
  };

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: '60px 0', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-secondary)', fontWeight: 800 }}>
            UG Admissions Application
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Complete the form and upload the mandatory documents to submit your application.
          </p>
        </div>

        {/* Global error banner */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '24px',
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          className="glass-panel"
          onSubmit={handleSubmit}
          noValidate
          style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}
        >

          {/* ── Section 1: Candidate Profile ────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>01.</span> Candidate Profile
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                    (As per High School Certificate)
                  </span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onKeyDown={handleNameKeyDown}
                  className="form-input"
                  placeholder="John Doe"
                  style={inputStyle(fieldErrors.fullName)}
                />
                <FieldError msg={fieldErrors.fullName} />
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="john@example.com"
                    style={inputStyle(fieldErrors.email)}
                  />
                  <FieldError msg={fieldErrors.email} />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onKeyDown={handlePhoneKeyDown}
                    className="form-input"
                    placeholder="9876543210"
                    maxLength={15}
                    style={inputStyle(fieldErrors.phone)}
                  />
                  <FieldError msg={fieldErrors.phone} />
                </div>
              </div>

              {/* DOB + Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">
                    Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="form-input"
                    style={inputStyle(fieldErrors.dob)}
                  />
                  <FieldError msg={fieldErrors.dob} />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Gender <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="form-select"
                    style={inputStyle(fieldErrors.gender)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <FieldError msg={fieldErrors.gender} />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label">
                  Full Residential Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-textarea"
                  placeholder="Street Address, City, State, ZIP Code"
                  style={inputStyle(fieldErrors.address)}
                />
                <FieldError msg={fieldErrors.address} />
              </div>
            </div>
          </div>

          {/* ── Section 2: Guardian Details ──────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>02.</span> Parent / Guardian Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">
                  Parent / Guardian Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  onKeyDown={handleNameKeyDown}
                  className="form-input"
                  placeholder="Richard Doe"
                  style={inputStyle(fieldErrors.parentName)}
                />
                <FieldError msg={fieldErrors.parentName} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Parent Contact Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  onKeyDown={handlePhoneKeyDown}
                  className="form-input"
                  placeholder="9876543211"
                  maxLength={15}
                  style={inputStyle(fieldErrors.parentPhone)}
                />
                <FieldError msg={fieldErrors.parentPhone} />
              </div>
            </div>
          </div>

          {/* ── Section 3: Department Preference ────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>03.</span> Department Preference
            </h3>

            <div className="form-group">
              <label className="form-label">
                Select Engineering Branch <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {loadingDepts ? (
                <div className="skeleton" style={{ height: '45px', width: '100%' }} />
              ) : (
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                  className="form-select"
                  style={inputStyle(fieldErrors.departmentId)}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
              <FieldError msg={fieldErrors.departmentId} />
            </div>
          </div>

          {/* ── Section 4: Document Uploads ──────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>04.</span> Upload Documents
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              * Only PDF, PNG, JPG, JPEG formats allowed. Maximum 5 MB per document.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {['marksheet10', 'marksheet12', 'idProof'].map((field) => {
                const labelText =
                  field === 'marksheet10'
                    ? '10th Marksheet'
                    : field === 'marksheet12'
                    ? '12th Marksheet'
                    : 'Government ID Proof';
                const fileSet = files[field];
                const preview = previews[field];
                const hasErr = !!fieldErrors[field];

                return (
                  <div key={field}>
                    <div
                      style={{
                        border: `2px dashed ${hasErr ? '#ef4444' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '20px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        position: 'relative',
                        backgroundColor: hasErr ? 'rgba(239,68,68,0.03)' : 'transparent',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <input
                        type="file"
                        name={field}
                        id={`file-${field}`}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".pdf,.png,.jpg,.jpeg"
                      />

                      {fileSet ? (
                        <>
                          {preview === 'pdf' ? (
                            <div
                              style={{
                                padding: '16px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(37,99,235,0.08)',
                                color: 'var(--color-royal)',
                              }}
                            >
                              <FileCheck size={28} />
                            </div>
                          ) : (
                            <img
                              src={preview}
                              alt="preview"
                              style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                          )}
                          <span
                            style={{
                              fontSize: '12px', fontWeight: '600',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              width: '90%', overflow: 'hidden',
                            }}
                          >
                            {fileSet.name}
                          </span>
                          <label
                            htmlFor={`file-${field}`}
                            style={{ fontSize: '11px', color: 'var(--color-royal)', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Change File
                          </label>
                        </>
                      ) : (
                        <>
                          <div style={{ color: hasErr ? '#ef4444' : 'var(--text-muted)' }}>
                            <Upload size={28} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{labelText}</span>
                          <label
                            htmlFor={`file-${field}`}
                            className="btn-ripple btn-secondary"
                            style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Upload
                          </label>
                        </>
                      )}
                    </div>
                    <FieldError msg={fieldErrors[field]} />
                  </div>
                );
              })}
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '10px 0' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="assurance" 
              checked={agreed} 
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (fieldErrors.agreed) setFieldErrors(prev => ({ ...prev, agreed: '' }));
              }}
              style={{ marginTop: '4px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="assurance" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                i hereby assure the above details is correct and accurate
              </label>
              <FieldError msg={fieldErrors.agreed} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-ripple btn-primary"
            disabled={submitting}
            style={{
              padding: '16px 30px',
              fontSize: '16px',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <>
                <div
                  style={{
                    width: '20px', height: '20px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    animation: 'pulse-glow 1s linear infinite',
                  }}
                />
                Submitting Application...
              </>
            ) : (
              'Submit Admission Form'
            )}
          </button>
        </form>
      </div>

      <SuccessModal
        isOpen={isSuccessOpen}
        applicationId={applicationId}
        onClose={() => {
          setIsSuccessOpen(false);
          window.location.href = `/track?id=${applicationId}`;
        }}
      />
    </div>
  );
}
