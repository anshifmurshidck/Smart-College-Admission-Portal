import urllib.request, json
req = urllib.request.Request('https://smart-college-admission-portal.vercel.app/api/auth/login', data=json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print(res.getcode(), res.read().decode())
except Exception as e:
    print('ERR:', e)
