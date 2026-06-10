import urllib.request, json

with open("C:\\Users\\marco\\.hermes\\coolify-token.txt") as f:
    token = f.read().strip()

url = "http://192.168.0.166:8000/api/v1/deployments?app_uuid=qu4vzys28w5qfn252t4a81hl&limit=3"
req = urllib.request.Request(
    url,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
)
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read().decode())
        print(json.dumps(data, indent=2, default=str)[:3000])
except Exception as e:
    print(f"Error: {e}")
