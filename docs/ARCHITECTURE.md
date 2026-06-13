# VetConnect - Arquitetura e Problemas Atuais

## Arquitetura Atual

```
Internet -> Cloudflare Tunnel -> Traefik (Coolify Proxy) -> App Container (porta 3000)
                                    |
                                    -> Canary Container (porta 3001) - MANUAL
                                    |
                                    -> PostgreSQL (porta 5432)
```

## Problemas Identificados

### 1. Deploys quebram frequentemente
- **Causa:** Coolify não consegue fazer build corretamente no RPi ARM64
- **Impacto:** App fica indisponível, erro 500, redirects loop
- **Solução:** Pipeline de deploy com health checks e rollback automático

### 2. Canary Container não está integrado
- **Causa:** Container manual fora do Docker Compose / Coolify
- **Impacto:** Tunnel aponta para container antigo, deploys não funcionam
- **Solução:** Integrar canary no Docker Compose com proxy automático

### 3. Cloudflare Tunnel aponta para porta fixa
- **Causa:** Configuração manual (`127.0.0.1:3001`) para container manual
- **Impacto:** Quando o canary é recriado, o tunnel quebra
- **Solução:** Apontar para Traefik (porta 80) ou usar service discovery

### 4. Variáveis de ambiente não centralizadas
- **Causa:** `.env` no container, não no Docker Compose
- **Impacto:** Canary não tem acesso às mesmas variáveis
- **Solução:** Docker Compose com `env_file` compartilhado

### 5. Falta de health checks
- **Causa:** Nenhuma verificação se a app está realmente funcionando
- **Impacto:** Deploys quebram sem detecção, usuários veem erro 500
- **Solução:** Health checks com `/api/health` e restart automático

### 6. Sem rollback automático
- **Causa:** Se o deploy novo falha, não volta para versão anterior
- **Impacto:** App fica quebrada até intervenção manual
- **Solução:** Script de deploy com teste e rollback automático

## Solução Proposta

### Stack Docker Compose
```yaml
version: '3.8'
services:
  app:
    image: vetconnect:latest
    env_file: .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    networks:
      - coolify
      
  canary:
    image: vetconnect:latest
    env_file: .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
    networks:
      - coolify
      
  proxy:
    image: traefik:v3.6
    ports:
      - "80:80"
      - "443:443"
    networks:
      - coolify
      
  db:
    image: postgres:18-alpine
    env_file: .env
    networks:
      - coolify
      
  tunnel:
    image: cloudflared:latest
    command: tunnel run
    networks:
      - coolify

networks:
  coolify:
    external: true
```

### Pipeline de Deploy
```
1. Build da imagem Docker
2. Testar localmente
3. Push para registry
4. Deploy no servidor (pull + up)
5. Health check (30s)
6. Se OK: ativar tráfego
7. Se FAIL: rollback automático
```

### Scripts de Manutenção
- `deploy.sh` - Deploy automatizado com health check
- `rollback.sh` - Rollback para versão anterior
- `health-check.sh` - Verificação de saúde
- `backup.sh` - Backup automatizado
- `monitor.sh` - Monitorização contínua
