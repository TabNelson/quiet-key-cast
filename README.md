# Anonymous Election DApp - FHE Voting System

A decentralized anonymous election platform powered by Fully Homomorphic Encryption (FHE) using Zama's FHEVM technology.

## 🎯 Features

- **Fully Anonymous Voting**: Votes are encrypted using FHE and remain private on-chain
- **Encrypted Aggregation**: Smart contract performs homomorphic addition on encrypted votes
- **Admin-Only Decryption**: Only election admins can decrypt the final vote sum
- **Tamper-Proof**: All data stored on blockchain with cryptographic guarantees
- **Modern UI**: Beautiful, responsive interface with RainbowKit wallet integration

## 🏗️ Architecture

### Smart Contract (AnonymousElection.sol)

The contract supports:
- Creating elections with 2-10 candidates
- Casting encrypted votes (each vote is a number representing the candidate)
- On-chain homomorphic addition of encrypted votes
- Admin finalization and decryption of results
- Prevention of double voting

### Vote Encoding

Candidates are encoded as sequential integers:
- Candidate A = 1
- Candidate B = 2
- Candidate C = 3
- etc.

The smart contract sums all encrypted votes. The admin can then decrypt the sum and calculate individual vote counts using the total voter count.

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **MetaMask** or compatible Web3 wallet

## 🚀 Quick Start

### 1. Install Dependencies

   ```bash
# Install contract dependencies
npm install

# Install UI dependencies
cd ui
   npm install
cd ..
   ```

### 2. Compile Contracts

   ```bash
npm run compile
   ```

### 3. Run Tests

   ```bash
# Run local tests
   npm run test
   ```

### 4. Deploy to Local Network

**Terminal 1: Start local FHEVM node**
   ```bash
   npx hardhat node
```

**Terminal 2: Deploy contract**
```bash
   npx hardhat deploy --network localhost
   ```

**Copy the deployed contract address** and update it in `ui/src/config/contracts.ts`:

```typescript
export const CONTRACT_ADDRESS = '0xYourDeployedContractAddress';
```

### 5. Start Frontend

```bash
cd ui
npm run dev
```

Visit `http://localhost:5173` to use the application.

## 🧪 Testing

### Local Testing

```bash
npm run test
```

The test suite includes:
- Election creation
- Encrypted voting
- Vote aggregation
- Double voting prevention
- Election finalization
- Decryption

### Sepolia Testnet

1. **Set up environment variables:**

```bash
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
```

2. **Deploy to Sepolia:**

   ```bash
   npx hardhat deploy --network sepolia
   ```

3. **Update contract address in UI config**

4. **Run Sepolia tests:**

   ```bash
npx hardhat test --network sepolia test/AnonymousElectionSepolia.ts
```

## 📱 Using the Application

### Creating an Election

1. Connect your wallet using RainbowKit
2. Click "Create Election"
3. Fill in:
   - Election title
   - Description
   - Candidate names (2-10 candidates)
   - Duration in hours
4. Submit transaction

### Voting

1. Browse active elections
2. Click "Cast Vote" on an election
3. Select your preferred candidate
4. Your vote is encrypted locally before submission
5. Submit the encrypted vote transaction

### Viewing Results (Admin Only)

1. After the election ends, admins can click "View Results"
2. Click "Decrypt Votes" to reveal the encrypted sum
3. The system calculates individual vote counts
4. Click "Finalize Election" to mark it as complete

## 🔐 Security Features

- **End-to-End Encryption**: Votes are encrypted on the client before submission
- **On-Chain Privacy**: Encrypted votes stored on blockchain without revealing content
- **Homomorphic Computation**: Vote tallying happens on encrypted data
- **Admin-Only Decryption**: Only the election creator can decrypt results
- **Replay Protection**: Built-in double voting prevention

## 📁 Project Structure

```
quiet-key-cast/
├── contracts/
│   ├── AnonymousElection.sol      # Main election contract
│   └── FHECounter.sol             # Example FHE contract
├── deploy/
│   └── deploy.ts                   # Deployment script
├── test/
│   ├── AnonymousElection.ts       # Local tests
│   ├── AnonymousElectionSepolia.ts # Sepolia integration tests
│   └── FHECounter.ts              # Example tests
├── ui/
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ElectionCard.tsx
│   │   │   ├── VoteDialog.tsx
│   │   │   ├── DecryptDialog.tsx
│   │   │   └── CreateElectionDialog.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   │   ├── useElectionContract.ts
│   │   │   └── useZamaInstance.ts
│   │   ├── config/                # Configuration
│   │   │   ├── contracts.ts       # Contract ABI & address
│   │   │   └── wagmi.ts          # Wallet config
│   │   └── pages/
│   │       └── Index.tsx          # Main page
│   └── public/
│       ├── favicon.svg            # Site favicon
│       └── logo.svg               # Logo
├── hardhat.config.ts              # Hardhat configuration
└── package.json
```

## 🛠️ Configuration

### Wallet Configuration

Update `ui/src/config/wagmi.ts` with your WalletConnect project ID:

```typescript
export const config = getDefaultConfig({
  appName: 'Anonymous Election',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from cloud.walletconnect.com
  chains: [mainnet, polygon, sepolia],
  ssr: false,
});
```

### Network Configuration

The contract is configured for Sepolia testnet by default. To use other networks, update:
- `hardhat.config.ts` for deployment networks
- `ui/src/config/wagmi.ts` for frontend networks

## 📚 Technology Stack

### Smart Contracts
- **Solidity 0.8.24**
- **FHEVM by Zama** - Fully Homomorphic Encryption
- **Hardhat** - Development environment
- **Hardhat Deploy** - Deployment management

### Frontend
- **React 18**
- **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **RainbowKit** - Wallet connection
- **Wagmi** - Ethereum hooks
- **Zama Relayer SDK** - FHE encryption

## 🔍 How It Works

### Vote Encryption Flow

1. **User selects candidate** in the UI
2. **Local encryption**: Vote value (1, 2, 3...) encrypted using Zama FHE SDK
3. **Submit transaction**: Encrypted vote + proof sent to smart contract
4. **On-chain aggregation**: Contract performs homomorphic addition
5. **Admin decryption**: After election ends, admin decrypts the sum
6. **Result calculation**: Using sum and total voters, individual counts are derived

### Mathematical Example

For 2 candidates (A=1, B=2):
- Alice votes for A: Enc(1)
- Bob votes for B: Enc(2)
- Carol votes for A: Enc(1)

On-chain sum: Enc(1) + Enc(2) + Enc(1) = Enc(4)

After decryption: Sum = 4, Total voters = 3

Solving:
- a + b = 3 (total voters)
- 1×a + 2×b = 4 (sum)
- Result: a = 2, b = 1

Therefore: Candidate A got 2 votes, Candidate B got 1 vote.

## ⚠️ Known Issues & Solutions

### CORS-Related Console Errors

In **production builds**, you may see errors like this in the browser console:
```
ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep
```

**These errors are normal and safe to ignore.** They occur because:

1. **FHEVM Security Requirements**: Production builds use strict Cross-Origin policies (`COOP/COEP`) required for WebAssembly SharedArrayBuffer support in FHEVM
2. **External Resources Blocked**: These policies prevent loading external resources like analytics scripts, wallet extensions, etc.
3. **Functionality Unaffected**: The core FHEVM encryption/decryption functionality works perfectly

**Solution**: In development, these policies are disabled to avoid console noise. In production, they are required for security but don't affect core functionality.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/zama-ai/fhevm/issues)
- Zama Documentation: [docs.zama.ai](https://docs.zama.ai)
- Zama Discord: [discord.gg/zama](https://discord.gg/zama)

## 🚀 Deployed Contracts

The AnonymousElection contract has been deployed to the following networks:

| Network  | Address                                      | Block Explorer | Status |
|----------|----------------------------------------------|----------------|--------|
| Localhost| `0x5FbDB2315678afecb367f032d93F642f64180aa3` | N/A            | ✅ Active |
| Sepolia  | `0xfAEB8861Cd9111fDCa1fA3969889Cc24C4014479` | [Etherscan](https://sepolia.etherscan.io/address/0xfAEB8861Cd9111fDCa1fA3969889Cc24C4014479) | ✅ Active |

### Deploy to Sepolia

```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Verify deployment
npx hardhat run scripts/check-sepolia.ts
```

## 🙏 Acknowledgments

Built with:
- [Zama FHEVM](https://github.com/zama-ai/fhevm) - Fully Homomorphic Encryption for EVM
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection UI
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

---

**Built with ❤️ using Zama's FHE technology**
