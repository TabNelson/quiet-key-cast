#!/bin/bash
# Deploy EncryptedRatingSystem to Sepolia testnet
# Usage: ./deploy-sepolia.sh

PRIVATE_KEY="d5d496a9585dfb1132ca74d9b030f75604397874c323604e1ca0ea6878fe70f2"

echo "========================================"
echo "Deploying to Sepolia Testnet"
echo "========================================"
echo ""

# Check if in project root directory
if [ ! -f "hardhat.config.ts" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Set environment variable and deploy
export PRIVATE_KEY=$PRIVATE_KEY

echo "1. Compiling contracts..."
npm run compile

if [ $? -ne 0 ]; then
    echo "Compilation failed!"
    exit 1
fi

echo ""
echo "2. Deploying to Sepolia..."
echo ""

# Deploy contract
npm run deploy:sepolia

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Deployment successful!"
    echo "========================================"
    echo ""
    echo "Please update the contract address in:"
    echo "  - ui/src/abi/RatingSystemAddresses.ts"
    echo ""
    echo "Deployment info saved in: deployments/sepolia/"
else
    echo ""
    echo "Deployment failed! Please check:"
    echo "  1. Account has sufficient Sepolia ETH"
    echo "  2. Network connection is normal"
    echo "  3. Private key is correct"
fi
