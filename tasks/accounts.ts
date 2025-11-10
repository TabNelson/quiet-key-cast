import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    // Format large numbers with commas for better readability
    const formattedBalance = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6
    }).format(parseFloat(balanceInEth));
    console.log(`${account.address}: ${formattedBalance} ETH`);
  }
});
