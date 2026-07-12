import sys
from db import db

try:
    dept_stats = db.execute_read("""
        SELECT 
            d.name, 
            d.code,
            COUNT(a.id) as total,
            SUM(CASE WHEN a.status = 'Approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN a.status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN a.status IN ('Pending', 'Under Verification') THEN 1 ELSE 0 END) as pending
        FROM departments d
        LEFT JOIN applications a ON a.department_id = d.id AND 1=1
        GROUP BY d.id
    """)
    print("SUCCESS")
    print(dept_stats)
except Exception as e:
    import traceback
    traceback.print_exc()
