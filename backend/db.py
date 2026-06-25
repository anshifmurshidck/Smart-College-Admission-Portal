import os
import pymysql
import sqlite3
from backend.config import Config

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
        schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "schema.sql")
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

    def _seed_admin(self):
        """Ensures default admin account has a proper werkzeug password hash."""
        try:
            from werkzeug.security import generate_password_hash
            admin = self.execute_read_one("SELECT id, password_hash FROM admins WHERE username = %s", ('admin',))
            if admin and admin['password_hash'] == 'pbkdf2:sha256:600000$admin123_placeholder':
                new_hash = generate_password_hash('admin123')
                self.execute_write("UPDATE admins SET password_hash = %s WHERE id = %s", (new_hash, admin['id']))
                print("[DB MANAGER] Default admin password hash initialized.")
        except Exception as e:
            print(f"[DB MANAGER] Admin seed warning: {e}")



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
