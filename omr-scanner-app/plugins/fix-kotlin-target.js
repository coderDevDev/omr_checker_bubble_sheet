module.exports = function withFixKotlinTarget(config) {
  return {
    ...config,
    android: {
      ...config.android,
      kotlinCompilerOptions: {
        jvmTarget: '17'
      }
    }
  };
};
