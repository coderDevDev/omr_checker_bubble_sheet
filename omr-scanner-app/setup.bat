@echo off
echo ========================================
echo    OMR Scanner - React Native Setup
echo ========================================
echo.

echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

echo.
echo [2/4] Installing Expo CLI globally...
npm install -g @expo/cli
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Expo CLI
    pause
    exit /b 1
)
echo [OK] Expo CLI installed

echo.
echo [3/4] Installing project dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed

echo.
echo [4/4] Setting up project structure...
if not exist "assets" mkdir assets
if not exist "assets\templates" mkdir assets\templates
if not exist "assets\images" mkdir assets\images
echo [OK] Project structure created

echo.
echo ========================================
echo    Setup Complete! 🎉
echo ========================================
echo.
echo Next steps:
echo 1. Install Expo Go app on your phone
echo 2. Run: npm start
echo 3. Scan QR code with Expo Go
echo.
echo Commands:
echo   npm start          - Start development server
echo   npm run android    - Run on Android
echo   npm run ios        - Run on iOS
echo   npm run web        - Run in web browser
echo.
pause


