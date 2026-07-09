import urllib.request, json
req = urllib.request.Request('https://smart-college-admission-portal.vercel.app/api/auth/login', method='POST', data=b'{"username":"admin","password":"admin123"}', headers={'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req).read().decode())
except Exception as e:
    print('ERR:', e)
