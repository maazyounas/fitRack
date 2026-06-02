// Minimal shim for @tensorflow/tfjs-react-native to avoid Metro resolution errors
// during Expo Go development. Exports small stubs for the symbols used by
// the app. These stubs intentionally throw at runtime if invoked, so they
// don't silently produce incorrect results — they only prevent bundling errors.

exports.ready = async function ready() {
  return Promise.resolve();
};

exports.decodeJpeg = function decodeJpeg(_uint8array) {
  throw new Error(
    '@tensorflow/tfjs-react-native is not available in Expo Go. Prebuild or use EAS dev client to enable native TF handlers.'
  );
};

// Provide a no-op default export so `import "@tensorflow/tfjs-react-native"`
// doesn't fail when the module is imported for side-effects.
exports.default = {};
