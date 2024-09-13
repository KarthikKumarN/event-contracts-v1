import { ethers, run } from "hardhat";
import { USDC_CONTRACT, BUK_WALLET, ROYALTIES } from "../constants";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "🚀 ~ 🚀 ~ Deploying contracts with the account:",
    deployer.address,
  );

  const bukNftName = "Web3 Explara";
  const bukEventProtocol = "0x00d0a5A8364118195a66d843565f41790EF09035";
  const buktTreasury = "0x51A7B523a2fc46C02418E0cEC3CeEE893191a3bB";
  const bukMarketplace = "0x5649A05C93e2CbfEB7Da1Fcdb493Db2fbbb81167";

  // Deploy BukEventProtocol
  const bukNFTArgs = [
    bukNftName,
    bukEventProtocol,
    buktTreasury,
    bukMarketplace,
  ];
  // const bukNFT = await ethers.deployContract("BukNFTs", bukNFTArgs);
  // console.log("🚀 ~ Deployed BukEventProtocol:", bukEventProtocol.target);
  // await bukEventProtocol.waitForDeployment();

  console.log("🚀 ~ All contracts have been deployed");
  console.log("🚀 ~ 🚀 ~ Configuring contracts");

  console.log("🚀 All contracts have been deployed and configured");
  console.log("🚀 ~ 🚀 ~ Verifying contracts");

  // Verify BukNFT contract
  await run("verify:verify", {
    address: "0x6b0c20fa5b7e4316D8C8c8A1d8af18C9CFBC4e52",
    constructorArguments: bukNFTArgs,
  });

  console.log("Contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
  });
