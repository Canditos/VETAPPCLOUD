import urllib.request, json, time

with open("C:\\Users\\marco\\.hermes\\coolify-token.txt") as f:
    token = f.read().strip()

# Wait for build to complete (poll every 15s for up to 10min)
url = f"http://192.168.0.166:8000/api/v1/projects/n3cuc3kviy87wu3m7vrph4zb/deployments?per_page=1"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})

for _ in range(40):
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode())
            if isinstance(data, list):
                d = data[0]
            elif isinstance(data, dict):
                d = data.get("data", [data])[0] if "data" in data else data
            else:
                print(f"Unexpected: {type(data)}")
                time.sleep(15)
                continue
            
            status = d.get("status", "?")
            finished = d.get("finished_at")
            print(f"[{time.strftime('%H:%M:%S')}] {d.get('commit_message','')[:50]} -> {status}", end="")
            if finished:
                print(f" ✅ Finished: {finished}")
                break
            else:
                print(f" ⏳ still building...")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error: {e}")
    time.sleep(15)
