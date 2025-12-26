const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

// Ensure Metro can resolve ESM/mjs files
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'mjs'];

// Force Metro to use project-local resolution only
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Prevent cross-project module resolution
config.resolver.disableHierarchicalLookup = true;

// Add alias for @supabase/node-fetch to prevent dynamic import issues
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Clear Metro transform cache on each build
config.resetCache = true;

// Ensure proper module resolution
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// ──────────────────────────────────────────────────────────────
// FIX FOR WINDOWS EPERM CRASH
// ──────────────────────────────────────────────────────────────
config.server = {
  ...config.server,
  // 1. Run Metro in the **same** process → no child‑process kill()
  runServerInNewContext: false,

  // 2. Limit workers → prevents jest‑worker from spawning many children
  maxWorkers: 1,

  // 3. Increase timeout (your bundle took ~94 s)
  // Metro will wait up to 5 minutes before killing itself
  // (default is 60 s on Windows)
  // Not a direct Metro option – handled via EXPO_BUNDLE_TIMEOUT
};

// Set environment variable for Expo CLI (read by expo export)
process.env.EXPO_BUNDLE_TIMEOUT = '300000'; // 5 minutes in ms

module.exports = config;
