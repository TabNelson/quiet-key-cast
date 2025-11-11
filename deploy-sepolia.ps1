# Deploy EncryptedRatingSystem to Sepolia testnet
# Usage: .\deploy-sepolia.ps1

$PRIVATE_KEY = "d5d496a9585dfb1132ca74d9b030f75604397874c323604e1ca0ea6878fe70f2"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to Sepolia Testnet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in project root directory
if (-not (Test-Path "hardhat.config.ts")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Set environment variable
$env:PRIVATE_KEY = $PRIVATE_KEY

Write-Host "1. Compiling contracts..." -ForegroundColor Yellow
npm run compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Deploying to Sepolia..." -ForegroundColor Yellow
Write-Host ""

# Deploy contract
npm run deploy:sepolia

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please update the contract address in:" -ForegroundColor Yellow
    Write-Host "  - ui/src/abi/RatingSystemAddresses.ts" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Deployment info saved in: deployments/sepolia/" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Deployment failed! Please check:" -ForegroundColor Red
    Write-Host "  1. Account has sufficient Sepolia ETH" -ForegroundColor Red
    Write-Host "  2. Network connection is normal" -ForegroundColor Red
    Write-Host "  3. Private key is correct" -ForegroundColor Red
}
