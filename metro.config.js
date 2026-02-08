const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const projectRoot = __dirname;

// Polyfills for Node.js built-in modules
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('react-native-get-random-values'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
  zlib: require.resolve('browserify-zlib'),
  util: require.resolve('util'),
  events: require.resolve('events'),
  assert: require.resolve('assert'),
  http: path.resolve(projectRoot, 'shims/http.js'),
  https: path.resolve(projectRoot, 'shims/https.js'),
};

// Ensure .cjs files are resolved
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

// Prioritize browser field in package.json
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Custom resolver to redirect jose/node to jose/browser
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is jose importing from node path - redirect to browser
  if (context.originModulePath &&
      context.originModulePath.includes('@privy-io/js-sdk-core') &&
      context.originModulePath.includes('/jose/')) {
    // We're inside the jose package within privy-sdk-core
    // If trying to resolve node-specific modules, return empty
    if (moduleName === 'http' || moduleName === 'https') {
      return { type: 'empty' };
    }
  }

  // If the module name indicates we're trying to load jose
  if (moduleName === 'jose' && context.originModulePath &&
      context.originModulePath.includes('@privy-io/js-sdk-core')) {
    // Force use of browser version
    const browserJosePath = path.resolve(
      projectRoot,
      'node_modules/@privy-io/js-sdk-core/node_modules/jose/dist/browser/index.js'
    );
    return { filePath: browserJosePath, type: 'sourceFile' };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
