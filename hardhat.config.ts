import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/FHECounter";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
<<<<<<< HEAD
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "de3cfb832a21b8c5666b1dc74ee75777e6f571ff7ae461e4a3c5ef73c04d2a17");
=======
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "");
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
<<<<<<< HEAD
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [PRIVATE_KEY],
      chainId: 11155111,
      // Use Infura RPC if INFURA_API_KEY is set, otherwise use public RPC
      url: INFURA_API_KEY && INFURA_API_KEY !== "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
        ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
        : "https://rpc.sepolia.org",
      timeout: 300000, // 300 seconds timeout for deployment
      httpHeaders: {}, // Add headers if needed
=======
      // Support private key from environment variable or vars
      // Usage: PRIVATE_KEY=your_private_key npm run deploy:sepolia
      accounts: process.env.PRIVATE_KEY 
        ? [process.env.PRIVATE_KEY] 
        : process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : PRIVATE_KEY
        ? [PRIVATE_KEY]
        : {
            mnemonic: MNEMONIC,
            path: "m/44'/60'/0'/0/",
            count: 10,
          },
      chainId: 11155111,
      url: process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz" 
        ? `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
        : INFURA_API_KEY && INFURA_API_KEY !== "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
        ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
        : process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      timeout: 300000,
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
