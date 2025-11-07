import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedRatingSystem = await deploy("EncryptedRatingSystem", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedRatingSystem contract: `, deployedRatingSystem.address);
};
export default func;
func.id = "deploy_rating_system"; // id required to prevent reexecution
func.tags = ["EncryptedRatingSystem"];
