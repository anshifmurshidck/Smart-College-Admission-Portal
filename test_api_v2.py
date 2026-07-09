import urllib.request, json
req = urllib.request.Request('https://smart-college-admission-portal.vercel.app/api/auth/login', method='POST', data=b'{"username":"admin","password":"admin123"}', headers={'Content-Type': 'application/json'})
try:
    res = json.loads(urllib.request.urlopen(req).read().decode())
    token = res['token']
    print('Login successful!')
    
    req2 = urllib.request.Request('https://smart-college-admission-portal.vercel.app/api/admin/applications', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    print('APPS STATUS:', res2.getcode())
    apps = json.loads(res2.read().decode())
    print('APPS COUNT:', len(apps))
except Exception as e:
    print('ERR:', e)
    if hasattr(e, 'read'):
        print(e.read().decode())
