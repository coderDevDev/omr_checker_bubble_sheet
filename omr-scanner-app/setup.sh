#!/bin/bash

echo "========================================"
echo "   OMR Scanner - React Native Setup"
echo "========================================"
echo

echo "[1/4] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js is installed"

echo
echo "[2/4] Installing Expo CLI globally..."
npm install -g @expo/cli
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Expo CLI"
    exit 1
fi
echo "[OK] Expo CLI installed"

echo
echo "[3/4] Installing project dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi
echo "[OK] Dependencies installed"

echo
echo "[4/4] Setting up project structure..."
mkdir -p assets/templates
mkdir -p assets/images
echo "[OK] Project structure created"

echo
echo "========================================"
echo "   Setup Complete! 🎉"
echo "========================================"
echo
echo "Next steps:"
echo "1. Install Expo Go app on your phone"
echo "2. Run: npm start"
echo "3. Scan QR code with Expo Go"
echo
echo "Commands:"
echo "  npm start          - Start development server"
echo "  npm run android    - Run on Android"
echo "  npm run ios        - Run on iOS"
echo "  npm run web        - Run in web browser"
echo


