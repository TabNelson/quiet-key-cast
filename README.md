<<<<<<< HEAD
# Quiet Key Cast - FHE Anonymous Election DApp

A fully homomorphic encryption (FHE) powered anonymous election system built on Zama's fhEVM. This decentralized application enables completely private voting where individual votes remain encrypted throughout the entire election process until results are publicly revealed.

## Live Demo & Demo Video

- **Live Demo**: [https://quiet-key-cast.vercel.app/](https://quiet-key-cast.vercel.app/)
- **Demo Video**: [https://github.com/TabNelson/quiet-key-cast/blob/main/quiet-key-cast.mp4](https://github.com/TabNelson/quiet-key-cast/blob/main/quiet-key-cast.mp4)

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

## 🔐 Smart Contract Architecture & FHE Implementation

### Core Contract: AnonymousElection.sol

The `AnonymousElection` contract implements a privacy-preserving election system using Fully Homomorphic Encryption:

```solidity
contract AnonymousElection {
    struct Election {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool active;
        mapping(address => bool) hasVoted;
        euint32 totalVotes;  // FHE encrypted total
        address creator;
    }

    Election[] public elections;
    mapping(uint256 => mapping(address => euint32)) private votes;
    // ... election management functions
}
```

### Key Data Encryption/Decryption Logic

#### 1. Vote Encryption Process
- **Individual Votes**: Each vote is encrypted using `FHE.asEuint32(voteValue)` before storage
- **Vote Aggregation**: Encrypted votes are homomorphically added: `election.totalVotes = election.totalVotes + encryptedVote`
- **Privacy Guarantee**: Individual votes remain encrypted and cannot be decrypted until election ends

#### 2. Homomorphic Operations
```solidity
// Vote casting with encryption
euint32 encryptedVote = FHE.asEuint32(voteValue);
votes[electionId][msg.sender] = encryptedVote;

// Homomorphic addition (computes on encrypted data)
election.totalVotes = election.totalVotes + encryptedVote;
```

#### 3. Result Decryption
- **Election End**: Only after election creator calls `endElection()` can results be decrypted
- **Decryption**: Uses `FHE.decrypt(election.totalVotes)` to reveal the aggregate vote count
- **Individual Privacy**: Individual votes remain permanently encrypted and unreadable

#### 4. Security Features
- **No Double Voting**: `hasVoted` mapping prevents duplicate votes
- **Time Locks**: Elections have strict start/end time enforcement
- **Creator Control**: Only election creator can end the election and trigger decryption
- **FHE Computation**: All vote aggregation happens on encrypted data without decryption

### FHE Benefits for Elections

1. **Individual Vote Privacy**: Votes cannot be linked to voters
2. **Computation on Encrypted Data**: Vote counting without revealing individual votes
3. **End-to-End Security**: No trusted third party needed for privacy
4. **Verifiable Results**: Aggregate results can be publicly verified after decryption

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
=======
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
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463

## 🧪 Testing

### Local Testing
<<<<<<< HEAD

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
=======
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
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

<<<<<<< HEAD
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
=======
This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)
- **Issues**: [GitHub Issues](https://github.com/SolomonMacAdam/crypt-seal-vault/issues)

---

**Built with ❤️ using FHEVM by Zama**
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463
