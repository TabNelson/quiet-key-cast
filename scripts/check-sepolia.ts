import { ethers } from "ethers";

async function main() {
  console.log("🔍 Checking Sepolia contract deployment...\n");

  // Try multiple RPC endpoints in case one fails
  const rpcUrls = [
    "https://rpc.sepolia.org",
    "https://ethereum-sepolia.publicnode.com",
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161" // Public Infura endpoint
  ];

  let provider: ethers.JsonRpcProvider | null = null;
  let sepoliaRpcUrl = "";

  for (const url of rpcUrls) {
    try {
      console.log(`Trying RPC: ${url}`);
      const testProvider = new ethers.JsonRpcProvider(url);
      await testProvider.getBlockNumber(); // Test connection
      provider = testProvider;
      sepoliaRpcUrl = url;
      console.log(`✅ Connected to Sepolia via ${url}`);
      break;
    } catch (error) {
      console.log(`❌ Failed to connect to ${url}, trying next...`);
    }
  }

  if (!provider) {
    throw new Error("Could not connect to any Sepolia RPC endpoint");
  }
  const contractAddress = "0xfAEB8861Cd9111fDCa1fA3969889Cc24C4014479";

  try {

    // Check if contract is deployed
    console.log(`Checking contract at: ${contractAddress}`);
    const code = await provider.getCode(contractAddress);

    if (code === "0x") {
      console.log("❌ Contract NOT deployed on Sepolia");
      return;
    }

    console.log("✅ Contract IS deployed on Sepolia");
    console.log(`   Code length: ${code.length} bytes`);

    // Check contract functionality
    const abi = [
      "function getElectionCount() view returns (uint256)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
      const count = await contract.getElectionCount();
      console.log(`✅ Contract is functional - Election count: ${count}`);
    } catch (error: any) {
      console.log("⚠️ Contract deployed but may have issues:", error.message);
    }

    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current Sepolia block: ${blockNumber}`);

    console.log("\n🎉 Sepolia deployment verified successfully!");
    console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);

  } catch (error: any) {
    console.log("❌ Error checking Sepolia deployment:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

