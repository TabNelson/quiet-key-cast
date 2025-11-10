import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

<<<<<<< HEAD
  const deployedAnonymousElection = await deploy("AnonymousElection", {
=======
  const deployedRatingSystem = await deploy("EncryptedRatingSystem", {
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463
    from: deployer,
    log: true,
  });

<<<<<<< HEAD
  console.log(`AnonymousElection contract: `, deployedAnonymousElection.address);
};
export default func;
func.id = "deploy_anonymousElection"; // id required to prevent reexecution
func.tags = ["AnonymousElection"];
=======
  console.log(`EncryptedRatingSystem contract: `, deployedRatingSystem.address);
};
export default func;
func.id = "deploy_rating_system"; // id required to prevent reexecution
func.tags = ["EncryptedRatingSystem"];
>>>>>>> 1f89f3d9863028fc4f7ed99c3c0a22b9ce9bb463
