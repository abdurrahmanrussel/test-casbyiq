#!/usr/bin/env node

/**
 * Prepare Cloudflare Pages deployment structure
 * This script runs after the OpenNext build to ensure files are in the correct structure
 */

const fs = require('fs');
const path = require('path');

const openNextDir = path.join(process.cwd(), '.open-next');

console.log('🔧 Preparing Cloudflare Pages deployment structure...');

// Check if worker.js exists and rename to _worker.js if needed
const workerJsPath = path.join(openNextDir, 'worker.js');
const underscoreWorkerPath = path.join(openNextDir, '_worker.js');

if (fs.existsSync(workerJsPath)) {
  if (fs.existsSync(underscoreWorkerPath)) {
    fs.unlinkSync(underscoreWorkerPath);
  }
  fs.renameSync(workerJsPath, underscoreWorkerPath);
  console.log('✅ Renamed worker.js to _worker.js');
}

// Ensure _routes.json exists with proper configuration
const routesJsonPath = path.join(openNextDir, '_routes.json');
const routesConfig = {
  version: 1,
  include: ['/*'],
  exclude: ['/_next/static/*']
};

fs.writeFileSync(routesJsonPath, JSON.stringify(routesConfig, null, 2));
console.log('✅ Created _routes.json');

console.log('✨ Cloudflare Pages structure ready!');
console.log(`\nDeploy directory: ${openNextDir}`);
console.log('  - _worker.js (main worker)');
console.log('  - _routes.json (routing config)');
console.log('  - assets/ (static files)');
console.log('  - server-functions/ (serverless functions)');