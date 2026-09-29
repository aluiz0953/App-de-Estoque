module.exports = function (api) {
  const isProduction = api.env('production');
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      ...(isProduction
        ? [
            // Bundle only the react-native-paper components that are imported.
            'react-native-paper/babel',
            // Console calls cost time and can leak data in release builds.
            ['transform-remove-console', { exclude: ['error', 'warn'] }],
          ]
        : []),
      // Must stay last in the plugins list (react-native-reanimated requirement).
      'react-native-reanimated/plugin',
    ],
  };
};
