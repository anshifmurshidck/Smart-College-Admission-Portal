import sys
from db import db

try:
    base_where = "1=1"
    params = []

    # 1. Summary Cards
    cards_query = f"""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN a.status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN a.status IN ('Pending', 'Under Verification') THEN 1 ELSE 0 END) as pending
        FROM applications a
        WHERE {base_where}
    """
    cards_stats = db.execute_read_one(cards_query, tuple(params))
    print("Cards:", cards_stats)
    
    # 2. Student query
    student_query = "SELECT COUNT(*) as total_students FROM students s"
    student_stats = db.execute_read_one(student_query)
    print("Students:", student_stats)

    # 3. Dept query
    dept_query = f"""
        SELECT 
            d.name, 
            d.code,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN a.status IN ('Pending', 'Under Verification') THEN 1 ELSE 0 END) as pending
        FROM departments d
        LEFT JOIN applications a ON a.department_id = d.id AND {base_where.replace('a.department_id', 'd.id')}
        GROUP BY d.id
    """
    dept_stats = db.execute_read(dept_query, tuple(params))
    print("Dept:", len(dept_stats) if dept_stats else "None")
    
    # 4. Timeline query
    date_format = "strftime('%Y-%m-%d', a.created_at)" if db.is_sqlite else "DATE(a.created_at)"
    timeline_query = f"""
        SELECT {date_format} as date, COUNT(*) as count
        FROM applications a
        WHERE {base_where}
        GROUP BY date
        ORDER BY date ASC
        LIMIT 30
    """
    timeline_stats = db.execute_read(timeline_query, tuple(params))
    print("Timeline:", len(timeline_stats) if timeline_stats else "None")

    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
