import urllib.request, json

with open("C:\\Users\\marco\\.hermes\\coolify-token.txt") as f:
    token = f.read().strip()

# Try to get deployment logs
url = "http://192.168.0.166:8000/api/v1/deployments/z43io5z72qqhxi9qqljaa0o2"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
try:
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read().decode())
        status = data.get("status")
        logs = data.get("logs", "")
        print(f"Status: {status}")
        # Print last 2000 chars of logs
        if isinstance(logs, str):
            print(logs[-2000:])
        elif isinstance(logs, list):
            for entry in logs[-20:]:
                print(f"[{entry.get('type','?')}] {entry.get('output','')[:200]}")
except Exception as e:
    print(f"Error: {e}")
    # Try getting deployment list instead
    url2 = "http://192.168.0.166:8000/api/v1/deployments?app_uuid=qu4vzys28w5qfn252t4a81hl&limit=1"
    req2 = urllib.request.Request(url2, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req2, timeout=10) as r2:
            data = json.loads(r2.read().decode())
            if isinstance(data, list) and len(data) > 0:
                d = data[0]
                print(f"Status: {d.get('status')}")
                print(f"Commit: {d.get('commit_message')}")
                # Print last part of logs
                raw_logs = d.get("logs", "")
                if isinstance(raw_logs, str) and len(raw_logs) > 100:
                    logs_list = json.loads(raw_logs)
                    for entry in logs_list[-15:]:
                        print(f"[{entry.get('type','?')}] {entry.get('output','')[:300]}")
    except Exception as e2:
        print(f"Error2: {e2}")
