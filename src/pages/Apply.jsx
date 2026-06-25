import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';

export default function Apply() {
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
    departmentId: ''
  });
  
  // File States
  const [files, setFiles] = useState({
    marksheet10: null,
    marksheet12: null,
    idProof: null
  });
  
  const [previews, setPreviews] = useState({
    marksheet10: '',
    marksheet12: '',
    idProof: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    // Load departments list from API
    axios.get(`${API_BASE}/departments`)
      .then((res) => {
        setDepartments(res.data);
        setLoadingDepts(false);
      })
      .catch((err) => {
        console.error("Error loading departments: ", err);
        // Fallback static departments if server is off
        setDepartments([
          { id: 1, name: 'Computer Science Engineering' },
          { id: 2, name: 'Artificial Intelligence & Machine Learning' },
          { id: 3, name: 'Electronics & Communication Engineering' },
          { id: 4, name: 'Mechanical Engineering' },
          { id: 5, name: 'Civil Engineering' }
        ]);
        setLoadingDepts(false);
      });
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      const file = selectedFiles[0];
      
      // Limit check: 5MB
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File size of ${name} must be less than 5MB.`);
        return;
      }
      
      // Extension check
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
        setErrorMsg("Allowed formats: PDF, PNG, JPG, JPEG");
        return;
      }

      setErrorMsg('');
      setFiles((prev) => ({
        ...prev,
        [name]: file
      }));

      // Generate preview URL if it's an image
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviews((prev) => ({
          ...prev,
          [name]: url
        }));
      } else {
        setPreviews((prev) => ({
          ...prev,
          [name]: 'pdf' // Marks it as a PDF doc
        }));
      }
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full Name is required";
    if (!formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) return "Invalid Email address format";
    if (!formData.phone.match(/^\+?[0-9]{10,15}$/)) return "Invalid Phone number (10-15 digits)";
    if (!formData.address.trim()) return "Postal Address is required";
    if (!formData.dob) return "Date of Birth is required";
    if (!formData.gender) return "Gender is required";
    if (!formData.parentName.trim()) return "Parent/Guardian Name is required";
    if (!formData.parentPhone.match(/^\+?[0-9]{10,15}$/)) return "Invalid Parent Phone number";
    if (!formData.departmentId) return "Please choose a desired department";
    if (!files.marksheet10) return "Please upload your 10th Class Marksheet";
    if (!files.marksheet12) return "Please upload your 12th Class Marksheet";
    if (!files.idProof) return "Please upload your Government ID Proof";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setErrorMsg(error);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    // Prepare Multipart Form Data
    const uploadData = new FormData();
    Object.keys(formData).forEach((key) => {
      uploadData.append(key, formData[key]);
    });
    uploadData.append('marksheet10', files.marksheet10);
    uploadData.append('marksheet12', files.marksheet12);
    uploadData.append('idProof', files.idProof);

    axios.post(`${API_BASE}/admissions/apply`, uploadData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((res) => {
      setApplicationId(res.data.applicationId);
      setIsSuccessOpen(true);
      setSubmitting(false);
    })
    .catch((err) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Server connection error. Please try again later.');
      setSubmitting(false);
      window.scrollTo({ top: 150, behavior: 'smooth' });
    });
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-secondary)', fontWeight: 800 }}>
            UG Admissions Application
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Complete the form and upload the mandatory documents to submit your application.
          </p>
        </div>

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
              marginBottom: '24px'
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="glass-panel" onSubmit={handleSubmit} style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Section 1: Candidate Profile */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-royal)' }}>01.</span> Candidate Profile
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Full Name (As per High School Certificate)</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-input" placeholder="John Doe" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" placeholder="john@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" placeholder="9876543210" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-select">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Residential Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" className="form-textarea" placeholder="Street Address, City, State, ZIP Code"></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Details */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-royal)' }}>02.</span> Parent / Guardian Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Parent/Guardian Name</label>
                <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="form-input" placeholder="Richard Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Contact Number</label>
                <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleInputChange} className="form-input" placeholder="9876543211" />
              </div>
            </div>
          </div>

          {/* Section 3: Course Preference */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-royal)' }}>03.</span> Department Preference
            </h3>
            
            <div className="form-group">
              <label className="form-label">Select Engineering Branch</label>
              {loadingDepts ? (
                <div className="skeleton" style={{ height: '45px', width: '100%' }} />
              ) : (
                <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="form-select">
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Section 4: Document Uploads */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--color-royal)' }}>04.</span> Upload Documents
            </h3>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              * Only PDF, PNG, JPG, JPEG formats are allowed. Maximum size: 5MB per document.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              
              {/* File item template */}
              {['marksheet10', 'marksheet12', 'idProof'].map((field) => {
                const labelText = field === 'marksheet10' ? '10th Marksheet' : field === 'marksheet12' ? '12th Marksheet' : 'Government ID Proof';
                const fileSet = files[field];
                const preview = previews[field];
                
                return (
                  <div key={field} style={{ 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '20px', 
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative'
                  }}>
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
                          <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235,0.08)', color: 'var(--color-royal)' }}>
                            <FileCheck size={28} />
                          </div>
                        ) : (
                          <img src={preview} alt="preview" style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover' }} />
                        )}
                        <span style={{ fontSize: '12px', fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '90%', overflow: 'hidden' }}>{fileSet.name}</span>
                        <label htmlFor={`file-${field}`} style={{ fontSize: '11px', color: 'var(--color-royal)', fontWeight: '600', cursor: 'pointer' }}>Change File</label>
                      </>
                    ) : (
                      <>
                        <div style={{ color: 'var(--text-muted)' }}>
                          <Upload size={28} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{labelText}</span>
                        <label htmlFor={`file-${field}`} className="btn-ripple btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
                          Upload
                        </label>
                      </>
                    )}
                  </div>
                );
              })}

            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '10px 0' }} />

          <button 
            type="submit" 
            className="btn-ripple btn-primary"
            disabled={submitting}
            style={{ padding: '16px 30px', fontSize: '16px', display: 'flex', justifyContent: 'center', gap: '10px', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? (
              <>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', animation: 'pulse-glow 1s linear infinite' }} />
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
          // Redirect to status tracking screen
          window.location.href = `/track?id=${applicationId}`;
        }} 
      />
    </div>
  );
}
