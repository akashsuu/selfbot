@echo off
title akashsuu Selfbot JS Launcher
color 0B
cls

echo.
echo ==========================================
echo          akashsuu SELFBOT JS
echo ==========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [!] Node.js is not installed or not added to PATH!
    echo [!] Install Node.js from https://nodejs.org/
    pause
    exit /b
)

if not exist node_modules (
    echo [+] Installing Node dependencies...
    npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [!] Failed to install dependencies!
        pause
        exit /b
    )
)

echo [+] Starting bot client...
echo ==========================================
node .\index.js

echo.
echo ==========================================
echo [!] Bot stopped.
pause
