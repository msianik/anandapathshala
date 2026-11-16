@echo off
setlocal EnableDelayedExpansion

title Anando Pathshala - ZKBio Zlink RPA Auto-Sync

echo ====================================================================
echo      Anando Pathshala - ZKBio Zlink Attendance Sync (RPA)
echo ====================================================================
echo.

set PY_CMD=

py --version >nul 2>&1
if not errorlevel 1 (
    set PY_CMD=py
    goto FOUND_PY
)

python --version >nul 2>&1
if not errorlevel 1 (
    set PY_CMD=python
    goto FOUND_PY
)

if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    set "PY_CMD=%LOCALAPPDATA%\Python\bin\python.exe"
    goto FOUND_PY
)

for /d %%D in ("%LOCALAPPDATA%\Programs\Python\Python*") do (
    if exist "%%D\python.exe" (
        set "PY_CMD=%%D\python.exe"
        goto FOUND_PY
    )
)

:FOUND_PY
if "%PY_CMD%"=="" (
    echo [ERROR] Python not found in PATH or standard directories!
    echo Please ensure Python is installed and check your PATH.
    pause
    exit /b 1
)

echo [1/3] Python Detected: %PY_CMD%
%PY_CMD% --version

echo.
echo [2/3] Checking Playwright library...
%PY_CMD% -m pip show playwright >nul 2>&1
if errorlevel 1 (
    echo [*] Installing Playwright and Chromium browser...
    %PY_CMD% -m pip install playwright
    %PY_CMD% -m playwright install chromium
)

echo.
echo [3/3] Starting ZKBio Zlink Attendance Scraper...
echo ====================================================================
echo.
%PY_CMD% scripts\zlink_automation_scraper.py
echo.
pause
