import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Upload, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import SuccessModal from '../components/SuccessModal';
import { supabase } from '../lib/supabase';

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

export default function Apply() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialDept = queryParams.get('dept') || '';

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneCountryCode: '+91',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    parentName: '',
    parentPhoneCountryCode: '+91',
    parentPhone: '',
    departmentId: initialDept,
    tenthPercentage: '',
    tenthTotalMarks: '',
    tenthMaxMarks: '',
    twelfthPercentage: '',
    twelfthTotalMarks: '',
    twelfthMaxMarks: '',
    aadhaarNumber: '',
    state: ''
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
  const [ocrResult, setOcrResult] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase.from('departments').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setDepartments(data);
        } else {
          throw new Error('No departments found');
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setDepartments([
          { id: 1, name: 'Computer Science Engineering' },
          { id: 2, name: 'Artificial Intelligence & Machine Learning' },
          { id: 3, name: 'Electronics & Communication Engineering' },
          { id: 4, name: 'Mechanical Engineering' },
          { id: 5, name: 'Civil Engineering' },
        ]);
      } finally {
        setLoadingDepts(false);
      }
    };
    
    fetchDepartments();
  }, []);

  // Dynamic 10th percentage calculation
  useEffect(() => {
    const tot10 = parseFloat(formData.tenthTotalMarks);
    const max10 = parseFloat(formData.tenthMaxMarks);
    if (!isNaN(tot10) && !isNaN(max10) && max10 > 0) {
      if (tot10 <= max10) {
        const pct = ((tot10 / max10) * 100).toFixed(2);
        setFormData(prev => ({ ...prev, tenthPercentage: pct }));
        if (fieldErrors.tenthPercentage) {
          setFieldErrors(prev => ({ ...prev, tenthPercentage: '' }));
        }
      }
    }
  }, [formData.tenthTotalMarks, formData.tenthMaxMarks]);

  // Dynamic 12th percentage calculation
  useEffect(() => {
    const tot12 = parseFloat(formData.twelfthTotalMarks);
    const max12 = parseFloat(formData.twelfthMaxMarks);
    if (!isNaN(tot12) && !isNaN(max12) && max12 > 0) {
      if (tot12 <= max12) {
        const pct = ((tot12 / max12) * 100).toFixed(2);
        setFormData(prev => ({ ...prev, twelfthPercentage: pct }));
        if (fieldErrors.twelfthPercentage) {
          setFieldErrors(prev => ({ ...prev, twelfthPercentage: '' }));
        }
      }
    }
  }, [formData.twelfthTotalMarks, formData.twelfthMaxMarks]);

  /* ── Input change: clear field error on edit ─────────────────────── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneCountryCode') {
      const selected = countryCodes.find(c => c.code === value);
      const maxLen = selected ? (selected.maxLength || selected.length || 15) : 15;
      setFormData((prev) => ({
        ...prev,
        phoneCountryCode: value,
        phone: prev.phone.slice(0, maxLen)
      }));
    } else if (name === 'parentPhoneCountryCode') {
      const selected = countryCodes.find(c => c.code === value);
      const maxLen = selected ? (selected.maxLength || selected.length || 15) : 15;
      setFormData((prev) => ({
        ...prev,
        parentPhoneCountryCode: value,
        parentPhone: prev.parentPhone.slice(0, maxLen)
      }));
    } else if (['tenthPercentage', 'twelfthPercentage', 'tenthTotalMarks', 'tenthMaxMarks', 'twelfthTotalMarks', 'twelfthMaxMarks'].includes(name)) {
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /* ── Blur: trim string and validate field ───────────────────────── */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (value !== trimmedValue) {
        setFormData((prev) => ({ ...prev, [name]: trimmedValue }));
      }
      
      const tempFormData = { ...formData, [name]: trimmedValue };
      const errs = buildErrors(tempFormData);
      
      setFieldErrors((prev) => ({ ...prev, [name]: errs[name] || '' }));
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

  /* ── Allow only digits in phone fields (allow + only for 'Other') ── */
  const handlePhoneKeyDown = (e, countryCode) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (
      ctrl ||
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
    )
      return;
    // Allow + only at position 0 if country code is 'Other'
    if (countryCode === 'Other' && e.key === '+' && e.target.selectionStart === 0) return;
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
  const buildErrors = (data = formData) => {
    const errs = {};
    if (!data.fullName.trim()) errs.fullName = 'Full Name is required';
    else if (/\d/.test(data.fullName)) errs.fullName = 'Name must not contain numbers';

    if (!data.email.trim()) errs.email = 'Email Address is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(data.email))
      errs.email = 'Enter a valid email address';

    // Student phone validation
    const studentCountry = countryCodes.find(c => c.code === data.phoneCountryCode);
    const cleanPhone = data.phone.trim();
    if (!cleanPhone) {
      errs.phone = 'Phone Number is required';
    } else {
      if (data.phoneCountryCode === 'Other') {
        if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
          errs.phone = 'Phone must be between 7 and 15 digits';
        }
      } else {
        if (!/^[0-9]+$/.test(cleanPhone)) {
          errs.phone = 'Phone number must contain only digits';
        } else if (studentCountry.length && cleanPhone.length !== studentCountry.length) {
          errs.phone = `Phone number must be exactly ${studentCountry.length} digits for ${studentCountry.name} (${studentCountry.code})`;
        } else if (studentCountry.minLength && (cleanPhone.length < studentCountry.minLength || cleanPhone.length > studentCountry.maxLength)) {
          errs.phone = `Phone number must be between ${studentCountry.minLength} and ${studentCountry.maxLength} digits for ${studentCountry.name} (${studentCountry.code})`;
        }
      }
    }

    if (!data.address.trim()) errs.address = 'Residential Address is required';
    else if (data.address.length > 200) errs.address = 'Address must not exceed 200 characters';
    if (!data.dob) {
      errs.dob = 'Date of Birth is required';
    } else {
      const birthDate = new Date(data.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 17) {
        errs.dob = 'You must be at least 17 years old to apply for admission';
      }
    }
    if (!data.gender) errs.gender = 'Gender is required';

    if (!data.aadhaarNumber.trim()) {
      errs.aadhaarNumber = 'Aadhaar Number is required';
    } else if (!/^\d{12}$/.test(data.aadhaarNumber)) {
      errs.aadhaarNumber = 'Aadhaar Number must be exactly 12 digits';
    }

    if (!data.state.trim()) {
      errs.state = 'State is required';
    }

    if (!data.tenthTotalMarks.toString().trim()) {
      errs.tenthTotalMarks = '10th Marks Obtained is required';
    } else {
      const tot = parseFloat(data.tenthTotalMarks);
      if (isNaN(tot) || tot < 0) {
        errs.tenthTotalMarks = 'Marks must be a positive number';
      }
    }

    if (!data.tenthMaxMarks.toString().trim()) {
      errs.tenthMaxMarks = '10th Maximum Marks is required';
    } else {
      const max = parseFloat(data.tenthMaxMarks);
      const tot = parseFloat(data.tenthTotalMarks);
      if (isNaN(max) || max <= 0) {
        errs.tenthMaxMarks = 'Max marks must be greater than 0';
      } else if (!isNaN(tot) && tot > max) {
        errs.tenthTotalMarks = 'Obtained marks cannot exceed maximum marks';
      }
    }

    if (!data.tenthPercentage.trim()) {
      errs.tenthPercentage = '10th Percentage is required';
    } else {
      const val = parseFloat(data.tenthPercentage);
      if (isNaN(val) || val < 0 || val > 100) {
        errs.tenthPercentage = 'Percentage must be between 0 and 100';
      }
    }

    if (!data.twelfthTotalMarks.toString().trim()) {
      errs.twelfthTotalMarks = '12th Marks Obtained is required';
    } else {
      const tot = parseFloat(data.twelfthTotalMarks);
      if (isNaN(tot) || tot < 0) {
        errs.twelfthTotalMarks = 'Marks must be a positive number';
      }
    }

    if (!data.twelfthMaxMarks.toString().trim()) {
      errs.twelfthMaxMarks = '12th Maximum Marks is required';
    } else {
      const max = parseFloat(data.twelfthMaxMarks);
      const tot = parseFloat(data.twelfthTotalMarks);
      if (isNaN(max) || max <= 0) {
        errs.twelfthMaxMarks = 'Max marks must be greater than 0';
      } else if (!isNaN(tot) && tot > max) {
        errs.twelfthTotalMarks = 'Obtained marks cannot exceed maximum marks';
      }
    }

    if (!data.twelfthPercentage.trim()) {
      errs.twelfthPercentage = '12th Percentage is required';
    } else {
      const val = parseFloat(data.twelfthPercentage);
      if (isNaN(val) || val < 0 || val > 100) {
        errs.twelfthPercentage = 'Percentage must be between 0 and 100';
      }
    }

    if (!data.parentName.trim()) errs.parentName = 'Parent / Guardian Name is required';
    else if (/\d/.test(data.parentName)) errs.parentName = 'Name must not contain numbers';

    // Parent phone validation
    const parentCountry = countryCodes.find(c => c.code === data.parentPhoneCountryCode);
    const cleanParentPhone = data.parentPhone.trim();
    if (!cleanParentPhone) {
      errs.parentPhone = 'Parent Contact Number is required';
    } else {
      if (data.parentPhoneCountryCode === 'Other') {
        if (!/^\+?[0-9]{7,15}$/.test(cleanParentPhone)) {
          errs.parentPhone = 'Phone must be between 7 and 15 digits';
        }
      } else {
        if (!/^[0-9]+$/.test(cleanParentPhone)) {
          errs.parentPhone = 'Phone number must contain only digits';
        } else if (parentCountry.length && cleanParentPhone.length !== parentCountry.length) {
          errs.parentPhone = `Phone number must be exactly ${parentCountry.length} digits for ${parentCountry.name} (${parentCountry.code})`;
        } else if (parentCountry.minLength && (cleanParentPhone.length < parentCountry.minLength || cleanParentPhone.length > parentCountry.maxLength)) {
          errs.parentPhone = `Phone number must be between ${parentCountry.minLength} and ${parentCountry.maxLength} digits for ${parentCountry.name} (${parentCountry.code})`;
        }
      }
    }

    if (!data.departmentId) errs.departmentId = 'Please select a department';
    if (!files.marksheet10) errs.marksheet10 = '10th Marksheet is required';
    if (!files.marksheet12) errs.marksheet12 = '12th Marksheet is required';
    if (!files.idProof) errs.idProof = 'Government ID Proof is required';
    if (!agreed) errs.agreed = 'You must assure the details are correct to submit';

    return errs;
  };

  /* ─── Submit ─────────────────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Trim all string values in formData
    const trimmedData = {};
    for (const key in formData) {
      if (typeof formData[key] === 'string') {
        trimmedData[key] = formData[key].trim();
      } else {
        trimmedData[key] = formData[key];
      }
    }
    
    setFormData(trimmedData);

    const errs = buildErrors(trimmedData);

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setErrorMsg('Please fix the highlighted fields before submitting.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return;
    }

    setFieldErrors({});
    setErrorMsg('');
    setSubmitting(true);

    const submitApplication = async () => {
      try {
        // 1. Generate unique Application ID
        const year = new Date().getFullYear();
        const random = Math.floor(1000 + Math.random() * 9000);
        const appId = `APP-${year}-${random}`;

        // 2. Call OCR Verification API
        let verified = false;
        let ocrDetails = {};
        let tActive = false;
        try {
          const ocrFormData = new FormData();
          ocrFormData.append('fullName', trimmedData.fullName);
          ocrFormData.append('aadhaarNumber', trimmedData.aadhaarNumber);
          ocrFormData.append('tenthPercentage', trimmedData.tenthPercentage);
          ocrFormData.append('tenthTotalMarks', trimmedData.tenthTotalMarks);
          ocrFormData.append('tenthMaxMarks', trimmedData.tenthMaxMarks);
          ocrFormData.append('twelfthPercentage', trimmedData.twelfthPercentage);
          ocrFormData.append('twelfthTotalMarks', trimmedData.twelfthTotalMarks);
          ocrFormData.append('twelfthMaxMarks', trimmedData.twelfthMaxMarks);
          ocrFormData.append('marksheet10', files.marksheet10);
          ocrFormData.append('marksheet12', files.marksheet12);
          ocrFormData.append('idProof', files.idProof);

          const ocrResponse = await axios.post(`${API_BASE}/admissions/verify-ocr`, ocrFormData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          verified = ocrResponse.data.verified;
          ocrDetails = ocrResponse.data.details;
          tActive = ocrResponse.data.tesseract_active;
        } catch (ocrErr) {
          console.warn('OCR verification unreachable. Defaulting to manual review.', ocrErr);
          verified = false;
          ocrDetails = {
            name_matched: false,
            aadhaar_matched: false,
            tenth_matched: false,
            twelfth_matched: false,
            error: true
          };
        }

        const finalStatus = 'Pending';
        const assignedStudentId = null;
        const ocrStatus = verified ? 'Verified' : 'Flagged';
        const ocrDetailsJson = JSON.stringify(ocrDetails);

        // Helper function for uploading to Supabase Storage
        const uploadFile = async (file, type) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${appId}/${type}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
          return data.publicUrl;
        };

        // 3. Upload Documents in Parallel
        const [marksheet10Url, marksheet12Url, idProofUrl] = await Promise.all([
          uploadFile(files.marksheet10, 'marksheet10'),
          uploadFile(files.marksheet12, 'marksheet12'),
          uploadFile(files.idProof, 'idProof')
        ]);

        const combinedPhone = trimmedData.phoneCountryCode === 'Other' ? trimmedData.phone : trimmedData.phoneCountryCode + trimmedData.phone;
        const combinedParentPhone = trimmedData.parentPhoneCountryCode === 'Other' ? trimmedData.parentPhone : trimmedData.parentPhoneCountryCode + trimmedData.parentPhone;

        // 4. Insert Application Data (try with new columns first)
        let insertPayload = {
          id: appId,
          full_name: trimmedData.fullName,
          email: trimmedData.email,
          phone: combinedPhone,
          address: trimmedData.address,
          dob: trimmedData.dob,
          gender: trimmedData.gender,
          parent_name: trimmedData.parentName,
          parent_phone: combinedParentPhone,
          department_id: parseInt(trimmedData.departmentId),
          aadhaar_number: trimmedData.aadhaarNumber,
          state: trimmedData.state,
          tenth_percentage: parseFloat(trimmedData.tenthPercentage),
          tenth_total_marks: parseFloat(trimmedData.tenthTotalMarks),
          tenth_max_marks: parseFloat(trimmedData.tenthMaxMarks),
          twelfth_percentage: parseFloat(trimmedData.twelfthPercentage),
          twelfth_total_marks: parseFloat(trimmedData.twelfthTotalMarks),
          twelfth_max_marks: parseFloat(trimmedData.twelfthMaxMarks),
          status: finalStatus,
          assigned_student_id: assignedStudentId,
          ocr_status: ocrStatus,
          ocr_details: ocrDetailsJson
        };

        let { error: appError } = await supabase.from('applications').insert([insertPayload]);
        
        if (appError) {
          // If columns don't exist in Supabase (Postgres code 42703), retry without new marks/ocr columns
          if (appError.code === '42703' || (appError.message && appError.message.includes('column'))) {
            console.log('New columns not present in Supabase applications table, retrying with default schema.');
            delete insertPayload.tenth_total_marks;
            delete insertPayload.tenth_max_marks;
            delete insertPayload.twelfth_total_marks;
            delete insertPayload.twelfth_max_marks;
            delete insertPayload.ocr_status;
            delete insertPayload.ocr_details;
            
            const { error: retryError } = await supabase.from('applications').insert([insertPayload]);
            if (retryError) throw retryError;
          } else {
            throw appError;
          }
        }

        // 5. Insert Document Records
        const { error: docsError } = await supabase.from('documents').insert([
          { application_id: appId, document_type: '10th Marksheet', file_path: marksheet10Url },
          { application_id: appId, document_type: '12th Marksheet', file_path: marksheet12Url },
          { application_id: appId, document_type: 'ID Proof', file_path: idProofUrl },
        ]);

        if (docsError) throw docsError;

        // 6. Insert Status History log
        const logComment = `OCR Pre-verification Report - Name Match: ${ocrDetails.name_matched ? 'SUCCESS' : 'FAILED'}, Aadhaar Match: ${ocrDetails.aadhaar_matched ? 'SUCCESS' : 'FAILED'}, 10th Marks Match: ${ocrDetails.tenth_matched ? 'SUCCESS' : 'FAILED'}, 12th Marks Match: ${ocrDetails.twelfth_matched ? 'SUCCESS' : 'FAILED'}`;
        
        const { error: logError } = await supabase.from('status_history').insert([{
          application_id: appId,
          status: finalStatus,
          comments: logComment
        }]);
        if (logError) throw logError;

        setOcrResult({
          verified: verified,
          studentId: assignedStudentId,
          details: ocrDetails,
          tesseractActive: tActive
        });
        setApplicationId(appId);
        setIsSuccessOpen(true);
      } catch (err) {
        console.error(err);
        setErrorMsg(err.message || 'Error submitting application to Supabase.');
        window.scrollTo({ top: 150, behavior: 'smooth' });
      } finally {
        setSubmitting(false);
      }
    };

    submitApplication();
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
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
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
                    onBlur={handleBlur}
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      name="phoneCountryCode"
                      value={formData.phoneCountryCode}
                      onChange={handleInputChange}
                      className="form-select"
                      style={{ width: '110px', flexShrink: 0 }}
                    >
                      {countryCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      onKeyDown={(e) => handlePhoneKeyDown(e, formData.phoneCountryCode)}
                      className="form-input"
                      placeholder={
                        countryCodes.find((c) => c.code === formData.phoneCountryCode)?.placeholder || 'Enter phone'
                      }
                      maxLength={
                        (() => {
                          const selected = countryCodes.find(c => c.code === formData.phoneCountryCode);
                          return selected ? (selected.maxLength || selected.length || 15) : 15;
                        })()
                      }
                      style={inputStyle(fieldErrors.phone)}
                    />
                  </div>
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
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Full Residential Address <span style={{ color: '#ef4444' }}>*</span></span>
                  <span style={{ fontSize: '11px', color: formData.address.length > 180 ? '#ef4444' : 'var(--text-muted)', fontWeight: 400 }}>
                    {formData.address.length}/200
                  </span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  rows="3"
                  className="form-textarea"
                  placeholder="Street Address, City, ZIP Code"
                  maxLength={200}
                  style={inputStyle(fieldErrors.address)}
                />
                <FieldError msg={fieldErrors.address} />
              </div>

              {/* State of Residence & Aadhaar Number */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">
                    State of Residence <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="form-select"
                    style={inputStyle(fieldErrors.state)}
                  >
                    <option value="">Select State</option>
                    {[
                      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
                      'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
                      'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
                      'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
                      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
                      'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
                      'Ladakh', 'Lakshadweep', 'Puducherry'
                    ].map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <FieldError msg={fieldErrors.state} />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Aadhaar Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                      const ctrl = e.ctrlKey || e.metaKey;
                      if (ctrl || ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
                      if (!/\d/.test(e.key)) e.preventDefault();
                    }}
                    className="form-input"
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                    style={inputStyle(fieldErrors.aadhaarNumber)}
                  />
                  <FieldError msg={fieldErrors.aadhaarNumber} />
                </div>
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
                  onBlur={handleBlur}
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    name="parentPhoneCountryCode"
                    value={formData.parentPhoneCountryCode}
                    onChange={handleInputChange}
                    className="form-select"
                    style={{ width: '110px', flexShrink: 0 }}
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={(e) => handlePhoneKeyDown(e, formData.parentPhoneCountryCode)}
                    className="form-input"
                    placeholder={
                      countryCodes.find((c) => c.code === formData.parentPhoneCountryCode)?.placeholder || 'Enter phone'
                    }
                    maxLength={
                      (() => {
                        const selected = countryCodes.find(c => c.code === formData.parentPhoneCountryCode);
                        return selected ? (selected.maxLength || selected.length || 15) : 15;
                      })()
                    }
                    style={inputStyle(fieldErrors.parentPhone)}
                  />
                </div>
                <FieldError msg={fieldErrors.parentPhone} />
              </div>
            </div>
          </div>

          {/* ── Section 3: Academic Background ────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>03.</span> Academic Background
            </h3>

            {/* 10th Grade Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">
                  10th Total Marks Obtained <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="tenthTotalMarks"
                  value={formData.tenthTotalMarks}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="e.g. 480"
                  style={inputStyle(fieldErrors.tenthTotalMarks)}
                />
                <FieldError msg={fieldErrors.tenthTotalMarks} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  10th Maximum Marks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="tenthMaxMarks"
                  value={formData.tenthMaxMarks}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="e.g. 500"
                  style={inputStyle(fieldErrors.tenthMaxMarks)}
                />
                <FieldError msg={fieldErrors.tenthMaxMarks} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  10th Grade Percentage (%)
                </label>
                <input
                  type="text"
                  name="tenthPercentage"
                  value={formData.tenthPercentage}
                  readOnly
                  disabled
                  className="form-input"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* 12th Grade Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">
                  12th Total Marks Obtained <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="twelfthTotalMarks"
                  value={formData.twelfthTotalMarks}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="e.g. 570"
                  style={inputStyle(fieldErrors.twelfthTotalMarks)}
                />
                <FieldError msg={fieldErrors.twelfthTotalMarks} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  12th Maximum Marks <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="twelfthMaxMarks"
                  value={formData.twelfthMaxMarks}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className="form-input"
                  placeholder="e.g. 600"
                  style={inputStyle(fieldErrors.twelfthMaxMarks)}
                />
                <FieldError msg={fieldErrors.twelfthMaxMarks} />
              </div>

              <div className="form-group">
                <label className="form-label">
                  12th Grade Percentage (%)
                </label>
                <input
                  type="text"
                  name="twelfthPercentage"
                  value={formData.twelfthPercentage}
                  readOnly
                  disabled
                  className="form-input"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {/* ── Section 4: Department Preference ────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>04.</span> Department Preference
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

          {/* ── Section 5: Document Uploads ──────────────────────────── */}
          <div>
            <h3
              style={{
                fontSize: '18px', fontWeight: '700',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '8px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span style={{ color: 'var(--color-royal)' }}>05.</span> Upload Documents
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
        ocrResult={ocrResult}
        onClose={() => {
          setIsSuccessOpen(false);
          window.location.href = `/track?id=${applicationId}`;
        }}
      />
    </div>
  );
}
