@echo off
REM === COOLIFY AUTO DEPLOY ===
REM Uso: deploy-vet.cmd
REM Faz push da branch master e triggera deploy no Coolify automaticamente

cd /d C:\Users\marco\VETAPPCLOUD

echo [1/3] A fazer push para GitHub...
git push origin master
if %ERRORLEVEL% neq 0 (
    echo ERRO: Push falhou
    pause
    exit /b 1
)

echo [2/3] A triggerar deploy no Coolify...
curl -s -X POST "http://192.168.0.166:8000/api/v1/deploy?force=false" ^
  -H "Authorization: Bearer *** ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"raw\",\"deployment_uuid\":\"auto\",\"rollback\":false}"

echo.
echo [3/3] Deploy triggerado. Verifica em http://192.168.0.166:8000
echo.
pause
