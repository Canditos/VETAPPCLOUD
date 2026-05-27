# 🚀 VetConnect Self-Hosting Guide (RPi 4 + RUT240)

Este guia detalha como transformar o teu Raspberry Pi 4 num servidor de nível profissional com redundância de internet e gateway de SMS local.

## 1. Hardware Recomendado
- **Raspberry Pi 4** (4GB ou 8GB RAM).
- **SSD USB 3.0** (Evita cartões SD para a Base de Dados).
- **Adaptador USB-to-Ethernet** (Para a segunda porta de rede).
- **Teltonika RUT240** (Gateway de SMS + Fallback 4G).

---

## 2. Configuração de Rede (Netplan)
Para teres 1Gbps na porta principal e Fallback no RUT240, edita o ficheiro de rede no Ubuntu:
`sudo nano /etc/netplan/00-installer-config.yaml`

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0: # Porta Nativa (Router 1Gbps)
      dhcp4: true
      dhcp4-overrides:
        route-metric: 100 # Prioridade Máxima
    eth1: # Adaptador USB (RUT240)
      dhcp4: true
      dhcp4-overrides:
        route-metric: 200 # Prioridade de Backup
```
Aplica com: `sudo netplan apply`

---

## 3. Setup "Tipo Vercel" (Coolify)
Instala o Coolify para gerires o projeto com interface web e auto-deploy do GitHub:
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### Configuração no Coolify:
1. **Sources**: Liga o teu GitHub.
2. **Destinations**: Escolhe "Local Docker".
3. **Project**: Cria um novo projeto "VetConnect".
4. **Environment Variables**: Copia o conteúdo do teu `.env` para aqui.
5. **SSL**: O Coolify gera certificados Let's Encrypt automaticamente se usares um domínio.

---

## 4. SMS Gateway (RUT240)
O projeto já está preparado. No Coolify, configura estas variáveis:
- `SMS_PROVIDER=TELTONIKA`
- `TELTONIKA_HOST=192.168.1.1` (IP do RUT240)
- `TELTONIKA_USER=admin`
- `TELTONIKA_PASS=tua_pass`

---

## 5. Acesso Externo Seguro (Cloudflare Tunnel)
Não abras portas no router. Instala o `cloudflared` no RPi:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb
cloudflared tunnel login
cloudflared tunnel run vetconnect
```
*Isto permite que o site esteja online via HTTPS sem expor o teu IP de casa.*

---

## 6. Manutenção de Encoding (Mojibake)
Para detetar texto corrompido em tipos de consulta (ex: `Observa��o`), usa:

```bash
npm run check:appt-encoding
```

Para corrigir automaticamente:

```bash
npm run fix:appt-encoding
```

Sugestão de rotina diária via cron no host:

```bash
15 3 * * * cd /home/canditos/VETAPPCLOUD && /usr/bin/npm run fix:appt-encoding >> /home/canditos/encoding-fix.log 2>&1
```
