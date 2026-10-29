@echo off
chcp 65001 >nul
title Simulador del bot (deje esta ventana abierta)
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Lo instalo una sola vez...
  winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
  echo Cuando termine, CIERRE esta ventana y vuelva a abrir ABRIR-SIMULADOR.
  pause
  exit /b 0
)
if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
if exist "%ProgramFiles%\cloudflared\cloudflared.exe" set "CLOUDFLARED_EXE=%ProgramFiles%\cloudflared\cloudflared.exe"
set "PORT=8090"
start "" http://localhost:8090/simulador
node servidor.js --simulador
pause
