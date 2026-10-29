@echo off
chcp 65001 >nul
title Bot - prueba en consola
cd /d "%~dp0"
node servidor.js --consola
pause
