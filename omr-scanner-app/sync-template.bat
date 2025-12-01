@echo off
REM Template Synchronization Script for Windows
REM Syncs inputs/template.json to mobile app

echo.
echo ====================================
echo   Template Synchronization
echo ====================================
echo.

node sync-template.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS! Templates synchronized.
    echo.
) else (
    echo.
    echo ERROR: Template sync failed!
    echo.
    exit /b 1
)

pause
