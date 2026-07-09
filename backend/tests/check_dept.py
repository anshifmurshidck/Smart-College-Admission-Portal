import urllib.request, json, os

supabase_url = os.getenv('VITE_SUPABASE_URL', 'https://evskpbbqojkclyyjvpjr.supabase.co')
supabase_key = os.getenv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_6cV57fiEzgN8GVbr-m3B9w_S6i6SuXs')
req = urllib.request.Request(f'{supabase_url}/rest/v1/applications', headers={'apikey': supabase_key, 'Authorization': f'Bearer {supabase_key}'})

try:
    res = urllib.request.urlopen(req)
    apps = json.loads(res.read().decode())
    invalid = [app for app in apps if app.get('department_id') not in [1, 2, 3, 4, 5]]
    print(f'Total apps: {len(apps)}')
    print(f'Apps with invalid department_id: {len(invalid)}')
    for app in invalid[:5]:
        print(f"ID: {app.get('id')}, Dept: {app.get('department_id')}")
except Exception as e:
    print('ERR:', e)
