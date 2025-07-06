#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🚀 Building EduPlatform for production...');

// Create dist directory if it doesn't exist
if (!existsSync('dist')) {
  mkdirSync('dist');
}

try {
  // Build frontend
  console.log('📦 Building frontend...');
  execSync('vite build --config vite.config.prod.ts', { stdio: 'inherit' });
  
  // Build backend
  console.log('⚙️ Building backend...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}