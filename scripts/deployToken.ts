import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "🚀 ~ 🚀 ~ Deploying contracts with the account:",
    deployer.address,
  );

  // Deploy TOKEN - Use exiting one if its already deployed
  const tokenArgs = [
    "BUK-USDC",
    "BUK-USDC",
    6,
    deployer.address,
    1000000000000000,
  ];
  const token = await ethers.deployContract("Token", tokenArgs);
  console.log("🚀 ~ Deployed Token:", token.target);
  await token.waitForDeployment();

  console.log("🚀 ~ All contracts have been deployed");
  console.log("🚀 ~ 🚀 ~ Verifying contracts");

  await run("verify:verify", {
    address: token.target,
    constructorArguments: tokenArgs,
  });

  console.log("Contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
  });
