@echo off
REM SKP-DPUPK — starter otomatis (dipakai Procfile Laragon & Startup Windows).
REM Memaksa Node.js bawaan Laragon (v22) agar binding native
REM better-sqlite3 yang terinstall cocok (ABI node-v127).
REM Guard: keluar diam-diam jika port 3000 sudah dipakai (hindari dobel jalan).
netstat -ano | findstr /r /c:"TCP.*127\.0\.0\.1:3000.*LISTENING" /c:"TCP.*\[::\]:3000.*LISTENING" /c:"TCP.*0\.0\.0\.0:3000.*LISTENING" >nul
if not errorlevel 1 (
  echo [SKP-DPUPK] Port 3000 sudah dipakai — server dianggap sudah jalan. Keluar.
  exit /b 0
)
REM Lokasi Laragon diturunkan dari posisi file ini (<laragon>\www\SKP-DPUPK),
REM jadi tetap jalan walau Laragon diinstall di drive/folder lain.
for %%I in ("%~dp0..\..") do set "LARAGON_DIR=%%~fI"
set "PATH=%LARAGON_DIR%\bin\nodejs\node-v22;%PATH%"
cd /d "%~dp0"
call npm start -- --port 3000 --hostname 127.0.0.1
