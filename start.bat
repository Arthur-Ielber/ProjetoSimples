@echo off
echo 🛑 Parando processos Node.js e liberando portas...

REM Parar processos na porta 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo    Parando processo na porta 8080 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

REM Parar processos na porta 3001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo    Parando processo na porta 3001 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

REM Parar todos os processos Node.js
echo.
echo 🛑 Parando todos os processos Node.js...
taskkill /F /IM node.exe >nul 2>&1

timeout /t 3 /nobreak >nul

echo.
echo 🚀 Iniciando aplicação...
echo.

npm run dev

