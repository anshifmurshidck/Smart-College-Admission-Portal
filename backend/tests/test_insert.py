import urllib.request, json, sqlite3, os
from datetime import datetime

supabase_url = os.getenv('VITE_SUPABASE_URL', 'https://evskpbbqojkclyyjvpjr.supabase.co')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs')
req = urllib.request.Request(f'{supabase_url}/rest/v1/applications', headers={'apikey': supabase_key, 'Authorization': f'Bearer {supabase_key}'})

try:
    res = urllib.request.urlopen(req)
    applications = json.loads(res.read().decode())
    
    # Initialize SQLite db
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    # Execute schema
    with open('api/backend/database/schema.sql', 'r') as f:
        conn.executescript(f.read())
        
    conn.execute("PRAGMA foreign_keys = ON")
    
    # Insert departments
    cursor.execute("""
        INSERT INTO departments (code, name, description) VALUES
        ('CSE', 'Computer Science Engineering', 'Focus on computing, programming, and software.'),
        ('AIML', 'Artificial Intelligence & Machine Learning', 'Advanced topics in AI, ML, and Data Science.'),
        ('ECE', 'Electronics & Communication Engineering', 'Hardware, communication systems, and IoT.'),
        ('ME', 'Mechanical Engineering', 'Core mechanical systems and robotics.'),
        ('CE', 'Civil Engineering', 'Infrastructure and structural engineering.')
    """)
    conn.commit()
    
    success = 0
    errors = {}
    for app in applications:
        try:
            tenth = float(app["tenth_percentage"]) if app.get("tenth_percentage") is not None else None
            twelfth = float(app["twelfth_percentage"]) if app.get("twelfth_percentage") is not None else None
            full_name = app.get("full_name") or "Unknown"
            email = app.get("email") or "no-email@example.com"
            phone = app.get("phone") or "0000000000"
            address = app.get("address") or "N/A"
            dob = app.get("dob") or "2000-01-01"
            gender = app.get("gender") or "Other"
            parent_name = app.get("parent_name") or "Unknown"
            parent_phone = app.get("parent_phone") or "0000000000"
            dept_id = app.get("department_id") or 1
            status = app.get("status") or "Pending"
            
            cursor.execute(
                """INSERT INTO applications 
                   (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, 
                    department_id, aadhaar_number, state, tenth_percentage, tenth_total_marks, tenth_max_marks, twelfth_percentage, twelfth_total_marks, twelfth_max_marks, 
                    status, assigned_student_id, ocr_status, ocr_details) 
                   VALUES 
                   (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (app["id"], full_name, email, phone, address, dob, gender,
                 parent_name, parent_phone, dept_id, app.get("aadhaar_number"),
                 app.get("state"), tenth, app.get("tenth_total_marks"), app.get("tenth_max_marks"), twelfth, app.get("twelfth_total_marks"), app.get("twelfth_max_marks"), status, app.get("assigned_student_id"), app.get("ocr_status", "Not Processed"), app.get("ocr_details"))
            )
            success += 1
        except Exception as ex:
            error_str = str(ex)
            if error_str not in errors:
                errors[error_str] = 0
            errors[error_str] += 1
            
    print(f'Total apps in Supabase: {len(applications)}')
    print(f'Successfully inserted: {success}')
    print(f'Errors: {errors}')

except Exception as e:
    print('ERR:', e)
