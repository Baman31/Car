#!/usr/bin/env node

import { writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Preparing EduPlatform for deployment...');

// Get backend URL from user input
const args = process.argv.slice(2);
const backendUrl = args[0];

if (!backendUrl) {
  console.error('❌ Please provide the backend URL as an argument');
  console.log('Usage: node scripts/prepare-deployment.js https://your-backend.onrender.com');
  process.exit(1);
}

try {
  // Update vercel.json with the correct backend URL
  console.log('📝 Updating vercel.json...');
  const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf8'));
  
  // Update routes
  vercelConfig.routes = vercelConfig.routes.map(route => {
    if (route.src === '/api/(.*)') {
      route.dest = `${backendUrl}/api/$1`;
    }
    return route;
  });
  
  // Update rewrites
  vercelConfig.rewrites = vercelConfig.rewrites.map(rewrite => {
    if (rewrite.source === '/api/(.*)') {
      rewrite.destination = `${backendUrl}/api/$1`;
    }
    return rewrite;
  });
  
  writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
  
  // Update queryClient.ts with the correct backend URL
  console.log('📝 Updating API configuration...');
  let queryClientContent = readFileSync('client/src/lib/queryClient.ts', 'utf8');
  queryClientContent = queryClientContent.replace(
    'https://your-render-backend.onrender.com',
    backendUrl
  );
  writeFileSync('client/src/lib/queryClient.ts', queryClientContent);
  
  // Update environment file
  console.log('📝 Updating environment configuration...');
  writeFileSync('client/.env.production', `VITE_API_URL=${backendUrl}`);
  
  console.log(`✅ Configuration updated successfully!`);
  console.log(`📋 Backend URL set to: ${backendUrl}`);
  console.log(`📋 Frontend will be deployed to: https://online-learning-platform-puce-sigma.vercel.app`);
  
} catch (error) {
  console.error('❌ Preparation failed:', error.message);
  process.exit(1);
}