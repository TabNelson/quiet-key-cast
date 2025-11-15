import { ethers } from "ethers";

async function main() {
  console.log("🔍 Analyzing contract bytecode and gas usage...\n");

  // Connect to localhost network
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  try {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Get contract bytecode
    const code = await provider.getCode(contractAddress);
    console.log(`📏 Contract bytecode size: ${code.length} bytes`);
    console.log(`📊 Estimated bytecode size: ${Math.ceil((code.length - 2) / 2)} bytes\n`);

    // Basic ABI for gas estimation
    const abi = [
      "function createElection(string, string, string[], uint256) returns (uint256)",
      "function vote(uint256, bytes32, bytes)",
      "function getElection(uint256) view returns (string, string, uint256, string[], uint256, bool, bool, address, uint256)"
    ];

    const contract = new ethers.Contract(contractAddress, abi, provider);

    console.log("⛽ Gas estimation for common operations:\n");

    // Estimate gas for election creation
    try {
      const candidates = ["Alice", "Bob", "Carol"];
      const gasEstimate = await contract.createElection.estimateGas(
        "Test Election",
        "Description",
        candidates,
        24
      );
      console.log(`📝 Create election: ${gasEstimate} gas units`);
    } catch (error) {
      console.log(`❌ Could not estimate createElection gas: ${(error as Error).message}`);
    }

    // Estimate gas for voting
    try {
      const gasEstimate = await contract.vote.estimateGas(0, ethers.ZeroHash, "0x");
      console.log(`🗳️  Cast vote: ${gasEstimate} gas units`);
    } catch (error) {
      console.log(`❌ Could not estimate vote gas: ${(error as Error).message}`);
    }

    // Estimate gas for reading election data
    try {
      const gasEstimate = await contract.getElection.estimateGas(0);
      console.log(`📖 Get election: ${gasEstimate} gas units`);
    } catch (error) {
      console.log(`❌ Could not estimate getElection gas: ${(error as Error).message}`);
    }

    console.log("\n✅ Contract analysis complete!");

  } catch (error: any) {
    console.error("❌ Analysis failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
