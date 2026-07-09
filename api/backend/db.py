import os
import pymysql
import sqlite3
from api.backend.config import Config

class DatabaseManager:
    def __init__(self):
        self.is_sqlite = False
        self.connection_error = None
        self._init_db()

    def _get_raw_connection(self):
        """Attempts to connect to MySQL, falls back to SQLite if enabled."""
        if Config.FALLBACK_SQLITE and self.is_sqlite:
            return sqlite3.connect(Config.SQLITE_PATH)

        try:
            # Try MySQL connection
            conn = pymysql.connect(
                host=Config.MYSQL_HOST,
                port=Config.MYSQL_PORT,
                user=Config.MYSQL_USER,
                password=Config.MYSQL_PASSWORD,
                database=Config.MYSQL_DB,
                cursorclass=pymysql.cursors.DictCursor
            )
            self.is_sqlite = False
            return conn
        except Exception as e:
            self.connection_error = str(e)
            if Config.FALLBACK_SQLITE:
                print(f"[DB MANAGER] MySQL connection failed: {e}. Falling back to SQLite.")
                self.is_sqlite = True
                return sqlite3.connect(Config.SQLITE_PATH)
            else:
                raise e

    def _init_db(self):
        """Initializes the database schema if tables do not exist."""
        schema_path = os.path.join(os.path.dirname(__file__), "database", "schema.sql")
        if not os.path.exists(schema_path):
            print(f"[DB MANAGER] Schema file not found at {schema_path}.")
            return

        with open(schema_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        conn = self._get_raw_connection()
        try:
            if self.is_sqlite:
                # Adapt MySQL schema for SQLite
                sqlite_script = sql_script
                # 1. Remove database creation statements
                sqlite_script = sqlite_script.replace("CREATE DATABASE IF NOT EXISTS tmec_admission;", "")
                sqlite_script = sqlite_script.replace("USE tmec_admission;", "")
                # 2. Convert primary keys and auto increment
                sqlite_script = sqlite_script.replace("id INT AUTO_INCREMENT PRIMARY KEY", "id INTEGER PRIMARY KEY AUTOINCREMENT")
                sqlite_script = sqlite_script.replace("id INT AUTO_INCREMENT PRIMARY KEY", "id INTEGER PRIMARY KEY AUTOINCREMENT")
                # 3. Strip ENGINE and CHARSET
                import re
                sqlite_script = re.sub(r"ENGINE=InnoDB\s+DEFAULT\s+CHARSET=utf8mb4\s+COLLATE=utf8mb4_unicode_ci", "", sqlite_script)
                sqlite_script = re.sub(r"ENGINE=InnoDB\s+DEFAULT\s+CHARSET=utf8mb4", "", sqlite_script)
                # 4. Strip INDEX creation lines (which SQLite handles differently or doesn't need in table definition)
                # SQLite can have separate CREATE INDEX statements, but within CREATE TABLE it might error on separate INDEX lines.
                # Let's remove internal INDEX lines in CREATE TABLE
                sqlite_script = re.sub(r",\s*INDEX\s+idx_\w+\s*\([^)]+\)", "", sqlite_script)
                # 5. Fix TIMESTAMP ON UPDATE
                sqlite_script = sqlite_script.replace("ON UPDATE CURRENT_TIMESTAMP", "")
                # 6. Adapt DUPLICATE KEY UPDATE to SQLite ON CONFLICT
                sqlite_script = sqlite_script.replace("ON DUPLICATE KEY UPDATE name=name", "ON CONFLICT(name) DO UPDATE SET name=excluded.name")
                sqlite_script = sqlite_script.replace("ON DUPLICATE KEY UPDATE username=username", "ON CONFLICT(username) DO UPDATE SET username=excluded.username")
                
                # Execute split script
                cursor = conn.cursor()
                # Split statements by semicolon (simple splitter)
                statements = [stmt.strip() for stmt in sqlite_script.split(";") if stmt.strip()]
                for statement in statements:
                    try:
                        cursor.execute(statement)
                    except Exception as ex:
                        # Print statement for debugging if it fails
                        print(f"[DB MANAGER] Warning: SQLite statement failed: {statement[:100]}... Error: {ex}")
                conn.commit()
                print("[DB MANAGER] SQLite database initialized successfully.")
            else:
                # Execute MySQL script
                cursor = conn.cursor()
                # Run statements
                # Since schema.sql might create the DB, we shouldn't fail if we connect to MySQL without selecting DB first.
                statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]
                for statement in statements:
                    cursor.execute(statement)
                conn.commit()
                print("[DB MANAGER] MySQL database initialized successfully.")
        except Exception as e:
            print(f"[DB MANAGER] Error initializing database: {e}")
        finally:
            conn.close()

        # Seed admin with proper password hash after schema is ready
        self._seed_admin()

        # Sync live data from Supabase REST API
        self.sync_supabase_data()

    def _seed_admin(self):
        """Ensures default admin account exists with a proper werkzeug password hash."""
        try:
            from werkzeug.security import generate_password_hash
            username = Config.ADMIN_USERNAME
            password = Config.ADMIN_PASSWORD
            admin = self.execute_read_one("SELECT id, password_hash FROM admins WHERE username = %s", (username,))
            if not admin:
                # No admin exists for the configured username — create it.
                new_hash = generate_password_hash(password)
                self.execute_write(
                    "INSERT INTO admins (username, password_hash, email, name, role) VALUES (%s, %s, %s, %s, %s)",
                    (username, new_hash, 'admin@thoughtminds.edu', 'Super Admin', 'super_admin')
                )
                print(f"[DB MANAGER] Admin account created (username: {username}, password: {password}).")
            elif admin['password_hash'] == 'pbkdf2:sha256:600000$admin123_placeholder':
                # Replace placeholder hash with a proper hash for the configured password.
                new_hash = generate_password_hash(password)
                self.execute_write("UPDATE admins SET password_hash = %s WHERE id = %s", (new_hash, admin['id']))
                print(f"[DB MANAGER] Admin password hash initialized for {username}.")

            # Seed dummy approved students if applications table is empty
            apps_count = self.execute_read_one("SELECT COUNT(*) as count FROM applications")['count']
            if apps_count == 0:
                print("[DB MANAGER] Seeding approved student records for local database testing...")
                # Insert 3 students
                self.execute_write(
                    """INSERT INTO applications 
                       (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage, status, assigned_student_id) 
                       VALUES 
                       (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    ('APP-2026-0001', 'Arjun Mehta', 'arjun.mehta@gmail.com', '+919876543210', '123 Park Avenue, Mumbai', '2005-04-12', 'Male', 'Ramesh Mehta', '+919876543211', 1, '123456789012', 'Maharashtra', 92.50, 95.80, 'Approved', 'TMEC-2026-0001')
                )
                self.execute_write(
                    """INSERT INTO applications 
                       (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage, status, assigned_student_id) 
                       VALUES 
                       (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    ('APP-2026-0002', 'Sneha Iyer', 'sneha.iyer@yahoo.com', '+918765432109', '456 Garden Lane, Bangalore', '2006-08-24', 'Female', 'Suresh Iyer', '+918765432108', 2, '234567890123', 'Karnataka', 88.00, 91.20, 'Approved', 'TMEC-2026-0002')
                )
                self.execute_write(
                    """INSERT INTO applications 
                       (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, department_id, aadhaar_number, state, tenth_percentage, twelfth_percentage, status, assigned_student_id) 
                       VALUES 
                       (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    ('APP-2026-0003', 'Rohan Sharma', 'rohan.sharma@outlook.com', '+917654321098', '789 Hill Top, New Delhi', '2005-11-05', 'Male', 'Vijay Sharma', '+917654321097', 1, '345678901234', 'Delhi', 95.20, 89.40, 'Approved', 'TMEC-2026-0003')
                )
                print("[DB MANAGER] Seeding completed.")
        except Exception as e:
            print(f"[DB MANAGER] Admin/Student seed warning: {e}")

    def sync_supabase_data(self):
        """Fetches approved applications from Supabase REST API and syncs with the local database."""
        try:
            import requests
            # Load root .env file variables if possible
            root_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "Smart-College-Admission-Portal", ".env")
            if not os.path.exists(root_env_path):
                # Fallback to current directory root
                root_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
                
            supabase_url = None
            supabase_key = None
            
            if os.path.exists(root_env_path):
                with open(root_env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip().startswith("VITE_SUPABASE_URL="):
                            supabase_url = line.split("=", 1)[1].strip()
                        elif line.strip().startswith("VITE_SUPABASE_ANON_KEY="):
                            supabase_key = line.split("=", 1)[1].strip()
            
            if not supabase_url or not supabase_key:
                # Direct fallback check of system/config env variables
                supabase_url = os.getenv("VITE_SUPABASE_URL") or "https://evskpbbqojkclyyjvpjr.supabase.co"
                supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY") or "sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs"
                
            if not supabase_url or not supabase_key:
                print("[DB SYNC] Supabase credentials not found. Skipping sync.")
                return

            print(f"[DB SYNC] Fetching approved applications from Supabase: {supabase_url}")
            url = f"{supabase_url.rstrip('/')}/rest/v1/applications?status=eq.Approved"
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                print(f"[DB SYNC] Supabase request failed with status: {response.status_code}")
                return
                
            applications = response.json()
            print(f"[DB SYNC] Syncing {len(applications)} student records into local database...")
            
            for app in applications:
                # Upsert into applications table
                # Check if application already exists
                existing = self.execute_read_one("SELECT id FROM applications WHERE id = %s", (app["id"],))
                
                # Format decimal percentages safely
                tenth = float(app["tenth_percentage"]) if app.get("tenth_percentage") is not None else None
                twelfth = float(app["twelfth_percentage"]) if app.get("twelfth_percentage") is not None else None
                
                # Format timestamps cleanly (removing timezone suffix for standard MySQL/SQLite parse)
                created_at = app["created_at"].split(".")[0].replace("T", " ") if app.get("created_at") else None
                updated_at = app["updated_at"].split(".")[0].replace("T", " ") if app.get("updated_at") else None
                
                if existing:
                    self.execute_write(
                        """UPDATE applications SET 
                           full_name=%s, email=%s, phone=%s, address=%s, dob=%s, gender=%s, 
                           parent_name=%s, parent_phone=%s, department_id=%s, aadhaar_number=%s, 
                           state=%s, tenth_percentage=%s, tenth_total_marks=%s, tenth_max_marks=%s, twelfth_percentage=%s, twelfth_total_marks=%s, twelfth_max_marks=%s, status=%s, 
                           assigned_student_id=%s, ocr_status=%s, ocr_details=%s WHERE id=%s""",
                        (app["full_name"], app["email"], app["phone"], app["address"], app["dob"], app["gender"],
                         app["parent_name"], app["parent_phone"], app["department_id"], app.get("aadhaar_number"),
                         app.get("state"), tenth, app.get("tenth_total_marks"), app.get("tenth_max_marks"), twelfth, app.get("twelfth_total_marks"), app.get("twelfth_max_marks"), app["status"], app.get("assigned_student_id"), app.get("ocr_status", "Not Processed"), app.get("ocr_details"), app["id"])
                    )
                else:
                    self.execute_write(
                        """INSERT INTO applications 
                           (id, full_name, email, phone, address, dob, gender, parent_name, parent_phone, 
                            department_id, aadhaar_number, state, tenth_percentage, tenth_total_marks, tenth_max_marks, twelfth_percentage, twelfth_total_marks, twelfth_max_marks, 
                            status, assigned_student_id, ocr_status, ocr_details) 
                           VALUES 
                           (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (app["id"], app["full_name"], app["email"], app["phone"], app["address"], app["dob"], app["gender"],
                         app["parent_name"], app["parent_phone"], app["department_id"], app.get("aadhaar_number"),
                         app.get("state"), tenth, app.get("tenth_total_marks"), app.get("tenth_max_marks"), twelfth, app.get("twelfth_total_marks"), app.get("twelfth_max_marks"), app["status"], app.get("assigned_student_id"), app.get("ocr_status", "Not Processed"), app.get("ocr_details"))
                    )
            print("[DB SYNC] Supabase database sync completed successfully.")
        except Exception as e:
            print(f"[DB SYNC] Error syncing Supabase data: {e}")



    def execute_read(self, query, params=None):
        """Executes a SELECT query and returns rows as a list of dicts."""
        conn = self._get_raw_connection()
        try:
            if self.is_sqlite:
                # Convert %s placeholders to ? for SQLite
                query = query.replace("%s", "?")
                # SQLite returns tuples by default, convert to dict using row_factory
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
            else:
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                return cursor.fetchall()
        finally:
            conn.close()

    def execute_read_one(self, query, params=None):
        """Executes a SELECT query and returns the first row or None."""
        rows = self.execute_read(query, params)
        return rows[0] if rows else None

    def execute_write(self, query, params=None):
        """Executes an INSERT, UPDATE, or DELETE query and returns the last inserted ID or rowcount."""
        conn = self._get_raw_connection()
        try:
            if self.is_sqlite:
                query = query.replace("%s", "?")
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                conn.commit()
                return cursor.lastrowid or cursor.rowcount
            else:
                cursor = conn.cursor()
                cursor.execute(query, params or ())
                conn.commit()
                # For MySQL, return lastrowid or rowcount
                res = cursor.lastrowid or cursor.rowcount
                return res
        finally:
            conn.close()

# Singleton instance
db = DatabaseManager()
