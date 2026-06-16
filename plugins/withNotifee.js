const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNotifee(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const mavenRepo = `maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }`;
      if (!config.modResults.contents.includes(mavenRepo)) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects\s*\{\s*repositories\s*\{/,
          `allprojects {\n  repositories {\n    ${mavenRepo}`
        );
      }
    }
    return config;
  });
};
