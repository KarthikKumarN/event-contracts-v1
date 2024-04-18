import { ethers, run } from "hardhat";
import {
  USDC_CONTRACT,
  BUK_WALLET,
  BUK_POS_NFT_NAME,
  BUK_NFT_NAME,
  ROYALTIES,
} from "../constants";

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
  const bukProtocolArgs = [
    treasury.target,
    USDC_CONTRACT,
    BUK_WALLET,
    signatureVerifier.target,
    royalties.target,
  ];
  const bukProtocol = await ethers.deployContract(
    "BukEventProtocol",
    bukProtocolArgs,
  );
  console.log("🚀 ~ Deployed BukEventProtocol:", bukProtocol.target);
  await bukProtocol.waitForDeployment();

  // Deploy BukPOSNFTs
  const bukPOSNFTsArgs = [
    BUK_POS_NFT_NAME,
    bukProtocol.target,
    treasury.target,
  ];
  const bukPOSNFTs = await ethers.deployContract("BukPOSNFTs", bukPOSNFTsArgs);
  console.log("🚀 ~ Deployed BukPOSNFTs:", bukPOSNFTs.target);
  await bukPOSNFTs.waitForDeployment();

  // Deploy BukNFTs
  const bukNFTsArgs = [
    BUK_NFT_NAME,
    bukPOSNFTs.target,
    bukProtocol.target,
    treasury.target,
  ];
  const bukNFTs = await ethers.deployContract("BukNFTs", bukNFTsArgs);
  console.log("🚀 ~ Deployed BukNFTs:", bukNFTs.target);
  await bukNFTs.waitForDeployment();

  // Deploy Marketplace
  const marketplaceArgs = [bukProtocol.target, bukNFTs.target, USDC_CONTRACT];
  const marketplace = await ethers.deployContract(
    "Marketplace",
    marketplaceArgs,
  );
  console.log("🚀 ~ Deployed Marketplace:", marketplace.target);
  await marketplace.waitForDeployment();

  console.log("🚀 ~ All contracts have been deployed");

  console.log("🚀 ~ 🚀 ~ Configuring contracts");

  //Set BukNFTs address in BukPOSNFTs
  await bukPOSNFTs.setBukNFTRole(bukNFTs.target);

  //Set BukNFTs address in Buk Protocol
  await bukProtocol.setBukNFTs(bukNFTs.target);

  //Set BukPOSNFTs address in Buk Protocol
  await bukProtocol.setBukPOSNFTs(bukPOSNFTs.target);

  //Set Buk Protocol in Treasury
  await treasury.setBukEventProtocol(bukProtocol.target);

  //Set Buk Treasury in BukNFTs
  await bukNFTs.setBukTreasury(treasury.target);

  //Set Marketplace in BukNFTs
  await bukNFTs.setMarketplaceRole(marketplace.target);

  //Set Buk Protocol in BukRoyalties
  await royalties.setBukEventProtocolContract(bukProtocol.target);

  //Set Buk Royalty Info in BukRoyalties
  await royalties.setBukRoyaltyInfo(
    treasury.target,
    ROYALTIES.BUK_ROYALTY_PERCENTAGE,
  );

  //Set Hotel Royalty Info in BukRoyalties
  await royalties.setHotelRoyaltyInfo(
    treasury.target,
    ROYALTIES.HOTEL_ROYALTY_PERCENTAGE,
  );

  //Set First Owner Royalty Info in BukRoyalties
  await royalties.setFirstOwnerRoyaltyInfo(
    ROYALTIES.FIRST_OWNER_ROYALTY_PERCENTAGE,
  );

  console.log("🚀 All contracts have been deployed and configured");
  console.log("🚀 ~ 🚀 ~ Verifying contracts");

  //Verify Treasury contract
  await run("verify:verify", {
    address: treasury.target,
    constructorArguments: [USDC_CONTRACT],
  });

  //Verify SignatureVerifier contract
  await run("verify:verify", {
    address: signatureVerifier.target,
    constructorArguments: [],
  });

  //Verify BukRoyalties contract
  await run("verify:verify", {
    address: royalties.target,
    constructorArguments: [],
  });

  //Verify BukEventProtocol contract
  await run("verify:verify", {
    address: bukProtocol.target,
    constructorArguments: bukProtocolArgs,
  });

  //Verify BukPOSNFTs contract
  await run("verify:verify", {
    address: bukPOSNFTs.target,
    constructorArguments: bukPOSNFTsArgs,
  });

  //Verify BukNFTs contract
  await run("verify:verify", {
    address: bukNFTs.target,
    constructorArguments: bukNFTsArgs,
  });

  //Verify Marketplace contract
  await run("verify:verify", {
    address: marketplace.target,
    constructorArguments: marketplaceArgs,
  });

  console.log("Contracts verified!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error);
    process.exit(1);
  });
