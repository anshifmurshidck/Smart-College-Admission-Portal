import os
import re
import json
from flask import Blueprint, request, jsonify
import requests
from api.backend.db import db
from api.backend.middlewares.auth import token_required

chatbot_bp = Blueprint('chatbot', __name__)

# Global session cache to track the last accessed ID per admin to enable contextual follow-up questions
# Maps admin_id -> {"id": str, "type": "student"|"application"}
last_searched_id = {}

def get_document_url(file_path):
    """
    Constructs a download URL for documents. Supports Supabase Storage if configured, 
    otherwise falls back to serving files locally from the Flask uploads directory.
    """
    if not file_path:
        return ""
    if file_path.startswith("http://") or file_path.startswith("https://"):
        return file_path
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_bucket = os.getenv("SUPABASE_BUCKET", "documents")
    
    if supabase_url:
        base_url = supabase_url.strip().rstrip('/')
        cleaned_path = file_path.replace("uploads/", "")
        return f"{base_url}/storage/v1/object/public/{supabase_bucket}/{cleaned_path}"
    
    server_port = os.getenv("PORT", "5000")
    return f"http://localhost:{server_port}/{file_path}"

def call_gemini(prompt, system_instruction=None, json_mode=False):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print('[GEMINI] GEMINI_API_KEY not found in environment. Check backend/.env and restart the server.')
        return {"error": "Gemini API key is not configured. Please add GEMINI_API_KEY=your_key to the backend/.env file and restart the backend."}
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.0}
        }
        if system_instruction:
            payload["system_instruction"] = {"parts": [{"text": system_instruction}]}
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"
            
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return {"text": text}

        raise Exception(f"{res.status_code} - {res.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[GEMINI ERROR]: {e}")
        error_msg = str(e)
        if "429" in error_msg or "quota" in error_msg.lower():
            return {"error": "Google Gemini API rate limit or quota exceeded. Please try again in a few seconds."}
        return {"error": "Gemini API unavailable or misconfigured."}

def extract_intent_and_id(message, history_str, admin_id):
    """
    Uses Gemini to extract user intent, referenced student/application IDs, or general topics.
    Fails back to regex parsing if Gemini is unconfigured or errors.
    """
    system_prompt = (
        "You are a parser AI for the TMEC Student Database. "
        "Analyze the user message and previous message summaries to extract intent and entity IDs.\n\n"
        "DATABASE SCHEMA:\n"
        "- departments (id INT, name VARCHAR, code VARCHAR)\n"
        "- applications (id VARCHAR, full_name VARCHAR, email VARCHAR, phone VARCHAR, address TEXT, dob DATE, gender VARCHAR, parent_name VARCHAR, department_id INT, aadhaar_number VARCHAR, state VARCHAR, tenth_percentage DECIMAL, twelfth_percentage DECIMAL, status VARCHAR, assigned_student_id VARCHAR, created_at TIMESTAMP)\n"
        "- documents (id INT, application_id VARCHAR, document_type VARCHAR)\n\n"
        "Your output must be a clean JSON object containing:\n"
        "1. 'intent': one of 'student_lookup', 'sql_generation', 'greeting', 'unclear', or 'general'\n"
        "2. 'target_id': the extracted Student ID, Name, Email, or Application ID (e.g. 'TMEC-2026-0042', 'Anusha', 'John') or null if not mentioned\n"
        "3. 'entity_type': 'student' or null\n"
        "4. 'sql_query': if intent is 'sql_generation', provide a valid read-only MySQL/SQLite query to answer the user's question based on the schema. Otherwise, null.\n\n"
        "INTENT RULES:\n"
        "- For specific student lookups ('Show student John', 'Find STU-2026-1234'), use 'student_lookup'.\n"
        "- For ANY analytics, statistics, reports, counts, or dynamic queries ('How many AI/ML students?', 'Duplicate emails?', 'Admissions today?'), use 'sql_generation'.\n"
        "- For 'sql_generation', ensure the SQL is optimized and uses the correct columns (e.g. status='Approved', department_id joins, COUNT(*), etc).\n\n"
        "Examples:\n"
        "- 'Show student TMEC-2026-0021' -> {\"intent\": \"student_lookup\", \"target_id\": \"TMEC-2026-0021\", \"entity_type\": \"student\", \"sql_query\": null}\n"
        "- 'How many students in CSE?' -> {\"intent\": \"sql_generation\", \"target_id\": null, \"entity_type\": null, \"sql_query\": \"SELECT COUNT(*) FROM applications a JOIN departments d ON a.department_id = d.id WHERE d.code = 'CSE' AND a.status = 'Approved'\"}\n"
        "- 'Hello' -> {\"intent\": \"greeting\", \"target_id\": null, \"entity_type\": null, \"sql_query\": null}\n"
        "If the user input makes absolutely no sense or is too vague, use 'unclear'.\n"
        "Return ONLY valid JSON. Do not include markdown code block syntax around the JSON."
    )
    
    prompt = f"Previous chat state summary:\n{history_str}\n\nUser Message: \"{message}\"\n\nJSON Output:"
    
    res = call_gemini(prompt, system_instruction=system_prompt, json_mode=True)
    
    if "error" in res:
        print("[CHAT BOT] Gemini extractor unavailable, running regex fallback.")
        fallback = run_regex_fallback(message, admin_id)
        fallback["gemini_used"] = False
        return fallback
    
    try:
        data = json.loads(res["text"].strip())
        data["gemini_used"] = True
        return data
    except Exception as e:
        print(f"[CHAT BOT] Failed parsing JSON from Gemini: {e}. Running regex fallback.")
        fallback = run_regex_fallback(message, admin_id)
        fallback["gemini_used"] = False
        return fallback

def run_regex_fallback(message, admin_id):
    """
    Lightweight regex parser to extract IDs and guess intent if Gemini is offline/unconfigured.
    """
    # 1. Check for Student ID / Application ID
    id_pattern = r'(TMEC-\d{4}-\d{4}|\bSTU-\d{4}-\d{4}\b|\bST\d{3,4}\b|\bAPP-\d{4}-\d{4}\b)'
    id_match = re.search(id_pattern, message, re.IGNORECASE)
    if id_match:
        return {"intent": "student_lookup", "target_id": id_match.group(1), "entity_type": "student"}
        
    # 2. Check for Email address
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, message)
    if email_match:
        return {"intent": "student_lookup", "target_id": email_match.group(0), "entity_type": "student"}

    # Check for department lists
    dept_patterns = {
        "CSE": r'\b(cse|computer science)\b',
        "AIML": r'\b(aiml|artificial intelligence|machine learning)\b',
        "ECE": r'\b(ece|electronics|communication)\b',
        "ME": r'\b(me|mechanical|mech)\b',
        "CE": r'\b(ce|civil)\b'
    }
    
    msg_lower = message.lower()
    for dept_code, pattern in dept_patterns.items():
        if re.search(pattern, msg_lower):
            return {"intent": "department_list", "target_id": dept_code, "entity_type": "department"}

    # 3. Check for Insights intent
    insights_keywords = ['pending', 'approved', 'enrolled', 'insight', 'analytics', 'statistics', 'count', 'average', 'marks', 'percentage', 'how many', 'total']
    is_insights = any(kw in message.lower() for kw in insights_keywords)
    if is_insights:
        return {"intent": "insights", "target_id": None, "entity_type": None}
        
    # 4. Check if message is a name or word (fallback to student search)
    # Check for greetings
    msg_lower = message.lower().strip()
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'start', 'help', 'menu', 'welcome']
    if any(msg_lower == g for g in greetings) or msg_lower.startswith('hi ') or msg_lower.startswith('hello '):
        return {"intent": "greeting", "target_id": None, "entity_type": None}
        
    # Check for "show/find student X"
    name_match = re.search(r'\b(?:show|find|search for)\s+(?:student\s+)?([a-zA-Z]+)\b', message, re.IGNORECASE)
    if name_match:
        return {"intent": "student_lookup", "target_id": name_match.group(1), "entity_type": "student"}

    clean_msg = message.strip()
    if len(clean_msg) > 2 and " " not in clean_msg:
        # Single word query like "vaasu" or "Rohan"
        return {"intent": "student_lookup", "target_id": clean_msg, "entity_type": "student"}

    cached = last_searched_id.get(admin_id)
    if cached:
        return {
            "intent": "student_lookup",
            "target_id": cached["id"],
            "entity_type": "student"
        }
        
    return {"intent": "general", "target_id": None, "entity_type": None}

def find_student(target_id):
    """Fuzzy searches for student profiles by Student ID, email, phone, or name in the database. Returns a list of matches."""
    if not target_id:
        return []
    cleaned = target_id.strip()
    
    # 1. Match by Student ID or Application ID
    student = db.execute_read_one(
        """SELECT a.*, d.name as department_name, d.code as department_code 
           FROM applications a 
           JOIN departments d ON a.department_id = d.id 
           WHERE (a.assigned_student_id = %s OR a.id = %s) AND a.status = 'Approved'""",
        (cleaned, cleaned)
    )
    if student:
        return [student]
    
    # 2. Match by Email
    if "@" in cleaned:
        student = db.execute_read_one(
            """SELECT a.*, d.name as department_name, d.code as department_code 
               FROM applications a 
               JOIN departments d ON a.department_id = d.id 
               WHERE LOWER(a.email) = LOWER(%s) AND a.status = 'Approved'""",
            (cleaned,)
        )
        if student:
            return [student]

    # 3. Match by Phone Number
    digits = "".join(filter(str.isdigit, cleaned))
    if len(digits) >= 10:
        student = db.execute_read_one(
            """SELECT a.*, d.name as department_name, d.code as department_code 
               FROM applications a 
               JOIN departments d ON a.department_id = d.id 
               WHERE a.phone LIKE %s AND a.status = 'Approved'""",
            (f"%{digits}%",)
        )
        if student:
            return [student]

    # 4. Fuzzy Match by Name (or part of name) - RETURN ALL MATCHES
    students = db.execute_read(
        """SELECT a.*, d.name as department_name, d.code as department_code 
           FROM applications a 
           JOIN departments d ON a.department_id = d.id 
           WHERE LOWER(a.full_name) LIKE LOWER(%s) AND a.status = 'Approved'""",
            (f"%{cleaned}%",)
    )
    if students and len(students) > 0:
        return students
        
    # 5. Match without "TMEC-" or "APP-" prefix
    cleaned_alt = cleaned.lower().replace("tmec-", "").replace("app-", "")
    student = db.execute_read_one(
        """SELECT a.*, d.name as department_name, d.code as department_code 
           FROM applications a 
           JOIN departments d ON a.department_id = d.id 
           WHERE (a.assigned_student_id LIKE %s OR a.id LIKE %s) AND a.status = 'Approved'""",
        (f"%{cleaned_alt}%", f"%{cleaned_alt}%")
    )
    if student:
        return [student]
            
    return []

def get_student_details_context(student):
    """Compiles all database records associated with a student/application into a JSON context dictionary."""
    app_id = student['id']
    docs = db.execute_read("SELECT id, document_type, file_path, uploaded_at FROM documents WHERE application_id = %s", (app_id,))
    
    formatted_docs = []
    for doc in docs:
        formatted_docs.append({
            "document_type": doc["document_type"],
            "uploaded_at": str(doc["uploaded_at"]),
            "download_url": get_document_url(doc["file_path"])
        })
        
    return {
        "context_type": "student_profile",
        "student": {
            "student_id": student["assigned_student_id"],
            "application_id": student["id"],
            "full_name": student["full_name"],
            "email": student["email"],
            "phone": student["phone"],
            "address": student["address"],
            "dob": str(student["dob"]),
            "gender": student["gender"],
            "parent_name": student["parent_name"],
            "parent_phone": student["parent_phone"],
            "department": student["department_name"],
            "department_code": student["department_code"],
            "enroll_date": str(student["updated_at"]),
            "aadhaar_number": student.get("aadhaar_number"),
            "state": student.get("state"),
            "tenth_percentage": student.get("tenth_percentage"),
            "twelfth_percentage": student.get("twelfth_percentage")
        },
        "documents": formatted_docs
    }

def get_student_insights_context():
    """Queries various stats from database to provide system reports context."""
    total = db.execute_read_one("SELECT COUNT(*) as count FROM applications WHERE status = 'Approved'")['count']
    
    # Calculate average percentages safely
    avg_stats = db.execute_read_one(
        """SELECT AVG(tenth_percentage) as tenth_avg, AVG(twelfth_percentage) as twelfth_avg 
           FROM applications WHERE status = 'Approved'"""
    )
    
    dept_stats = db.execute_read(
        """SELECT d.name, d.code, COUNT(a.id) as count 
           FROM departments d 
           LEFT JOIN applications a ON a.department_id = d.id AND a.status = 'Approved'
           GROUP BY d.id
           ORDER BY count DESC"""
    )
    
    gender_stats = db.execute_read(
        """SELECT gender, COUNT(*) as count 
           FROM applications 
           WHERE status = 'Approved'
           GROUP BY gender"""
    )
    
    state_stats = db.execute_read(
        """SELECT state, COUNT(*) as count 
           FROM applications 
           WHERE status = 'Approved' AND state IS NOT NULL
           GROUP BY state
           ORDER BY count DESC
           LIMIT 5"""
    )
    
    return {
        "context_type": "student_database_insights",
        "stats": {
            "total_enrolled_students": total,
            "average_tenth_percentage": round(float(avg_stats['tenth_avg']), 2) if avg_stats and avg_stats.get('tenth_avg') is not None else 0.0,
            "average_twelfth_percentage": round(float(avg_stats['twelfth_avg']), 2) if avg_stats and avg_stats.get('twelfth_avg') is not None else 0.0,
        },
        "department_distribution": dept_stats,
        "gender_distribution": gender_stats,
        "state_distribution": state_stats
    }

def get_general_context():
    """Returns general system data when no specific student is targeted."""
    depts = db.execute_read("SELECT name, code, head_of_department, email, phone FROM departments")
    total_students = db.execute_read_one("SELECT COUNT(*) as count FROM applications WHERE status = 'Approved'")['count']
    return {
        "context_type": "general_student_database_info",
        "departments": depts,
        "total_enrolled_students": total_students,
        "college_name": "Thought Minds Engineering College (TMEC)"
    }


@chatbot_bp.route('/chat', methods=['POST'])
@token_required()
def admin_chat(current_user):
    """
    Accepts messages, resolves student context, calls Gemini to formulate
    responses in natural language, and returns UI metadata when specific records are matched.
    """
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        history = data.get('history', [])
        
        if not message:
            return jsonify({"reply": "I'm listening. How can I help you query the student database?"}), 400
        
        admin_id = current_user['id']
        
        # 1. Compile chat history text to assist intent parsing
        history_summary = []
        for h in history[-6:]:
            role = "admin" if h.get("sender") == "user" or h.get("role") == "user" else "chatbot"
            text = h.get("text") or h.get("content") or ""
            if not text and isinstance(h.get("parts"), list) and h.get("parts"):
                first_part = h.get("parts")[0]
                if isinstance(first_part, str):
                    text = first_part
                elif isinstance(first_part, dict):
                    text = first_part.get("text") or first_part.get("content") or ""
            history_summary.append(f"{role}: {text}")
        history_str = "\n".join(history_summary)
        
        # 2. Extract Intent and Target ID using Gemini (or regex fallback)
        extraction = extract_intent_and_id(message, history_str, admin_id)
        intent = extraction.get("intent", "general")
        target_id = extraction.get("target_id")
        
        # 3. State resolution for follow-up contextual queries
        if not target_id:
            if intent not in ["general", "insights", "department_list"]:
                cached = last_searched_id.get(admin_id)
                if cached:
                    target_id = cached.get("id")
        else:
            if intent == "student_lookup":
                last_searched_id[admin_id] = {"id": target_id}
            
        # 4. Fetch Database Context based on Resolved Intent
        db_context = None
        ui_metadata = None
        is_gemini = extraction.get("gemini_used", False)
        
        if intent == "greeting":
            return jsonify({
                "reply": "Hello! Welcome to the Smart College Admission Portal. How can I help you today?",
                "metadata": None,
                "gemini_active": is_gemini
            }), 200
            
        if intent == "unclear":
            return jsonify({
                "reply": "I didn't quite catch that. Here are some examples of what you can ask me:\n\n- Search by Student ID (e.g. Find ST12345)\n- Search by Application ID (e.g. Search application 20250015)\n- Search by Email (e.g. Search by email)\n- Search by Student Code\n- Search by Student Name (e.g. Show student Anusha)",
                "metadata": None,
                "gemini_active": is_gemini
            }), 200
        
        if intent == "department_list":
            dept_code = target_id
            students_list = db.execute_read(
                """SELECT a.assigned_student_id, a.full_name, a.email, a.phone, d.code as department_code 
                   FROM applications a 
                   JOIN departments d ON a.department_id = d.id 
                   WHERE d.code = %s AND a.status = 'Approved'""",
                (dept_code,)
            )
            db_context = {
                "context_type": "department_students_list",
                "department_code": dept_code,
                "students": students_list
            }
            
        elif target_id:
            students_found = find_student(target_id)
            if not students_found:
                return jsonify({
                    "reply": "No matching student was found. Please verify the Student ID, Application ID, Email, Student Code, or Name.",
                    "metadata": None,
                    "gemini_active": is_gemini
                }), 200
                
            if len(students_found) == 1:
                student = students_found[0]
                last_searched_id[admin_id] = {"id": student["assigned_student_id"]}
                db_context = get_student_details_context(student)
                
                # Attach UI Card metadata
                ui_metadata = {
                    "type": "student",
                    "id": student["assigned_student_id"] or student["id"],
                    "details": {
                        "name": student["full_name"],
                        "email": student["email"],
                        "phone": student["phone"],
                        "department": student["department_name"],
                        "status": "Enrolled",
                        "photo_url": None
                    }
                }
            else:
                db_context = {
                    "context_type": "multiple_students_found",
                    "searched_id": target_id,
                    "students": students_found
                }
                
        elif intent == "sql_generation":
            sql_query = extraction.get("sql_query")
            if sql_query and sql_query.strip().lower().startswith("select"):
                try:
                    # Execute read-only generated SQL
                    query_results = db.execute_read(sql_query)
                    db_context = {
                        "context_type": "sql_results",
                        "sql_query": sql_query,
                        "query_results": query_results
                    }
                except Exception as e:
                    print(f"[SQL GENERATION ERROR] {e}")
                    db_context = {
                        "context_type": "sql_error",
                        "error": str(e)
                    }
            else:
                # Fallback if no valid SQL generated
                db_context = get_student_insights_context()
                
        elif intent == "insights":
            db_context = get_student_insights_context()
            
        else:
            db_context = get_general_context()
            
        # 5. Formulate final natural-language response using Gemini
        system_instruction = (
            "You are the TMEC Student Database AI Assistant.\n"
            "You help administrators query enrolled student profiles, academic percentages, and statistics.\n\n"
            "Format your reply using professional natural language and clean markdown. "
            "Use bullet points, tables, bold text, or highlights where suitable.\n"
            "If the context type is 'sql_results', format the data beautifully into tables, lists, or summary statistics. Act like ChatGPT. Answer the user's specific question precisely.\n"
            "Always keep responses concise, accurate, and secure. Do not disclose internal system queries or security key details."
        )
        
        prompt = (
            f"Database JSON Context:\n{json.dumps(db_context, indent=2, default=str)}\n\n"
            f"User's Question: \"{message}\"\n\n"
            "Formulate your response using the provided database context. "
            "If the context shows multiple students were found for a name search, list them clearly with their Name, Student ID, Application ID, Department, and Admission Status so the user can choose which one they meant.\n"
            "If the context shows the requested record was not found, politely let the user know and prompt for a valid student ID.\n"
            "If the context is 'sql_error', politely say that you couldn't compute that specific statistic right now."
        )
        
        gemini_res = call_gemini(prompt, system_instruction=system_instruction)
        
        if "error" in gemini_res:
            reply_text = (
                f"### System Message ({gemini_res.get('error', 'Gemini API Error')})\n\n"
                f"I resolved your query to intent `{intent}` and searched the database.\n\n"
                f"**Database Result Summary:**\n"
            )
            if db_context and db_context.get("context_type") == "student_profile":
                stud_info = db_context["student"]
                msg_lower = message.lower()
                
                # Check for specific questions
                if "aadhaar" in msg_lower or "aadhar" in msg_lower:
                    reply_text += f"The **Aadhaar Number** of **{stud_info['full_name']}** is `{stud_info.get('aadhaar_number') or 'N/A'}`."
                elif "parent" in msg_lower or "father" in msg_lower or "mother" in msg_lower:
                    reply_text += f"The **Parent Name** of **{stud_info['full_name']}** is **{stud_info['parent_name']}** and their contact number is `{stud_info['parent_phone']}`."
                elif ("phone" in msg_lower or "mobile" in msg_lower or "contact" in msg_lower) and ("what" in msg_lower or "show" in msg_lower or "get" in msg_lower or "?" in msg_lower or "tell" in msg_lower or "number" in msg_lower):
                    reply_text += f"The **Phone Number** of **{stud_info['full_name']}** is `{stud_info['phone']}` (Parent Contact: `{stud_info['parent_phone']}`)."
                elif "address" in msg_lower or "live" in msg_lower or "house" in msg_lower or "residence" in msg_lower:
                    reply_text += f"The **Address** of **{stud_info['full_name']}** is:\n> {stud_info['address']}"
                elif "state" in msg_lower or "from" in msg_lower:
                    reply_text += f"**{stud_info['full_name']}** is from the state of **{stud_info.get('state') or 'N/A'}**."
                elif "dob" in msg_lower or "birth" in msg_lower or "birthday" in msg_lower or "age" in msg_lower:
                    reply_text += f"The **Date of Birth** of **{stud_info['full_name']}** is `{stud_info['dob']}`."
                elif "gender" in msg_lower or "sex" in msg_lower:
                    reply_text += f"The **Gender** of **{stud_info['full_name']}** is **{stud_info['gender']}**."
                elif "10th" in msg_lower or "tenth" in msg_lower:
                    reply_text += f"The **10th Percentage** of **{stud_info['full_name']}** is **{stud_info.get('tenth_percentage') or 'N/A'}%**."
                elif "12th" in msg_lower or "twelfth" in msg_lower:
                    reply_text += f"The **12th Percentage** of **{stud_info['full_name']}** is **{stud_info.get('twelfth_percentage') or 'N/A'}%**."
                elif "department" in msg_lower or "dept" in msg_lower or "course" in msg_lower or "branch" in msg_lower:
                    reply_text += f"**{stud_info['full_name']}** is enrolled in the **{stud_info['department']}** ({stud_info['department_code']}) department."
                elif ("email" in msg_lower or "mail" in msg_lower) and ("what" in msg_lower or "show" in msg_lower or "get" in msg_lower or "?" in msg_lower or "tell" in msg_lower or "address" in msg_lower):
                    reply_text += f"The **Email Address** of **{stud_info['full_name']}** is `{stud_info['email']}`."
                else:
                    # Return the full list/table of details
                    reply_text += (
                        f"Here is the complete student profile details for **{stud_info['full_name']}**:\n\n"
                        f"| Field | Detail |\n"
                        f"| :--- | :--- |\n"
                        f"| **Student ID** | `{stud_info['student_id'] or 'N/A'}` |\n"
                        f"| **Application ID** | `{stud_info['application_id'] or 'N/A'}` |\n"
                        f"| **Full Name** | **{stud_info['full_name']}** |\n"
                        f"| **Email** | `{stud_info['email']}` |\n"
                        f"| **Phone** | `{stud_info['phone']}` |\n"
                        f"| **Date of Birth** | `{stud_info['dob']}` |\n"
                        f"| **Gender** | {stud_info['gender']} |\n"
                        f"| **Aadhaar Number** | `{stud_info.get('aadhaar_number') or 'N/A'}` |\n"
                        f"| **State** | **{stud_info.get('state') or 'N/A'}** |\n"
                        f"| **Address** | {stud_info['address']} |\n"
                        f"| **Parent Name** | {stud_info['parent_name']} |\n"
                        f"| **Parent Contact** | `{stud_info['parent_phone']}` |\n"
                        f"| **Department** | {stud_info['department']} ({stud_info['department_code']}) |\n"
                        f"| **10th Score** | {stud_info.get('tenth_percentage') or 'N/A'}% |\n"
                        f"| **12th Score** | {stud_info.get('twelfth_percentage') or 'N/A'}% |\n"
                    )
            elif db_context and db_context.get("context_type") == "multiple_students_found":
                students = db_context["students"]
                reply_text += f"I found multiple students matching **{db_context['searched_id']}**. Please specify which one you meant:\n\n"
                for s in students:
                    reply_text += f"- **{s['full_name']}** (ID: `{s['assigned_student_id']}`, App: `{s['id']}`, Dept: {s['department_code']}, Status: {s['status']})\n"
            elif db_context and db_context.get("context_type") == "department_students_list":
                students = db_context["students"]
                dept_code = db_context["department_code"]
                if not students:
                    reply_text += f"There are currently no enrolled students in the **{dept_code}** department."
                else:
                    reply_text += f"Here are the enrolled students in the **{dept_code}** department ({len(students)} total):\n\n"
                    reply_text += "| Student ID | Full Name | Email | Phone |\n"
                    reply_text += "| :--- | :--- | :--- | :--- |\n"
                    for s in students:
                        reply_text += f"| `{s['assigned_student_id']}` | **{s['full_name']}** | `{s['email']}` | `{s['phone']}` |\n"
            elif db_context and db_context.get("context_type") == "student_database_insights":
                stats = db_context["stats"]
                depts = db_context["department_distribution"]
                
                reply_text += (
                    f"### Student Database Insights\n\n"
                    f"- **Total Enrolled Students:** {stats['total_enrolled_students']}\n"
                    f"- **Average 10th Score:** {stats['average_tenth_percentage'] or '0.0'}%\n"
                    f"- **Average 12th Score:** {stats['average_twelfth_percentage'] or '0.0'}%\n\n"
                    f"#### Department Distribution:\n"
                )
                reply_text += "| Department | Enrolled Students |\n"
                reply_text += "| :--- | :--- |\n"
                for d in depts:
                    reply_text += f"| {d['name']} ({d['code']}) | {d['count']} |\n"
            elif db_context and db_context.get("context_type") == "general_student_database_info":
                depts = db_context["departments"]
                total = db_context["total_enrolled_students"]
                
                reply_text += (
                    f"Welcome to the **{db_context['college_name']}** Database Assistant! "
                    f"Currently, there are **{total}** enrolled students in the database.\n\n"
                    f"You can query the database by asking:\n"
                    f"- A student's ID, Email or Name (e.g., `vasu@gmail.com` or `Sneha Iyer`)\n"
                    f"- A department student list (e.g., `civil engineering students list`)\n"
                    f"- Database statistics (e.g., `show student stats` or `average 12th score`)\n\n"
                    f"#### Departments Overview:\n"
                )
                reply_text += "| Department | Code | Head of Department |\n"
                reply_text += "| :--- | :--- | :--- |\n"
                for d in depts:
                    reply_text += f"| {d['name']} | `{d['code']}` | {d['head_of_department'] or 'N/A'} |\n"
            elif db_context and db_context.get("context_type") == "sql_results":
                results = db_context["query_results"]
                reply_text += f"**Dynamic Query Executed:** `{db_context['sql_query']}`\n\n"
                if not results:
                    reply_text += "No records found matching your criteria."
                else:
                    if len(results) == 1 and len(results[0]) == 1:
                        # Single value
                        val = list(results[0].values())[0]
                        reply_text += f"**Result:** {val}"
                    else:
                        headers = list(results[0].keys())
                        reply_text += "| " + " | ".join([str(h).replace("_", " ").title() for h in headers]) + " |\n"
                        reply_text += "| " + " | ".join([":---"] * len(headers)) + " |\n"
                        for row in results[:50]:
                            row_vals = [str(row[h]) for h in headers]
                            reply_text += "| " + " | ".join(row_vals) + " |\n"
                        if len(results) > 50:
                            reply_text += "\n*(Showing first 50 rows)*\n"
            elif db_context and db_context.get("context_type") == "sql_error":
                reply_text += f"I attempted to compute that but encountered a database error: `{db_context['error']}`"
            else:
                reply_text += f"No matching student records found. Try searching with a specific Student ID."
                
            return jsonify({
                "reply": reply_text,
                "metadata": ui_metadata,
                "gemini_active": is_gemini
            }), 200
            
        return jsonify({
            "reply": gemini_res["text"],
            "metadata": ui_metadata,
            "gemini_active": True
        }), 200
        
    except Exception as e:
        print(f"[CHAT ROUTE ERROR]: {e}")
        return jsonify({"reply": "An error occurred while processing the chat query.", "error": str(e)}), 500
