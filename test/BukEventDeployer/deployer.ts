import { expect } from "chai";
import { ethers } from "hardhat";
import {
  keccak256,
  toUtf8Bytes,
  AbiCoder,
  toBeArray,
  ethers as eth,
  recoverAddress,
} from "ethers";

describe("BukEventProtocol Bookings", function () {
  let stableTokenContract;
  let deployerContract;
  let bukProtocolContract;
  let bukProtocolContract1;
  let signatureVerifierContract;
  let royaltiesContract;
  let owner;
  let account1;
  let account2;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;

  beforeEach("Deploy the contract instance first", async function () {
    [owner, bukProtocolContract1, account1, account2, adminWallet, bukWallet] =
      await ethers.getSigners();
    // Token
    const Token = await ethers.getContractFactory("Token");
    stableTokenContract = await Token.deploy(
      "USD Dollar",
      "USDC",
      18,
      owner.address,
      2000000,
    );

    //BukTreasury
    const BukTreasury = await ethers.getContractFactory("BukTreasury");
    bukTreasuryContract = await BukTreasury.deploy(
      stableTokenContract.getAddress(),
    );

    //Deploy SignatureVerifier contract
    const SignatureVerifier =
      await ethers.getContractFactory("SignatureVerifier");
    signatureVerifierContract = await SignatureVerifier.deploy();

    //Deploy BukRoyalties contract
    const BukRoyalties = await ethers.getContractFactory("BukRoyalties");
    royaltiesContract = await BukRoyalties.deploy();

    //BukEventProtocol
    const BukEventProtocol =
      await ethers.getContractFactory("BukEventProtocol");
    bukProtocolContract = await BukEventProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );

    const BukEventDeployerFactory =
      await ethers.getContractFactory("BukEventDeployer");
    deployerContract = await BukEventDeployerFactory.deploy(
      await bukProtocolContract.getAddress(),
      await account1.address,
    );
    // Grant the BUK_EVENT_PROTOCOL_ROLE to the deployerContract contract
    await deployerContract.grantRole(
      await deployerContract.BUK_EVENT_PROTOCOL_ROLE(),
      await bukProtocolContract1.getAddress(),
    );

    await bukProtocolContract.setEventDeployerContract(
      await deployerContract.getAddress(),
    );
  });

  // Create a testcase for deployEventNFT function from BukEventDeployer
  describe("Book rooms by admin in Buk Protocol", function () {
    it("should deploy a new BukNFTs contract", async function () {
      const eventName = "Web3 Carnival";
      expect(
        await deployerContract
          .connect(bukProtocolContract1)
          .deployEventNFT(
            eventName,
            await bukProtocolContract.getAddress(),
            await bukTreasuryContract.getAddress(),
          ),
      ).not.be.reverted;
    });
    it("should deploy a new BukNFTs contract and emit event", async function () {
      const eventName = "Web3 Carnival";
      const result = await deployerContract
        .connect(bukProtocolContract1)
        .deployEventNFT(
          eventName,
          await bukProtocolContract.getAddress(),
          await bukTreasuryContract.getAddress(),
        );
      const receipt = await result.wait();

      await expect(
        await deployerContract
          .connect(bukProtocolContract1)
          .deployEventNFT(
            eventName,
            await bukProtocolContract.getAddress(),
            await bukTreasuryContract.getAddress(),
          ),
      )
        .to.emit(deployerContract, "DeployedEventNFT")
        .withArgs(eventName);
    });
    // it("should deploy a new BukNFTs contract", async function () {
    //   const result = await deployerContract
    //     .connect(bukProtocolContract1)
    //     .deployEventNFT(
    //       "EventName",
    //       await bukProtocolContract.getAddress(),
    //       await bukTreasuryContract.getAddress(),
    //     );
    //   const receipt = await result.wait();

    //   // Check if events were emitted
    //   expect(receipt.events).to.not.be.undefined;

    //   if (receipt.events) {
    //     // Find the event containing the deployed contract address
    //     const event = receipt.events.find(
    //       (e) => e.event === "DeployedEventNFT",
    //     );

    //     // Check if the event was found and contains the expected argument
    //     expect(event).to.not.be.undefined;

    //     if (event) {
    //       const eventNFTAddress = event.args[0];
    //       const eventNFT = await ethers.getContractAt(
    //         "BukNFTs",
    //         eventNFTAddress,
    //       );
    //       const name = await eventNFT.name();

    //       expect(name).to.equal("EventName");
    //     }
    //   }
    // });
  });
});
