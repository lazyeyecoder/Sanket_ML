const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// On-device burn/wound detection models (react-native-fast-tflite)
config.resolver.assetExts.push("tflite");

module.exports = config;
