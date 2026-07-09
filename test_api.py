import jwt, time, urllib.request, urllib.error, json
from api.backend.config import Config
token = jwt.encode({'id': 1, 'username': 'admin', 'role': 'super_admin', 'exp': time.time() + 3600}, Config.JWT_SECRET_KEY, algorithm='HS256')
req1 = urllib.request.Request('https://smart-college-admission-portal.vercel.app/api/admin/applications', headers={'Authorization': 'Bearer ' + token})
try:
    res1 = urllib.request.urlopen(req1).read().decode()
    apps = json.loads(res1)
    for i, app in enumerate(apps):
        print(f"App {i}: ID={app.get('id')} Status={app.get('status')} DOB={app.get('dob')} Gender={app.get('gender')}")
except Exception as e:
    print('APPS ERR:', e)
