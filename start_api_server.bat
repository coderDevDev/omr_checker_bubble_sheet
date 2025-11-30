@echo off
REM OMR Scanner API Server Launcher
REM Quick start script for Windows

echo.
echo ======================================
echo   OMR Scanner API Server
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    echo.
    pause
    exit /b 1
)

echo Python found: 
python --version
echo.

REM Check if dependencies are installed
echo Checking dependencies...
python -c "import flask" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Flask not installed!
    echo Installing API dependencies...
    echo.
    pip install -r requirements_api.txt
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Dependencies OK
echo.

REM Find local IP address
echo Your IP addresses:
ipconfig | findstr /i "ipv4"
echo.
echo IMPORTANT: Update the mobile app with your IP address!
echo Edit: omr-scanner-app/src/services/apiService.js
echo Change BASE_URL to: http://[YOUR_IP]:5000/api
echo.
echo Press any key to start the server...
pause >nul

echo.
echo ======================================
echo   Starting API Server...
echo ======================================
echo.
echo Server will be available at:
echo   Local:    http://localhost:5000
echo   Network:  http://[YOUR_IP]:5000
echo.
echo Press Ctrl+C to stop the server
echo ======================================
echo.

REM Start the server
python api_server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Server failed to start
    echo Check the error messages above
    pause
    exit /b 1
)
