#!/usr/bin/env node

// Simple script to run the app locally without Replit-specific configs
process.env.NODE_ENV = 'development';
process.env.REPL_ID = undefined;
process.env.REPLIT_DOMAINS = undefined;

// Import and run the server
import('./server/index.ts');