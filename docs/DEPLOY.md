# VetConnect - Deploy Robusto e Estável

## 🎯 Objectivo
Resolver problemas de instabilidade no deploy, base de dados e servidor.

## 🏗️ Arquitetura Nova

```
Internet -> Cloudflare Tunnel -> Traefik Proxy -> App Container
                                      |
                                      -> Canary Container (testes)
                                      -> PostgreSQL Container
                                      -> Monitor Container
```

## 📋 Checklist de Implementação

### 1. Configuração Inicial

```bash
# Clonar repositório
cd ~
git clone https://github.com/Canditos/VETAPPCLOUD.git
cd VETAPPCLOUD

# Criar ficheiro .env
nano .env
```

Conteúdo do `.env`:
```env
DATABASE_URL=postgres://postgres:PASSWORD@db:5432/postgres
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://vet.gatoescondido.com
HOST=0.0.0.0
PORT=3000
CLOUDFLARE_TOKEN=your-token-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Docker Compose

```bash
# Copiar docker-compose.yml para o servidor
scp docker-compose.yml canditos@vet-server:~/VETAPPCLOUD/

# Iniciar stack
ssh canditos@vet-server
cd ~/VETAPPCLOUD
docker-compose up -d
```

### 3. Cloudflare Tunnel

```bash
# Configurar token no .env
# Ir a Cloudflare Zero Trust -> Tunnels -> Create
# Copiar o token e colocar no .env

# Reiniciar tunnel
docker-compose restart tunnel
```

### 4. Scripts de Deploy

```bash
# Copiar scripts
chmod +x scripts/*.sh

# Configurar cron para monitorização
crontab -e
# Adicionar:
*/5 * * * * /home/canditos/VETAPPCLOUD/scripts/monitor.sh
0 2 */2 * * /home/canditos/VETAPPCLOUD/scripts/backup.sh
```

### 5. GitHub Actions

```bash
# Configurar secrets no GitHub:
# - SSH_HOST: vet.gatoescondido.com
# - SSH_USER: canditos
# - SSH_PASSWORD: (sua password)

# Push para main dispara deploy automático
```

## 🔄 Processo de Deploy

### Deploy Manual
```bash
# 1. Fazer backup
./scripts/backup.sh

# 2. Deploy com health check
./scripts/deploy.sh

# 3. Verificar se está OK
./scripts/health-check.sh
```

### Deploy Automático (GitHub Actions)
```bash
# 1. Push para main
# 2. GitHub Actions faz build
# 3. Deploy no servidor
# 4. Health check automático
# 5. Rollback se falhar
```

## 🆘 Rollback

```bash
# Se algo correu mal
./scripts/rollback.sh

# Ou manualmente
docker-compose down
docker-compose up -d
```

## 📊 Monitorização

### Dashboard
- Aplicação: `https://vet.gatoescondido.com`
- Traefik: `https://traefik.vet.gatoescondido.com`
- Prometheus: `https://vet.gatoescondido.com:9090`

### Comandos Úteis
```bash
# Ver logs
docker-compose logs app

# Ver status
docker-compose ps

# Health check
curl http://localhost:3000/api/health

# Reiniciar
docker-compose restart app

# Escala
docker-compose up -d --scale app=2
```

## 🔧 Troubleshooting

### Erro 500
```bash
# Ver logs
docker-compose logs app

# Verificar se a BD está OK
docker-compose exec db pg_isready -U postgres
```

### Tunnel não funciona
```bash
# Verificar config
nano .env
# Verificar se o token está correto

# Reiniciar
docker-compose restart tunnel
```

### Deploy falhou
```bash
# Rollback
./scripts/rollback.sh

# Ou verificar logs
docker-compose logs app
```

## 📝 Notas Importantes

1. **Nunca fazer deploy manual** - Usar sempre scripts
2. **Sempre fazer backup** antes de deploy
3. **Health check** é obrigatório
4. **Canary** para testes antes de produção
5. **Monitorização** contínua via cron

## 🚀 Melhorias Futuras

- [ ] Kubernetes para orquestração
- [ ] GitOps com ArgoCD
- [ ] Blue/Green deployment
- [ ] A/B testing com canary
- [ ] Auto-scaling
- [ ] CDN para assets
- [ ] Multi-region deploy

## 📞 Suporte

Se algo correr mal:
1. Verificar logs: `docker-compose logs app`
2. Health check: `./scripts/health-check.sh`
3. Rollback: `./scripts/rollback.sh`
4. Backup: `./scripts/backup.sh`

## ✅ Validação

Depois de implementar, verificar:
- [ ] App acessível via HTTPS
- [ ] Login funciona
- [ ] Inventário carrega
- [ ] BD conectada
- [ ] Backup funciona
- [ ] Monitorização ativa
- [ ] Deploy automático funciona
- [ ] Rollback funciona
- [ ] Health check OK
- [ ] Logs sem erros

---

**Documento criado em:** 2026-06-13
**Versão:** 1.0
**Próxima revisão:** 2026-07-13
