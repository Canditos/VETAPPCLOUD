import urllib.request

# Read the raw token
with open("C:\\Users\\marco\\.hermes\\coolify-token.txt") as f:
    raw = f.read().strip()

# Try with full token (including 1| prefix)
tokens_to_try = [raw, raw.split("|", 1)[1] if "|" in raw else raw]

for t in tokens_to_try:
    url = "http://192.168.0.166:8000/api/v1/deploy?uuid=qu4vzys28w5qfn252t4a81hl&force=true"
    req = urllib.request.Request(
        url, data=b"{}",
        headers={
            "Authorization": f"Bearer {t}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            print(f"Token '{t[:20]}...' -> SUCCESS: {r.read().decode()[:200]}")
            break
    except urllib.error.HTTPError as e:
        print(f"Token '{t[:20]}...' -> HTTP {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"Token '{t[:20]}...' -> Error: {e}")
