import { ethers } from "ethers";

async function main() {
  console.log("🔍 Verifying contract deployment and functionality...\n");

  // Connect to localhost network
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  try {
    console.log(`Checking contract at: ${contractAddress}`);

    // Check if contract is deployed
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ Contract NOT deployed on localhost");
      process.exit(1);
    }

    console.log("✅ Contract IS deployed on localhost");
    console.log(`   Code length: ${code.length} bytes`);

    // Basic ABI for testing
    const abi = [
      "function getElectionCount() view returns (uint256)",
      "function createElection(string, string, string[], uint256) returns (uint256)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Test basic functionality
    const count = await contract.getElectionCount();
    console.log(`✅ Contract functional - Current election count: ${count}`);

    // Get network info
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block: ${blockNumber}`);

    console.log("\n🎉 Contract verification successful!");
    console.log("Ready for testing and development.");

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
