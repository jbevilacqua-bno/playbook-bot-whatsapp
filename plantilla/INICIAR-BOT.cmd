@echo off
chcp 65001 >nul
title Bot de WhatsApp - servidor de prueba (deje esta ventana abierta)
cd /d "%~dp0"
set "CONF=%USERPROFILE%\.bot-cliente"
echo.
echo ===============================================================
echo   BOT DE WHATSAPP - SERVIDOR DE PRUEBA
echo   Corre en esta computadora. Deje esta ventana abierta.
echo ===============================================================
echo.
rem --- 1) Configuracion fuera del codigo y de Dropbox ---
if not exist "%CONF%\.env" (
  mkdir "%CONF%" 2>nul
  copy /y "configuracion-ejemplo.txt" "%CONF%\.env" >nul
  echo [1] Cree su archivo de configuracion en %CONF%\.env
  echo     Pegue los datos donde dice PEGAR_AQUI, guarde con Ctrl+S y vuelva a abrir INICIAR-BOT.
  start notepad "%CONF%\.env"
  pause
  exit /b 1
)
findstr /C:"=PEGAR_AQUI" "%CONF%\.env" >nul
if not errorlevel 1 (
  echo [X] La configuracion todavia tiene datos sin llenar ^(PEGAR_AQUI^). Se la abro.
  start notepad "%CONF%\.env"
  pause
  exit /b 1
)
rem --- 2) Node.js ---
where node >nul 2>nul
if errorlevel 1 (
  echo [ ] Falta Node.js. Lo instalo una sola vez...
  winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
  echo [!] Cuando termine, CIERRE esta ventana y vuelva a abrir INICIAR-BOT.
  pause
  exit /b 0
)
rem --- 3) Tunel seguro (cloudflared, gratuito, sin cuenta) ---
where cloudflared >nul 2>nul
if errorlevel 1 if not exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" if not exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
  echo [ ] Falta cloudflared ^(el tunel^). Lo instalo una sola vez...
  winget install --id Cloudflare.cloudflared --accept-source-agreements --accept-package-agreements --silent
  echo [!] Cuando termine, CIERRE esta ventana y vuelva a abrir INICIAR-BOT.
  pause
  exit /b 0
)
if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%ProgramFiles%\cloudflared\cloudflared.exe"
echo [OK] Arrancando. En unos segundos debe decir "LISTO".
echo.
node servidor.js
pause
