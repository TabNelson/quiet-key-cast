import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to update contract address in RatingSystemAddresses.ts after deployment
 * Usage: node scripts/update-contract-address.ts <new-address>
 */

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Please provide the new contract address');
  console.log('Usage: node scripts/update-contract-address.ts <new-address>');
  process.exit(1);
}

const newAddress = args[0];

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
  console.error('❌ Invalid address format. Must be a valid Ethereum address (0x followed by 40 hex characters)');
  process.exit(1);
}

const addressesFile = path.join(__dirname, '../ui/src/abi/RatingSystemAddresses.ts');

try {
  // Read current file
  let content = fs.readFileSync(addressesFile, 'utf8');
  
  // Replace Sepolia address
  const oldPattern = /sepolia:\s*"0x[a-fA-F0-9]{40}"/;
  const newLine = `sepolia: "${newAddress}", // New contract deployed`;
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newLine);
  } else {
    // If pattern not found, try to find and replace the zero address
    content = content.replace(
      /sepolia:\s*"0x0+"/,
      newLine
    );
  }
  
  // Remove old contract comment if exists
  content = content.replace(
    /\/\/\s*Old contract \(deprecated\): 0x[a-fA-F0-9]{40}\s*\n/g,
    ''
  );
  
  // Write updated file
  fs.writeFileSync(addressesFile, content, 'utf8');
  
  console.log('✅ Contract address updated successfully!');
  console.log(`   New Sepolia address: ${newAddress}`);
  console.log(`   File: ${addressesFile}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Restart the frontend: cd ui && npm run dev');
  console.log('   2. Test the application on Sepolia network');
  
} catch (error: any) {
  console.error('❌ Error updating contract address:', error.message);
  process.exit(1);
}
