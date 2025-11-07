# Encrypted Rating System

A privacy-preserving rating system built with Fully Homomorphic Encryption (FHE) using FHEVM by Zama. Users can submit anonymous ratings (1-10 scale) for various subjects while maintaining complete privacy. Only aggregated statistics are revealed, never individual ratings.

## 🚀 Features

- **Anonymous Ratings**: Submit ratings without revealing your identity or individual scores
- **FHE-Powered**: Uses Fully Homomorphic Encryption to compute on encrypted data
- **Privacy-First**: Individual ratings remain encrypted on-chain forever
- **Aggregated Insights**: View average ratings and statistics without compromising privacy
- **Multi-Subject Support**: Rate different subjects/categories independently
- **Decentralized**: Built on blockchain with wallet-based authentication

## 🎯 Use Cases

- Anonymous leadership feedback
- Private team performance reviews
- Anonymous satisfaction surveys
- Privacy-preserving employee evaluations
- Confidential product/service ratings

## 🏗️ Architecture

### Smart Contract (`EncryptedRatingSystem.sol`)
- Stores encrypted ratings using FHEVM
- Maintains encrypted aggregate sums per subject
- Handles decryption requests for statistical results
- Ensures one rating per user per subject

### Frontend Application
- React-based UI with RainbowKit wallet integration
- Client-side encryption using FHEVM SDK
- Real-time statistics display
- Intuitive star-based rating interface

### FHEVM Infrastructure
- **Encryption**: Client-side encryption using `@zama-fhe/relayer-sdk`
- **Computation**: On-chain homomorphic operations using `@fhevm/solidity`
- **Decryption**: Off-chain decryption via Zama's relayer network

## Quick Start

### Prerequisites
- **Node.js**: Version 20 or higher
- **npm**: Package manager

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/SolomonMacAdam/crypt-seal-vault.git
   cd crypt-seal-vault
   npm install
   cd ui && npm install
   ```

2. **Set up environment variables**
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

3. **Start local development**
   ```bash
   # Terminal 1: Start local FHEVM node
   npx hardhat node

   # Terminal 2: Deploy contracts
   npx hardhat deploy --network localhost

   # Terminal 3: Start frontend
   cd ui && npm run dev
   ```

## 📱 Usage

1. **Connect Wallet**: Use the RainbowKit button in the top-right corner
2. **Submit Rating**: Select a subject and provide a 1-10 rating
3. **View Statistics**: Request decryption to see aggregated results
4. **Explore Categories**: Rate different subjects independently

## 🧪 Testing

### Local Testing
```bash
# Run contract tests
npm run test

# Run rating system task
npx hardhat task:RatingSystem
```

### Sepolia Testing
```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Run Sepolia tests
npx hardhat task:RatingSystemSepolia
```

## 📁 Project Structure

```
crypt-seal-vault/
├── contracts/              # Smart contracts
│   └── EncryptedRatingSystem.sol
├── deploy/                 # Deployment scripts
├── tasks/                  # Hardhat tasks
│   ├── RatingSystem.ts
│   └── RatingSystemSepolia.ts
├── test/                   # Test files
├── ui/                     # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── RatingSystem.tsx
│   │   │   └── Header.tsx
│   │   ├── config/
│   │   │   └── wagmi.ts
│   │   └── pages/
│   │       └── Index.tsx
└── hardhat.config.ts       # Hardhat configuration
```

## 🔐 Privacy & Security

- **Individual Privacy**: Your ratings are encrypted and never revealed
- **Zero-Knowledge**: Computations happen on encrypted data
- **Decentralized**: No central authority can access individual data
- **Wallet-Based**: Authentication through your Ethereum wallet

## 📊 How It Works

1. **Rate**: Select a subject and provide a 1-10 rating
2. **Encrypt**: Rating is encrypted on your device before submission
3. **Submit**: Encrypted rating is stored on-chain
4. **Aggregate**: Contract computes encrypted statistics
5. **Decrypt**: Only aggregated results are decrypted and displayed

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)
- **Issues**: [GitHub Issues](https://github.com/SolomonMacAdam/crypt-seal-vault/issues)

---

**Built with ❤️ using FHEVM by Zama**
