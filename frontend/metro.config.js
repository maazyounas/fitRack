const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const shimsPath = path.resolve(projectRoot, 'shims');

const defaultConfig = getDefaultConfig(projectRoot);

module.exports = {
  ...defaultConfig,
  watchFolders: [...(defaultConfig.watchFolders || []), shimsPath],
  resolver: {
    ...(defaultConfig.resolver || {}),
    extraNodeModules: {
      ...((defaultConfig.resolver && defaultConfig.resolver.extraNodeModules) || {}),
      '@tensorflow/tfjs-react-native': path.join(shimsPath, '@tensorflow', 'tfjs-react-native', 'index.js'),
    },
  },
};
