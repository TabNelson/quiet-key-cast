import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    console.log(`${account.address}: ${balanceInEth} ETH`);
  }
});
