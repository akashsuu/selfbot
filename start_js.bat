@echo off
title akashsuu Selfbot JS Starter
echo =========================================
echo   Starting akashsuu Selfbot (JS Edition)
echo =========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b
)

:: Install dependencies if node_modules is missing
if not exist node_modules (
    echo [INFO] node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b
    )
)

:: Run index.js
echo [INFO] Starting bot client...
node .\index.js
pause
