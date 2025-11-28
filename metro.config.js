const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar soporte para extensiones CommonJS
config.resolver.sourceExts.push('cjs');

// Resolver el problema de imports de directorios
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-native-firebase/app/lib/common') {
    return {
      filePath: require.resolve('@react-native-firebase/app/lib/common/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;