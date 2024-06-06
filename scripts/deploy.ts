import { ethers, run } from "hardhat";
import { USDC_CONTRACT, BUK_WALLET, ROYALTIES } from "../constants";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "🚀 ~ 🚀 ~ Deploying contracts with the account:",
    deployer.address,
  );

  // Deploy Treasury
  const treasury = await ethers.deployContract("BukTreasury", [USDC_CONTRACT]);
  console.log("🚀 ~ Deployed BukTreasury:", treasury.target);
  await treasury.waitForDeployment();

  // FIXME NOTE If Treasury already exists, then comment the above code and uncomment the below code
  // const treasury = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // Assign Treasury address to this variable

  // Deploy SignatureVerifier
  const signatureVerifier = await ethers.deployContract(
    "SignatureVerifier",
    [],
  );
  console.log("🚀 ~ Deployed SignatureVerifier:", signatureVerifier.target);
  await signatureVerifier.waitForDeployment();

  // Deploy Royalties
  const royalties = await ethers.deployContract("BukRoyalties", []);
  console.log("🚀 ~ Deployed Royalties:", royalties.target);
  await royalties.waitForDeployment();

  // Deploy BukEventProtocol
  const bukEventProtocolArgs = [
    treasury.target,
    USDC_CONTRACT,
    BUK_WALLET,
    signatureVerifier.target,
    royalties.target,
  ];
  const bukEventProtocol = await ethers.deployContract(
    "BukEventProtocol",
    bukEventProtocolArgs,
  );
  console.log("🚀 ~ Deployed BukEventProtocol:", bukEventProtocol.target);
  await bukEventProtocol.waitForDeployment();

  // Deploy Marketplace
  const marketplaceArgs = [bukEventProtocol.target, USDC_CONTRACT];
  const marketplace = await ethers.deployContract(
    "Marketplace",
    marketplaceArgs,
  );
  console.log("🚀 ~ Deployed Marketplace:", marketplace.target);
  await marketplace.waitForDeployment();

  // Deploy BukEventDeployer
  const bukEventDeployerArgs = [bukEventProtocol.target, marketplace.target];
  const bukEventDeployer = await ethers.deployContract(
    "BukEventDeployer",
    bukEventDeployerArgs,
  );
  console.log("🚀 ~ Deployed bukEventDeployer:", bukEventDeployer.target);
  await bukEventDeployer.waitForDeployment();

  console.log("🚀 ~ All contracts have been deployed");
  console.log("🚀 ~ 🚀 ~ Configuring contracts");

  // Set Buk Protocol in Treasury
  await treasury.setBukEventProtocol(bukEventProtocol.target);

  // Set Buk Protocol in BukRoyalties
  await royalties.setBukEventProtocolContract(bukEventProtocol.target);

  // Set Buk Royalty Info in BukRoyalties
  await royalties.setBukRoyaltyInfo(
    treasury.target,
    ROYALTIES.BUK_ROYALTY_PERCENTAGE,
  );

  // Set Hotel Royalty Info in BukRoyalties
  await royalties.setHotelRoyaltyInfo(
    treasury.target,
    ROYALTIES.HOTEL_ROYALTY_PERCENTAGE,
  );

  // Set First Owner Royalty Info in BukRoyalties
  await royalties.setFirstOwnerRoyaltyInfo(
    ROYALTIES.FIRST_OWNER_ROYALTY_PERCENTAGE,
  );

  // Set Event deployer in BukProtocol
  await bukEventProtocol.setEventDeployerContract(bukEventDeployer.target);

  console.log("🚀 All contracts have been deployed and configured");
  console.log("🚀 ~ 🚀 ~ Verifying contracts");

  // Verify BukEventProtocol contract
  await run("verify:verify", {
    address: bukEventProtocol.target,
    constructorArguments: bukEventProtocolArgs,
  });

  // Verify BukEventDeployer contract
  await run("verify:verify", {
    address: bukEventDeployer.target,
    constructorArguments: bukEventDeployerArgs,
  });

  // Verify Treasury contract
  await run("verify:verify", {
    address: treasury.target,
    constructorArguments: [USDC_CONTRACT],
  });

  // Verify SignatureVerifier contract
  await run("verify:verify", {
    address: signatureVerifier.target,
    constructorArguments: [],
  });

  // Verify BukRoyalties contract
  await run("verify:verify", {
    address: royalties.target,
    constructorArguments: [],
  });

  //Verify Marketplace contract
  // await run("verify:verify", {
  //   address: marketplace.target,
  //   constructorArguments: marketplaceArgs,
  // });

  console.log("Contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
  });
