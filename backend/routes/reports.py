import os
import datetime
from io import BytesIO
from flask import Blueprint, request, send_file, jsonify, make_response
from backend.db import db
from backend.middlewares.auth import token_required

# ReportLab libraries for PDF creation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/stats', methods=['GET'])
@token_required()
def get_reports_stats(current_user):
    try:
        stats = get_dashboard_stats()
        return jsonify(stats), 200
    except Exception as e:
        print(f"[REPORTS STATS ERROR]: {e}")
        return jsonify({'message': 'Error fetching stats', 'error': str(e)}), 500

@reports_bp.route('/generate', methods=['GET'])
@token_required()
def generate_report(current_user):
    file_format = request.args.get('format', 'pdf')
    if file_format != 'pdf':
        return jsonify({'message': 'Invalid file format requested'}), 400

    try:
        stats = get_dashboard_stats()
        return make_comprehensive_pdf(stats)
    except Exception as e:
        print(f"[REPORT GENERATION ERROR]: {e}")
        return jsonify({'message': 'Error generating report', 'error': str(e)}), 500

def get_dashboard_stats():
    import os
    import requests
    supabase_url = os.environ.get('VITE_SUPABASE_URL')
    supabase_key = os.environ.get('VITE_SUPABASE_ANON_KEY')
    
    if supabase_url and supabase_key:
        try:
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
            
            apps_res = requests.get(f"{supabase_url}/rest/v1/applications?select=*", headers=headers)
            apps = apps_res.json() if apps_res.status_code == 200 else []
            
            depts_res = requests.get(f"{supabase_url}/rest/v1/departments?select=*", headers=headers)
            depts = depts_res.json() if depts_res.status_code == 200 else []
            dept_map = {d['id']: d for d in depts}
            
            total_apps = len(apps)
            pending_apps = len([a for a in apps if a.get('status') in ['Pending', 'Under Verification']])
            approved_apps = len([a for a in apps if a.get('status') == 'Approved'])
            rejected_apps = len([a for a in apps if a.get('status') == 'Rejected'])
            total_students = approved_apps
            
            dept_stats_map = {}
            for d in depts:
                dept_stats_map[d['id']] = {
                    'name': d.get('name'),
                    'code': d.get('code'),
                    'apps_count': 0,
                    'students_count': 0
                }
                
            for a in apps:
                did = a.get('department_id')
                if did in dept_stats_map:
                    dept_stats_map[did]['apps_count'] += 1
                    if a.get('status') == 'Approved':
                        dept_stats_map[did]['students_count'] += 1
                        
            dept_stats = list(dept_stats_map.values())
            
            sorted_apps = sorted(apps, key=lambda x: x.get('created_at', ''), reverse=True)
            recent_apps = []
            for a in sorted_apps[:5]:
                d = dept_map.get(a.get('department_id'), {})
                recent_apps.append({
                    'id': a.get('id'),
                    'full_name': a.get('full_name'),
                    'department_code': d.get('code', 'Unknown'),
                    'status': a.get('status'),
                    'created_at': a.get('created_at', '')[:10]
                })
                
            sorted_approvals = sorted([a for a in apps if a.get('status') == 'Approved'], key=lambda x: x.get('updated_at') or x.get('created_at', ''), reverse=True)
            recent_approvals = []
            for a in sorted_approvals[:5]:
                d = dept_map.get(a.get('department_id'), {})
                recent_approvals.append({
                    'id': a.get('assigned_student_id') or f"TMP-{a.get('id')}",
                    'full_name': a.get('full_name'),
                    'department_code': d.get('code', 'Unknown'),
                    'enroll_date': (a.get('updated_at') or a.get('created_at', ''))[:10]
                })
                
            return {
                "total_applications": total_apps,
                "pending_applications": pending_apps,
                "approved_applications": approved_apps,
                "rejected_applications": rejected_apps,
                "total_students": total_students,
                "department_wise": dept_stats,
                "recent_applications": recent_apps,
                "recent_approvals": recent_approvals
            }
        except Exception as e:
            print(f"[SUPABASE FETCH ERROR]: {e}")
            pass

    # Fallback to local DB
    total_apps = db.execute_read("SELECT COUNT(*) as count FROM applications")[0]['count']
    pending_apps = db.execute_read("SELECT COUNT(*) as count FROM applications WHERE status='Under Verification' OR status='Pending'")[0]['count']
    approved_apps = db.execute_read("SELECT COUNT(*) as count FROM applications WHERE status='Approved'")[0]['count']
    rejected_apps = db.execute_read("SELECT COUNT(*) as count FROM applications WHERE status='Rejected'")[0]['count']
    total_students = db.execute_read("SELECT COUNT(*) as count FROM students")[0]['count']
    
    dept_stats = db.execute_read("""
        SELECT d.name, d.code,
        (SELECT COUNT(*) FROM applications WHERE department_id = d.id) as apps_count,
        (SELECT COUNT(*) FROM students WHERE department_id = d.id) as students_count
        FROM departments d
    """)
    
    recent_apps = db.execute_read("""
        SELECT a.id, a.full_name, d.code as department_code, a.status, a.created_at
        FROM applications a
        JOIN departments d ON a.department_id = d.id
        ORDER BY a.created_at DESC LIMIT 5
    """)
    
    recent_approvals = db.execute_read("""
        SELECT s.id, s.full_name, d.code as department_code, s.enroll_date
        FROM students s
        JOIN departments d ON s.department_id = d.id
        ORDER BY s.enroll_date DESC LIMIT 5
    """)
    
    for app in recent_apps:
        app['created_at'] = app['created_at'].strftime('%Y-%m-%d') if hasattr(app['created_at'], 'strftime') else str(app['created_at'])[:10]
    for stu in recent_approvals:
        stu['enroll_date'] = stu['enroll_date'].strftime('%Y-%m-%d') if hasattr(stu['enroll_date'], 'strftime') else str(stu['enroll_date'])[:10]

    return {
        "total_applications": total_apps,
        "pending_applications": pending_apps,
        "approved_applications": approved_apps,
        "rejected_applications": rejected_apps,
        "total_students": total_students,
        "department_wise": dept_stats,
        "recent_applications": recent_apps,
        "recent_approvals": recent_approvals
    }

def add_page_number(canvas, doc):
    page_num = canvas.getPageNumber()
    text = f"Page {page_num}"
    canvas.saveState()
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawRightString(letter[0] - 36, 20, text)
    canvas.drawString(36, 20, "Generated by TMEC Smart Admission Portal")
    canvas.restoreState()

def make_comprehensive_pdf(stats):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=40)
    story = []

    NAVY = colors.HexColor("#0F172A")
    ROYAL = colors.HexColor("#2563EB")
    DARK_TEXT = colors.HexColor("#1E293B")
    LIGHT_BG = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, textColor=NAVY, spaceAfter=6, alignment=1)
    subtitle_style = ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, textColor=ROYAL, spaceAfter=20, alignment=1)
    section_style = ParagraphStyle('SectionHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=NAVY, spaceAfter=10, spaceBefore=20)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=DARK_TEXT)
    
    cell_style = ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=DARK_TEXT)
    cell_header_style = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.white)

    # Header
    story.append(Paragraph("THOUGHT MINDS ENGINEERING COLLEGE", title_style))
    story.append(Paragraph("Comprehensive Institutional Report", subtitle_style))
    story.append(Paragraph(f"Generated Date & Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    
    # Summary Statistics
    story.append(Paragraph("Summary Statistics", section_style))
    summary_data = [
        [Paragraph("Metric", cell_header_style), Paragraph("Value", cell_header_style)],
        [Paragraph("Total Applications", cell_style), Paragraph(str(stats['total_applications']), cell_style)],
        [Paragraph("Pending Applications", cell_style), Paragraph(str(stats['pending_applications']), cell_style)],
        [Paragraph("Approved Applications", cell_style), Paragraph(str(stats['approved_applications']), cell_style)],
        [Paragraph("Rejected Applications", cell_style), Paragraph(str(stats['rejected_applications']), cell_style)],
        [Paragraph("Total Enrolled Students", cell_style), Paragraph(str(stats['total_students']), cell_style)],
    ]
    t_summary = Table(summary_data, colWidths=[300, 240])
    t_style = TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG]),
    ])
    t_summary.setStyle(t_style)
    story.append(t_summary)

    # Department-wise Statistics
    story.append(Paragraph("Department-wise Statistics", section_style))
    dept_data = [[Paragraph("Department", cell_header_style), Paragraph("Code", cell_header_style), Paragraph("Applications", cell_header_style), Paragraph("Students", cell_header_style)]]
    for d in stats['department_wise']:
        dept_data.append([
            Paragraph(d['name'], cell_style),
            Paragraph(d['code'], cell_style),
            Paragraph(str(d['apps_count']), cell_style),
            Paragraph(str(d['students_count']), cell_style)
        ])
    t_dept = Table(dept_data, colWidths=[240, 100, 100, 100])
    t_dept.setStyle(t_style)
    story.append(t_dept)
    
    # Recent Applications
    story.append(Paragraph("Recent Applications", section_style))
    recent_apps_data = [[Paragraph("ID", cell_header_style), Paragraph("Name", cell_header_style), Paragraph("Dept", cell_header_style), Paragraph("Status", cell_header_style), Paragraph("Date", cell_header_style)]]
    for app in stats['recent_applications']:
        recent_apps_data.append([
            Paragraph(str(app['id']), cell_style),
            Paragraph(app['full_name'], cell_style),
            Paragraph(app['department_code'], cell_style),
            Paragraph(app['status'], cell_style),
            Paragraph(str(app['created_at']), cell_style)
        ])
    t_apps = Table(recent_apps_data, colWidths=[60, 160, 100, 120, 100])
    t_apps.setStyle(t_style)
    story.append(t_apps)

    # Recent Admissions
    story.append(Paragraph("Recent Admissions", section_style))
    recent_admissions_data = [[Paragraph("Student ID", cell_header_style), Paragraph("Name", cell_header_style), Paragraph("Dept", cell_header_style), Paragraph("Enroll Date", cell_header_style)]]
    for stu in stats['recent_approvals']:
        recent_admissions_data.append([
            Paragraph(str(stu['id']), cell_style),
            Paragraph(stu['full_name'], cell_style),
            Paragraph(stu['department_code'], cell_style),
            Paragraph(str(stu['enroll_date']), cell_style)
        ])
    t_admissions = Table(recent_admissions_data, colWidths=[100, 200, 120, 120])
    t_admissions.setStyle(t_style)
    story.append(t_admissions)

    # Build PDF
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    
    buffer.seek(0)
    filename = f"comprehensive_report_{datetime.datetime.now().strftime('%Y%m%d%H%M')}.pdf"
    
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
