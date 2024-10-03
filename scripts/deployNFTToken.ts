import { ethers, run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "🚀 ~ 🚀 ~ Deploying contracts with the account:",
    deployer.address,
  );

  const minterRole = "0x3329c686DF899dFC4d1Ea3e8ACcceB187b3973d0";
  const contractName = "Buk Protocol - Chainwarz Berachain Captain";
  const contractSymbol = "BUK Captain";
  const tokenURI =
    "https://ipfs.io/ipfs/bafkreict7waupznjfs43ovwcfanojkdi76womjd67wjfthxcw6vx3nxv4u";

  // Deploy NFT Use exiting one if its already deployed
  const tokenArgs = [
    deployer.address,
    minterRole,
    contractName,
    contractSymbol,
    tokenURI,
  ];
  const token = await ethers.deployContract("BukRewardNFT", tokenArgs);
  console.log("🚀 ~ Deployed Token:", token.target);
  await token.waitForDeployment();

  console.log("🚀 ~ All contracts have been deployed");
  console.log("🚀 ~ 🚀 ~ Verifying contracts");

  // add settimeout
  console.log("Timestamp 1: ", Date.now());
  await new Promise((resolve) => setTimeout(resolve, 20000));
  console.log("Timestamp 2 : ", Date.now());
  await run("verify:verify", {
    address: token.target,
    constructorArguments: tokenArgs,
  });

  console.log("Contracts NFT verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
  });
