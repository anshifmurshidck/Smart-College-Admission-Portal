import urllib.request, json
req = urllib.request.Request('http://localhost:5000/api/auth/login', method='POST', data=b'{"username":"admin","password":"admin123"}', headers={'Content-Type': 'application/json'})
try:
    res = json.loads(urllib.request.urlopen(req).read().decode())
    token = res['token']
    req2 = urllib.request.Request('http://localhost:5000/api/admin/applications', headers={'Authorization': 'Bearer ' + token})
    res2 = urllib.request.urlopen(req2)
    apps = json.loads(res2.read().decode())
    print('LOCAL APPS COUNT:', len(apps))
except Exception as e:
    print('ERR:', e)
