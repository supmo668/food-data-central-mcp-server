#!/usr/bin/env node

// Simple wrapper to start the server
console.log('Starting Food Data Central MCP server...');

// Use the npx command to run ts-node
const { spawn } = require('child_process');
const path = require('path');

const tsNode = spawn('npx', ['ts-node', path.join(__dirname, 'src', 'index.ts')], {
  stdio: 'inherit',
  shell: true
});

tsNode.on('error', (error) => {
  console.error('Failed to start server:', error);
});

process.on('SIGINT', () => {
  tsNode.kill('SIGINT');
  process.exit(0);
});
