const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
echo "canditos" | sudo -S cloudflared tunnel route dns vet coolify.gatoescondido.com
echo "canditos" | sudo -S sed -i '/- service: http_status:404/i \\  - hostname: coolify.gatoescondido.com\\n    service: http://localhost:8000\\n' /etc/cloudflared/config.yml
echo "canditos" | sudo -S systemctl restart cloudflared
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '192.168.0.166',
  port: 22,
  username: 'canditos',
  password: 'canditos'
});
