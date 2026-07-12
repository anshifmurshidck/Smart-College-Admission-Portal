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
    search = request.args.get('search', '').strip()
    department = request.args.get('department', '').strip()
    status = request.args.get('status', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    try:
        stats = get_dashboard_stats(search, department, status, start_date, end_date)
        return jsonify(stats), 200
    except Exception as e:
        print(f"[REPORTS STATS ERROR]: {e}")
        return jsonify({'message': 'Error fetching stats', 'error': str(e)}), 500

@reports_bp.route('/generate', methods=['GET'])
@token_required()
def generate_report(current_user):
    file_format = request.args.get('format', 'pdf')
    report_type = request.args.get('type', 'comprehensive')
    
    search = request.args.get('search', '').strip()
    department = request.args.get('department', '').strip()
    status = request.args.get('status', '').strip()
    start_date = request.args.get('start_date', '').strip()
    end_date = request.args.get('end_date', '').strip()
    
    if file_format != 'pdf':
        return jsonify({'message': 'Invalid file format requested'}), 400

    try:
        if report_type == 'comprehensive':
            stats = get_dashboard_stats(search, department, status, start_date, end_date)
            return make_comprehensive_pdf(stats)
        elif report_type == 'approved':
            stats = get_dashboard_stats(search, department, 'Approved', start_date, end_date)
            return make_approved_pdf(stats)
        elif report_type == 'rejected':
            stats = get_dashboard_stats(search, department, 'Rejected', start_date, end_date)
            return make_rejected_pdf(stats)
        else:
            return jsonify({'message': 'Invalid report type'}), 400
    except Exception as e:
        print(f"[REPORT GENERATION ERROR]: {e}")
        return jsonify({'message': 'Error generating report', 'error': str(e)}), 500

def get_dashboard_stats(search='', department='', status='', start_date='', end_date=''):
    import os
    import requests
    supabase_url = os.environ.get('VITE_SUPABASE_URL')
    supabase_key = os.environ.get('VITE_SUPABASE_ANON_KEY')
    
    apps = []
    depts = []
    
    if supabase_url and supabase_key:
        try:
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
            apps_res = requests.get(f"{supabase_url}/rest/v1/applications?select=*", headers=headers)
            if apps_res.status_code == 200:
                apps = apps_res.json()
            
            depts_res = requests.get(f"{supabase_url}/rest/v1/departments?select=*", headers=headers)
            if depts_res.status_code == 200:
                depts = depts_res.json()
        except Exception as e:
            print(f"[SUPABASE FETCH ERROR]: {e}")
            pass

    if not apps and not depts:
        # Fallback to local DB if supabase failed or not configured
        apps = db.execute_read("SELECT * FROM applications")
        depts = db.execute_read("SELECT * FROM departments")
        
    dept_map = {d['id']: d for d in depts}
    
    # Filter apps
    filtered_apps = []
    for a in apps:
        keep = True
        if search:
            s_lower = search.lower()
            if s_lower not in a.get('full_name', '').lower() and s_lower not in str(a.get('id', '')).lower():
                d_name = dept_map.get(a.get('department_id'), {}).get('name', '').lower()
                if s_lower not in d_name:
                    keep = False
        if department and str(a.get('department_id')) != str(department):
            keep = False
        if status and a.get('status') != status:
            keep = False
        
        # Parse dates safely
        created_at_str = str(a.get('created_at', ''))[:10]
        if start_date and created_at_str < start_date:
            keep = False
        if end_date and created_at_str > end_date:
            keep = False
            
        if keep:
            filtered_apps.append(a)
            
    total_apps = len(filtered_apps)
    pending_apps = len([a for a in filtered_apps if a.get('status') in ['Pending', 'Under Verification']])
    approved_apps = len([a for a in filtered_apps if a.get('status') == 'Approved'])
    rejected_apps = len([a for a in filtered_apps if a.get('status') == 'Rejected'])
    total_students = approved_apps # Assuming all approved are students for reports
    
    dept_stats_map = {}
    for d in depts:
        dept_stats_map[d['id']] = {
            'name': d.get('name'),
            'code': d.get('code'),
            'total': 0,
            'approved': 0,
            'pending': 0,
            'rejected': 0
        }
        
    for a in filtered_apps:
        did = a.get('department_id')
        if did in dept_stats_map:
            dept_stats_map[did]['total'] += 1
            if a.get('status') == 'Approved':
                dept_stats_map[did]['approved'] += 1
            elif a.get('status') in ['Pending', 'Under Verification']:
                dept_stats_map[did]['pending'] += 1
            elif a.get('status') == 'Rejected':
                dept_stats_map[did]['rejected'] += 1
                
    dept_stats = list(dept_stats_map.values())
    
    # Time series for charts
    apps_over_time_map = {}
    for a in filtered_apps:
        date_str = str(a.get('created_at', ''))[:10]
        if not date_str: continue
        apps_over_time_map[date_str] = apps_over_time_map.get(date_str, 0) + 1
        
    apps_over_time = [{"date": k, "count": v} for k, v in sorted(apps_over_time_map.items())]
    
    # Recent applications (for PDF mainly)
    sorted_apps = sorted(filtered_apps, key=lambda x: str(x.get('created_at', '')), reverse=True)
    recent_apps = []
    # Up to 200 for reports to prevent massive PDFs but be comprehensive
    for a in sorted_apps[:200]: 
        d = dept_map.get(a.get('department_id'), {})
        recent_apps.append({
            'id': a.get('id'),
            'full_name': a.get('full_name'),
            'department_name': d.get('name', 'Unknown'),
            'department_code': d.get('code', 'Unknown'),
            'email': a.get('email', ''),
            'phone': a.get('phone', ''),
            'status': a.get('status'),
            'date': str(a.get('created_at', ''))[:10],
            'updated_at': str(a.get('updated_at', ''))[:10]
        })
        
    return {
        "total_applications": total_apps,
        "pending_applications": pending_apps,
        "approved_applications": approved_apps,
        "rejected_applications": rejected_apps,
        "total_students": total_students,
        "department_wise": dept_stats,
        "recent_applications": recent_apps,
        "apps_over_time": apps_over_time,
        "departments_list": [{"id": d.get('id'), "name": d.get('name')} for d in depts]
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

def get_base_styles():
    styles = getSampleStyleSheet()
    NAVY = colors.HexColor("#0F172A")
    ROYAL = colors.HexColor("#2563EB")
    DARK_TEXT = colors.HexColor("#1E293B")
    
    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, textColor=NAVY, spaceAfter=6, alignment=1)
    subtitle_style = ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, textColor=ROYAL, spaceAfter=20, alignment=1)
    section_style = ParagraphStyle('SectionHeading', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, textColor=NAVY, spaceAfter=10, spaceBefore=20)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=DARK_TEXT)
    
    cell_style = ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=9, textColor=DARK_TEXT)
    cell_header_style = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.white)
    
    return title_style, subtitle_style, section_style, normal_style, cell_style, cell_header_style

def get_table_style():
    NAVY = colors.HexColor("#0F172A")
    LIGHT_BG = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")
    return TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG]),
    ])

def make_comprehensive_pdf(stats):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=40)
    story = []
    
    title_style, subtitle_style, section_style, normal_style, cell_style, cell_header_style = get_base_styles()
    t_style = get_table_style()

    # Header
    story.append(Paragraph("THOUGHT MINDS ENGINEERING COLLEGE", title_style))
    story.append(Paragraph("Comprehensive Admission Report", subtitle_style))
    story.append(Paragraph(f"Generated Date & Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    
    # Summary Statistics
    story.append(Paragraph("Summary Statistics", section_style))
    summary_data = [
        [Paragraph("Metric", cell_header_style), Paragraph("Value", cell_header_style)],
        [Paragraph("Total Applications", cell_style), Paragraph(str(stats['total_applications']), cell_style)],
        [Paragraph("Approved", cell_style), Paragraph(str(stats['approved_applications']), cell_style)],
        [Paragraph("Pending", cell_style), Paragraph(str(stats['pending_applications']), cell_style)],
        [Paragraph("Rejected", cell_style), Paragraph(str(stats['rejected_applications']), cell_style)],
    ]
    t_summary = Table(summary_data, colWidths=[300, 240])
    t_summary.setStyle(t_style)
    story.append(t_summary)

    # Department-wise Statistics
    story.append(Paragraph("Department-wise Statistics", section_style))
    dept_data = [[Paragraph("Department", cell_header_style), Paragraph("Total", cell_header_style), Paragraph("Approved", cell_header_style), Paragraph("Pending", cell_header_style), Paragraph("Rejected", cell_header_style)]]
    for d in stats['department_wise']:
        dept_data.append([
            Paragraph(d['name'], cell_style),
            Paragraph(str(d['total']), cell_style),
            Paragraph(str(d['approved']), cell_style),
            Paragraph(str(d['pending']), cell_style),
            Paragraph(str(d['rejected']), cell_style)
        ])
    t_dept = Table(dept_data, colWidths=[220, 80, 80, 80, 80])
    t_dept.setStyle(t_style)
    story.append(t_dept)
    
    # Recent Applications
    story.append(Paragraph("Applications Details", section_style))
    recent_apps_data = [[Paragraph("Name", cell_header_style), Paragraph("ID", cell_header_style), Paragraph("Dept", cell_header_style), Paragraph("Email", cell_header_style), Paragraph("Phone", cell_header_style), Paragraph("Status", cell_header_style), Paragraph("Date", cell_header_style)]]
    for app in stats['recent_applications']: 
        recent_apps_data.append([
            Paragraph(app['full_name'], cell_style),
            Paragraph(str(app['id']), cell_style),
            Paragraph(app['department_code'], cell_style),
            Paragraph(app['email'], cell_style),
            Paragraph(app['phone'], cell_style),
            Paragraph(app['status'], cell_style),
            Paragraph(app['date'], cell_style)
        ])
    t_apps = Table(recent_apps_data, colWidths=[110, 80, 50, 110, 80, 60, 50])
    t_apps.setStyle(t_style)
    story.append(t_apps)

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    filename = f"Admission_Report_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

def make_approved_pdf(stats):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=40)
    story = []
    
    title_style, subtitle_style, section_style, normal_style, cell_style, cell_header_style = get_base_styles()
    t_style = get_table_style()

    story.append(Paragraph("THOUGHT MINDS ENGINEERING COLLEGE", title_style))
    story.append(Paragraph("Approved Students Report", subtitle_style))
    story.append(Paragraph(f"Generated Date & Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Paragraph(f"Total Approved Students: {stats['approved_applications']}", normal_style))
    
    story.append(Paragraph("Approved Applications", section_style))
    recent_apps_data = [[Paragraph("Name", cell_header_style), Paragraph("ID", cell_header_style), Paragraph("Department", cell_header_style), Paragraph("Email", cell_header_style), Paragraph("Phone", cell_header_style), Paragraph("Approval Date", cell_header_style)]]
    for app in stats['recent_applications']:
        recent_apps_data.append([
            Paragraph(app['full_name'], cell_style),
            Paragraph(str(app['id']), cell_style),
            Paragraph(app['department_name'], cell_style),
            Paragraph(app['email'], cell_style),
            Paragraph(app['phone'], cell_style),
            Paragraph(app['updated_at'], cell_style)
        ])
    t_apps = Table(recent_apps_data, colWidths=[110, 80, 110, 110, 80, 50])
    t_apps.setStyle(t_style)
    story.append(t_apps)

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    filename = f"Approved_Students_Report_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')

def make_rejected_pdf(stats):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=40)
    story = []
    
    title_style, subtitle_style, section_style, normal_style, cell_style, cell_header_style = get_base_styles()
    t_style = get_table_style()

    story.append(Paragraph("THOUGHT MINDS ENGINEERING COLLEGE", title_style))
    story.append(Paragraph("Rejected Students Report", subtitle_style))
    story.append(Paragraph(f"Generated Date & Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Paragraph(f"Total Rejected Applications: {stats['rejected_applications']}", normal_style))
    
    story.append(Paragraph("Rejected Applications", section_style))
    recent_apps_data = [[Paragraph("Name", cell_header_style), Paragraph("ID", cell_header_style), Paragraph("Department", cell_header_style), Paragraph("Email", cell_header_style), Paragraph("Phone", cell_header_style), Paragraph("Rejection Date", cell_header_style)]]
    for app in stats['recent_applications']:
        recent_apps_data.append([
            Paragraph(app['full_name'], cell_style),
            Paragraph(str(app['id']), cell_style),
            Paragraph(app['department_name'], cell_style),
            Paragraph(app['email'], cell_style),
            Paragraph(app['phone'], cell_style),
            Paragraph(app['updated_at'], cell_style)
        ])
    t_apps = Table(recent_apps_data, colWidths=[110, 80, 110, 110, 80, 50])
    t_apps.setStyle(t_style)
    story.append(t_apps)

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buffer.seek(0)
    filename = f"Rejected_Students_Report_{datetime.datetime.now().strftime('%Y%m%d')}.pdf"
    return send_file(buffer, as_attachment=True, download_name=filename, mimetype='application/pdf')
