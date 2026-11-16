@echo off
chcp 65001 > nul
title আনন্দ পাঠশালা - ZKBio Zlink অটো-সিঙ্ক (RPA)
echo ====================================================================
echo      আনন্দ পাঠশালা (Anando Pathshala) - ZKBio Zlink অটো-সিঙ্ক (RPA)
echo ====================================================================
echo.
echo [1/3] পাইথন পরিবেশ যাচাই করা হচ্ছে...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] পাইথন পাওয়া যায়নি! অনুগ্রহ করে Python ইনস্টল করুন (https://www.python.org).
    echo.
    pause
    exit /b
)

echo [2/3] প্রয়োজনীয় প্যাকেজ (Playwright) যাচাই করা হচ্ছে...
python -c "import playwright" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Playwright ইনস্টল করা হচ্ছে...
    pip install playwright
    playwright install chromium
)

echo [3/3] ZKBio Zlink অটো-সিঙ্ক সার্ভিস চালু হচ্ছে...
echo.
python scripts/zlink_automation_scraper.py
pause
