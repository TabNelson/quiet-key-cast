import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance! Need at least 0.01 ETH");
    console.error("Please get Sepolia testnet ETH from a faucet:");
    console.error("  - https://sepoliafaucet.com/");
    console.error("  - https://www.infura.io/faucet/sepolia");
    process.exit(1);
  }

  console.log("\n📦 Deploying EncryptedRatingSystem...");
  
  const EncryptedRatingSystem = await ethers.getContractFactory("EncryptedRatingSystem");
  const ratingSystem = await EncryptedRatingSystem.deploy();

  await ratingSystem.waitForDeployment();

  const address = await ratingSystem.getAddress();
  console.log("\n✅ EncryptedRatingSystem deployed to:", address);
  console.log("\n📝 Next steps:");
  console.log("1. Update ui/src/abi/RatingSystemAddresses.ts with the new address");
  console.log("2. Restart the frontend: cd ui && npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
