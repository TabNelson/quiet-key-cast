#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Setting up Quiet Key Cast development environment...\n');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js 20+');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm is not installed');
  process.exit(1);
}

// Install root dependencies
console.log('\n📦 Installing contract dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Contract dependencies installed');
} catch (error) {
  console.error('❌ Failed to install contract dependencies');
  process.exit(1);
}

// Install UI dependencies
console.log('\n📦 Installing UI dependencies...');
try {
  execSync('cd ui && npm install', { stdio: 'inherit' });
  console.log('✅ UI dependencies installed');
} catch (error) {
  console.error('❌ Failed to install UI dependencies');
  process.exit(1);
}

// Compile contracts
console.log('\n🔨 Compiling contracts...');
try {
  execSync('npm run compile', { stdio: 'inherit' });
  console.log('✅ Contracts compiled');
} catch (error) {
  console.error('❌ Failed to compile contracts');
  process.exit(1);
}

// Run tests
console.log('\n🧪 Running tests...');
try {
  execSync('npm run test', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

console.log('\n🎉 Development environment setup complete!');
console.log('\nNext steps:');
console.log('1. Start local FHEVM node: npx hardhat node');
console.log('2. Deploy contracts: npx hardhat deploy --network localhost');
console.log('3. Start UI: cd ui && npm run dev');
console.log('4. Open http://localhost:5173');
