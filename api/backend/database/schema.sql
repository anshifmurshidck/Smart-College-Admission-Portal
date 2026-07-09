-- Thought Minds Engineering College - Database Schema
-- Target Database: MySQL

CREATE DATABASE IF NOT EXISTS tmec_admission;
USE tmec_admission;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    head_of_department VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    banner_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(20) PRIMARY KEY, -- Formatted as APP-YYYY-XXXX (e.g. APP-2026-0042)
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    aadhaar_number VARCHAR(12) DEFAULT NULL,
    state VARCHAR(100) DEFAULT NULL,
    tenth_percentage DECIMAL(5,2) DEFAULT NULL,
    tenth_total_marks DECIMAL(6,2) DEFAULT NULL,
    tenth_max_marks DECIMAL(6,2) DEFAULT NULL,
    twelfth_percentage DECIMAL(5,2) DEFAULT NULL,
    twelfth_total_marks DECIMAL(6,2) DEFAULT NULL,
    twelfth_max_marks DECIMAL(6,2) DEFAULT NULL,
    status VARCHAR(30) DEFAULT 'Pending', -- 'Pending', 'Under Verification', 'Approved', 'Rejected'
    assigned_student_id VARCHAR(20) DEFAULT NULL,
    ocr_status VARCHAR(50) DEFAULT 'Not Processed',
    ocr_details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_app_status (status),
    INDEX idx_app_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- '10th Marksheet', '12th Marksheet', 'ID Proof'
    file_path VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    INDEX idx_doc_app (application_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Students Table (Approved applications are moved here)
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(20) PRIMARY KEY, -- Formatted as TMEC-YYYY-XXXX (e.g. TMEC-2026-0042)
    application_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    department_id INT NOT NULL,
    enroll_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_student_dept (department_id),
    INDEX idx_student_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Status History Table
CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    comments TEXT,
    updated_by INT NULL, -- Can be NULL if system generated
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL, -- 'Admission', 'Student', 'Department'
    file_path VARCHAR(255) NOT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-populate Departments
INSERT INTO departments (name, code, description, head_of_department, email, phone) VALUES
('Computer Science Engineering', 'CSE', 'Department of Computer Science Engineering focuses on software, hardware design, and cutting edge computational systems.', 'Dr. Alan Turing', 'hod.cse@thoughtminds.edu', '+1-555-0101'),
('Artificial Intelligence & Machine Learning', 'AIML', 'Specialized department covering modern neural networks, machine learning algorithms, big data, and expert systems.', 'Dr. Ada Lovelace', 'hod.aiml@thoughtminds.edu', '+1-555-0102'),
('Electronics & Communication Engineering', 'ECE', 'Focuses on communication networks, signal processing, VLSI design, and microelectronics.', 'Dr. Nikola Tesla', 'hod.ece@thoughtminds.edu', '+1-555-0103'),
('Mechanical Engineering', 'ME', 'Covers thermo-dynamics, fluid mechanics, industrial robotics, and advanced mechanical systems design.', 'Dr. James Watt', 'hod.mech@thoughtminds.edu', '+1-555-0104'),
('Civil Engineering', 'CE', 'Focuses on structural design, geotechnical modeling, urban engineering, and sustainable construction.', 'Dr. Thomas Telford', 'hod.civil@thoughtminds.edu', '+1-555-0105')
ON DUPLICATE KEY UPDATE name=name;

-- Default Admin Account (password: admin123 — change after first login)
-- Hash below is werkzeug pbkdf2:sha256 placeholder, _seed_admin() in db.py will replace it on boot.
INSERT INTO admins (username, password_hash, email, name, role) VALUES
('admin', 'pbkdf2:sha256:600000$admin123_placeholder', 'admin@thoughtminds.edu', 'Super Admin', 'super_admin')
ON DUPLICATE KEY UPDATE username=username;
