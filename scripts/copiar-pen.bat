@echo off
chcp 65001 >nul
title Copiar VetConnect para Pen

set ORIGEM=D:\FATURAÇÂO\vet-connect-saas
set DESTINO=E:\vet-connect-saas

echo Origem:  %ORIGEM%
echo Destino: %DESTINO%
echo.
echo A copiar (excluindo node_modules e .next)...
echo.

robocopy "%ORIGEM%" "%DESTINO%" /E /XD node_modules .next weopet-checkpoint.json /R:2 /W:2 >nul

echo.
echo Copia concluida!
echo.
echo Para configurar na pen:
echo   1. Abre "%DESTINO%"
echo   2. Executa scripts\setup-portatil.bat
echo.
pause
