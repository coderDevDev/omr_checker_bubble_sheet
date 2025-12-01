# 🔧 JVM Target Compatibility Fix

## Issue
```
Inconsistent JVM-target compatibility detected for tasks 
'compileReleaseJavaWithJavac' (17) and 'compileReleaseKotlin' (11).
```

This happens when Java compiler uses JVM target 17 but Kotlin uses 11.

## ✅ Solution Applied

### 1. Created Custom Expo Config Plugin
- Created `plugins/withJvmTarget.js`
- Automatically configures both Java and Kotlin to use JVM target 17
- Ensures consistency across all compilation tasks

### 2. Updated app.config.js
- Added the custom plugin to the plugins array
- Plugin runs during build configuration

### 3. Added Required Dependency
- Added `@expo/config-plugins` to devDependencies

## 📦 Installation

Run:
```bash
cd omr-scanner-app
npm install
```

## 🔄 How It Works

The plugin:
1. Modifies `android/app/build.gradle` during build
2. Sets `compileOptions` to use Java 17
3. Sets `kotlinOptions.jvmTarget` to '17'
4. Ensures both are consistent

## ✅ Build Now

After installing dependencies, run:
```bash
eas build --platform android --profile preview
```

The JVM target compatibility issue should be resolved!

## 🐛 If Still Failing

If you still see the error, you can manually verify the build.gradle:

1. Check that `compileOptions` uses `JavaVersion.VERSION_17`
2. Check that `kotlinOptions.jvmTarget = '17'`

Both should be in the `android` block of `android/app/build.gradle`.

