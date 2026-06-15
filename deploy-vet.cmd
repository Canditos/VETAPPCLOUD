@echo off
REM === COOLIFY AUTO DEPLOY ===
REM Uso: deploy-vet.cmd
REM Faz push da branch master e triggera deploy no Coolify automaticamente

cd /d D:\FATURAÇÂO\VETAPPCLOUD

echo [1/3] A fazer push para GitHub...
git push origin master
git push origin master:main
if %ERRORLEVEL% neq 0 (
    echo ERRO: Push falhou
    pause
    exit /b 1
)

echo [2/3] A triggerar deploy no Coolify...
curl -s -X POST "https://coolify.gatoescondido.com/api/v1/deploy?uuid=qu4vzys28w5qfn252t4a81hl&force=false" ^
  -H "Authorization: Bearer 2|FTozc01LOjcE2uX0OOsj6FsXi5VJCMbi2k3k7dmVa6afb7f5" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"raw\",\"deployment_uuid\":\"auto\",\"rollback\":false}"

echo.
echo [3/3] Deploy triggerado. Verifica em https://coolify.gatoescondido.com
echo.
pause
