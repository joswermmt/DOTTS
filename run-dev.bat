@echo off
setlocal

REM DOTTS - levantar backend + web + mobile (Windows)

set "ROOT=%~dp0"

if not exist "%ROOT%backend\package.json" (
  echo No se encontro backend\package.json. Ejecuta este .bat desde la raiz del proyecto.
  exit /b 1
)

start "DOTTS BACKEND" cmd /k "cd /d "%ROOT%backend" && npm install && npm run dev"
start "DOTTS WEB" cmd /k "cd /d "%ROOT%web" && npm install && npm run dev"
start "DOTTS MOBILE" cmd /k "cd /d "%ROOT%mobile" && npm install && npm start"

echo Listo. Se abrieron 3 terminales.
endlocal

