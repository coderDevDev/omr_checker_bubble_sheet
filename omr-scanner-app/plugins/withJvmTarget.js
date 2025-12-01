const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to fix JVM target compatibility between Java and Kotlin
 * Sets both Java and Kotlin to use JVM target 17
 */
const withJvmTarget = (config) => {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Ensure compileOptions block exists with Java 17
    if (!buildGradle.includes('compileOptions')) {
      // Add compileOptions after android block opens
      buildGradle = buildGradle.replace(
        /(android\s*\{)/,
        `$1\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }`
      );
    } else {
      // Update existing compileOptions to Java 17
      buildGradle = buildGradle.replace(
        /sourceCompatibility\s+JavaVersion\.VERSION_\d+/,
        'sourceCompatibility JavaVersion.VERSION_17'
      );
      buildGradle = buildGradle.replace(
        /targetCompatibility\s+JavaVersion\.VERSION_\d+/,
        'targetCompatibility JavaVersion.VERSION_17'
      );
    }

    // Ensure kotlinOptions block exists with JVM target 17
    if (!buildGradle.includes('kotlinOptions')) {
      // Add kotlinOptions after compileOptions
      if (buildGradle.includes('compileOptions')) {
        buildGradle = buildGradle.replace(
          /(compileOptions\s*\{[^}]*\})/,
          `$1\n    kotlinOptions {\n        jvmTarget = '17'\n    }`
        );
      } else {
        // Add after android block if compileOptions doesn't exist
        buildGradle = buildGradle.replace(
          /(android\s*\{)/,
          `$1\n    kotlinOptions {\n        jvmTarget = '17'\n    }`
        );
      }
    } else {
      // Update existing kotlinOptions to JVM target 17
      buildGradle = buildGradle.replace(
        /jvmTarget\s*=\s*['"]\d+['"]/,
        "jvmTarget = '17'"
      );
    }

    config.modResults.contents = buildGradle;
    return config;
  });
};

module.exports = withJvmTarget;

