TOKEN=$(cat ~/.hermes/coolify-token.txt)

for i in $(seq 1 30); do
  echo -n "$(date +%H:%M:%S) "
  curl -s -m 10 "http://192.168.0.166:8000/api/v1/deployments?app_uuid=qu4vzys28w5qfn252t4a81hl&limit=1" \
    -H "Authorization: Bearer *** | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if isinstance(d, list) and d:
        s = d[0].get('status','?')
        msg = d[0].get('commit_message','')[:50]
        fin = d[0].get('finished_at','')
        print(f'{msg} -> {s}', end='')
        if fin: print(f' ✅ {fin}', end='')
        print()
    else:
        print('no data')
except: print(f'parse err: {sys.stdin.read()[:100]}')
" 2>/dev/null
  sleep 15
done
