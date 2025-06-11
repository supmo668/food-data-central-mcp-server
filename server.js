#!/usr/bin/env node

// Simple wrapper to start the server
console.log('Starting Food Data Central MCP server...');

try {
  // Register ts-node to allow direct execution of TypeScript files
  require('ts-node/register');
  
  // Execute the TypeScript file directly
  require('./src/index.ts');
} catch (error) {
  console.error('Error starting server:', error);
}
