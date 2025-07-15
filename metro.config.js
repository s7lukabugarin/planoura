const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "react-native": "react-native-web",
  "react-native-webview": "@10play/react-native-web-webview",
  "react-native/Libraries/Utilities/codegenNativeComponent":
    "@10play/react-native-web-webview/shim",
  crypto: "expo-crypto",
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;