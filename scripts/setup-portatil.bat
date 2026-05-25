@echo off
chcp 65001 >nul
title VetConnect - Setup Portátil
echo ============================================
echo   VetConnect SaaS - Setup Portátil
echo ============================================
echo.

:: Verificar se git existe
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Git nao encontrado. Instala em: https://git-scm.com
    pause
    exit /b 1
)

:: Verificar se node existe
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado. Instala em: https://nodejs.org
    pause
    exit /b 1
)

:: Pasta onde o script esta
set PEN_DIR=%~dp0
echo Pen drive: %PEN_DIR%
echo.

:: Clonar se nao existir
if not exist "%PEN_DIR%VETAPPCLOUD" (
    echo 1/4 - A clonar repositorio...
    git clone https://github.com/Canditos/VETAPPCLOUD.git "%PEN_DIR%VETAPPCLOUD"
) else (
    echo 1/4 - Repositorio ja existe. A atualizar...
    cd /d "%PEN_DIR%VETAPPCLOUD"
    git pull origin main
)

cd /d "%PEN_DIR%VETAPPCLOUD"

echo 2/4 - A instalar dependencias...
call npm ci

echo 3/4 - A gerar cliente Prisma...
call npx prisma generate

echo 4/4 - Setup concluido!
echo.
echo ============================================
echo   Para correr o projeto:
echo   cd /d "%PEN_DIR%VETAPPCLOUD"
echo   npx next dev
echo ============================================
echo.
echo (Requer .env.local configurado)
pause
