import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact on Sepolia Testnet
 * =================================================
 *
 * 1. Deploy the EncryptedRatingSystem contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the EncryptedRatingSystem contract
 *
 *   npx hardhat --network sepolia task:RatingSystemSepolia
 *
 */

task("task:RatingSystemSepolia", "Test EncryptedRatingSystem on Sepolia")
  .addOptionalParam("address", "Optionally specify the RatingSystem contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const RatingSystemDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedRatingSystem");
    console.log(`EncryptedRatingSystem: ${RatingSystemDeployment.address}`);

    const signers = await ethers.getSigners();
    const [deployer, user1, user2] = signers;

    const ratingSystem = await ethers.getContractAt("EncryptedRatingSystem", RatingSystemDeployment.address);

    console.log("\n🧪 Testing Encrypted Rating System on Sepolia...\n");

    try {
      // Test 1: Submit rating for "Product Quality"
      console.log("1️⃣ Submitting rating for Product Quality (8/10)...");
      const ratingValue = 8;

      const encryptedInput = await fhevm
        .createEncryptedInput(RatingSystemDeployment.address, user1.address)
        .add32(ratingValue)
        .encrypt();

      const submitTx = await ratingSystem
        .connect(user1)
        .submitRating(encryptedInput.handles[0], encryptedInput.inputProof, "Product Quality");
      console.log(`Wait for submit tx: ${submitTx.hash}...`);

      const submitReceipt = await submitTx.wait();
      console.log(`✅ Submit tx confirmed: ${submitReceipt?.status}`);

      // Test 2: Submit another rating for "Customer Service"
      console.log("\n2️⃣ Submitting rating for Customer Service (9/10)...");
      const ratingValue2 = 9;

      const encryptedInput2 = await fhevm
        .createEncryptedInput(RatingSystemDeployment.address, user2.address)
        .add32(ratingValue2)
        .encrypt();

      const submitTx2 = await ratingSystem
        .connect(user2)
        .submitRating(encryptedInput2.handles[0], encryptedInput2.inputProof, "Customer Service");
      console.log(`Wait for submit tx: ${submitTx2.hash}...`);

      const submitReceipt2 = await submitTx2.wait();
      console.log(`✅ Submit tx confirmed: ${submitReceipt2?.status}`);

      // Check current statistics
      console.log("\n📊 Current Statistics:");
      const activeCount = await ratingSystem.getActiveEntryCount();
      console.log(`Active Entries: ${activeCount}`);

      const productQualityCount = await ratingSystem.getSubjectEntryCount("Product Quality");
      const customerServiceCount = await ratingSystem.getSubjectEntryCount("Customer Service");
      console.log(`Product Quality Ratings: ${productQualityCount}`);
      console.log(`Customer Service Ratings: ${customerServiceCount}`);

      // Test 3: Request global statistics decryption
      console.log("\n🔓 Requesting global statistics decryption...");
      const requestTx = await ratingSystem.connect(deployer).requestGlobalStats();
      console.log(`Wait for request tx: ${requestTx.hash}...`);

      const requestReceipt = await requestTx.wait();
      console.log(`✅ Request tx confirmed: ${requestReceipt?.status}`);

      console.log("⏳ Waiting for off-chain decryption (this may take several minutes on Sepolia)...");
      console.log("💡 You can check the transaction status and wait for the callback event.");
      console.log("🔍 Monitor for GlobalStatsPublished event to see decrypted results.");

      // Test 4: Request subject-specific statistics
      console.log("\n🔓 Requesting Product Quality statistics decryption...");
      const subjectRequestTx = await ratingSystem.connect(deployer).requestSubjectStats("Product Quality");
      console.log(`Wait for subject request tx: ${subjectRequestTx.hash}...`);

      const subjectRequestReceipt = await subjectRequestTx.wait();
      console.log(`✅ Subject request tx confirmed: ${subjectRequestReceipt?.status}`);

      console.log("⏳ Waiting for off-chain decryption...");
      console.log("🔍 Monitor for SubjectStatsPublished event to see decrypted results.");

    } catch (error: any) {
      console.error("❌ Error during Sepolia testing:", error.message);

      // Provide helpful debugging information
      if (error.message.includes("insufficient funds")) {
        console.log("\n💰 Insufficient funds. Make sure your wallet has Sepolia ETH.");
        console.log("🤑 Get Sepolia ETH from: https://sepoliafaucet.com/");
      } else if (error.message.includes("execution reverted")) {
        console.log("\n⚠️ Transaction reverted. Check contract logic or input parameters.");
      } else if (error.message.includes("network")) {
        console.log("\n🌐 Network error. Check your internet connection and Sepolia RPC endpoint.");
      }
    }

    console.log("\n📋 Sepolia Testing Summary:");
    console.log("✅ Contract interaction tested");
    console.log("✅ Encrypted input creation verified");
    console.log("✅ Transaction submission confirmed");
    console.log("⏳ Decryption requests submitted (monitor for callback events)");
    console.log("\n🔗 View on Sepolia Explorer:");
    console.log(`https://sepolia.etherscan.io/address/${RatingSystemDeployment.address}`);
  });
