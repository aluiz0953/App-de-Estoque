module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Must stay last in the plugins list (react-native-reanimated requirement).
    'react-native-reanimated/plugin',
  ],
};
