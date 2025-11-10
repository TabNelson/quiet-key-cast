import { ethers } from "ethers";

async function main() {
  console.log("🔍 Checking contract deployment status...\n");

  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  
  try {
    // Check if Hardhat node is running
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Hardhat node is running (Block:", blockNumber, ")");

    // Check contract address
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x") {
      console.log("❌ Contract NOT deployed at:", contractAddress);
      console.log("\n💡 Solution: Run the following command:");
      console.log("   npx hardhat deploy --network localhost");
    } else {
      console.log("✅ Contract IS deployed at:", contractAddress);
      console.log("   Code length:", code.length, "bytes");
      
      // Try to read from contract
      try {
        const abi = [
          "function getElectionCount() view returns (uint256)"
        ];
        const contract = new ethers.Contract(contractAddress, abi, provider);
        const count = await contract.getElectionCount();
        console.log("✅ Contract is functional - Election count:", count.toString());
      } catch (error: any) {
        console.log("⚠️  Contract deployed but may have issues:", error.message);
      }
    }
  } catch (error: any) {
    console.log("❌ Cannot connect to Hardhat node:", error.message);
    console.log("\n💡 Solution: Start Hardhat node first:");
    console.log("   npx hardhat node");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

