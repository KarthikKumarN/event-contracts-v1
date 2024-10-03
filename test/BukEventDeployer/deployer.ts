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

describe("BukEventProtocolDeployer Bookings", function () {
  let stableTokenContract;
  let deployerContract;
  let bukEventProtocolContract;
  let bukEventProtocolContract1;
  let signatureVerifierContract;
  let royaltiesContract;
  let owner;
  let account1;
  let account2;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;
  let marketplaceContract;

  beforeEach("Deploy the contract instance first", async function () {
    [
      owner,
      bukEventProtocolContract1,
      account1,
      account2,
      adminWallet,
      bukWallet,
    ] = await ethers.getSigners();
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
    bukEventProtocolContract = await BukEventProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukEventProtocolContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    const BukEventDeployerFactory =
      await ethers.getContractFactory("BukEventDeployer");
    deployerContract = await BukEventDeployerFactory.deploy(
      await bukEventProtocolContract.getAddress(),
      await marketplaceContract.getAddress(),
    );
    // Grant the BUK_EVENT_PROTOCOL_ROLE to the deployerContract contract
    await deployerContract.grantRole(
      await deployerContract.BUK_EVENT_PROTOCOL_ROLE(),
      await bukEventProtocolContract1.getAddress(),
    );

    await bukEventProtocolContract.setEventDeployerContract(
      await deployerContract.getAddress(),
    );
  });

  // Create a testcase for deployEventNFT function from BukEventDeployer
  describe("Book rooms by admin in Buk Protocol", function () {
    it("should deploy a new BukNFTs contract", async function () {
      const eventName = "Web3 Carnival";
      expect(
        await deployerContract
          .connect(bukEventProtocolContract1)
          .deployEventNFT(
            eventName,
            await bukEventProtocolContract.getAddress(),
            await bukTreasuryContract.getAddress(),
          ),
      ).not.be.reverted;
    });
    it("should deploy a new BukNFTs contract and emit event", async function () {
      const eventName = "Web3 Carnival";
      const result = await deployerContract
        .connect(bukEventProtocolContract1)
        .deployEventNFT(
          eventName,
          await bukEventProtocolContract.getAddress(),
          await bukTreasuryContract.getAddress(),
        );
      const receipt = await result.wait();

      await expect(
        await deployerContract
          .connect(bukEventProtocolContract1)
          .deployEventNFT(
            eventName,
            await bukEventProtocolContract.getAddress(),
            await bukTreasuryContract.getAddress(),
          ),
      )
        .to.emit(deployerContract, "DeployedEventNFT")
        .withArgs(eventName);
    });
    // it("should deploy a new BukNFTs contract", async function () {
    //   const result = await deployerContract
    //     .connect(bukEventProtocolContract1)
    //     .deployEventNFT(
    //       "EventName",
    //       await bukEventProtocolContract.getAddress(),
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

  // Create a test cases for setBukEventProtocol function from BukEventDeployer
  describe("Set Buk Event Protocol in Deployer", function () {
    it("Should set Buk Event Protocol in deployer", async function () {
      await expect(
        await deployerContract.setBukEventProtocol(
          await bukEventProtocolContract.getAddress(),
        ),
      ).not.be.reverted;
    });

    it("Should set Buk Event Protocol in deployer and check", async function () {
      await expect(
        await deployerContract.setBukEventProtocol(
          await bukEventProtocolContract.getAddress(),
        ),
      ).not.be.reverted;

      await expect(await deployerContract.bukEventProtocolContract()).to.equal(
        await bukEventProtocolContract.getAddress(),
      );
    });
    it("Should fail set Buk Protocol in deployer for 0 address", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        deployerContract.setBukEventProtocol(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Create a test cases for setsBukMarketplace function from BukEventDeployer
  describe("Set marketplace in Deployer", function () {
    it("Should set setBukMarketplace in deployer", async function () {
      await expect(
        await deployerContract.setBukMarketplace(
          await marketplaceContract.getAddress(),
        ),
      ).not.be.reverted;
    });

    it("Should set marketplace in deployer and check", async function () {
      await expect(
        await deployerContract.setBukMarketplace(
          await marketplaceContract.getAddress(),
        ),
      ).not.be.reverted;

      await expect(await deployerContract.bukMarketplaceContract()).to.equal(
        await marketplaceContract.getAddress(),
      );
    });
    it("Should fail set marketplace in deployer for 0 address", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        deployerContract.setBukMarketplace(newContract),
      ).to.be.revertedWith("Invalid address");

      await expect(await deployerContract.bukMarketplaceContract()).to.equal(
        await marketplaceContract.getAddress(),
      );
    });
  });

  // Add test case to test setNFTMarketplaceRole
  describe("Test set NFT marketplace function", function () {
    it("Should set marketplace BukNFTs contract", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      await expect(
        await deployerContract.setNFTMarketplaceRole(
          eventDetails[9],
          account1.address,
        ),
      ).not.be.reverted;
    });

    it("Should set marketplace BukNFTs contract and check role", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      const MARKETPLACE_CONTRACT_ROLE =
        "0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f";

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      let eventAddress = eventDetails[9];
      await expect(
        await deployerContract.setNFTMarketplaceRole(
          eventAddress,
          account1.address,
        ),
      ).not.be.reverted;

      let eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventAddress,
      );

      await expect(
        await eventNFTContract.hasRole(
          MARKETPLACE_CONTRACT_ROLE,
          account1.address,
        ),
      ).to.equal(true);
    });

    it("Should not have MARKETPLACE role", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      const MARKETPLACE_CONTRACT_ROLE =
        "0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f";

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      let eventAddress = eventDetails[9];

      let eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventAddress,
      );

      await expect(
        await eventNFTContract.hasRole(
          MARKETPLACE_CONTRACT_ROLE,
          account1.address,
        ),
      ).to.equal(false);
    });

    it("Should not set MARKETPLACE role, Permission error", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      const MARKETPLACE_CONTRACT_ROLE =
        "0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f";

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      let eventAddress = eventDetails[9];

      let eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventAddress,
      );

      await expect(
        deployerContract
          .connect(account1)
          .setNFTMarketplaceRole(eventAddress, account1.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await eventNFTContract.ADMIN_ROLE()}`,
      );
    });
  });

  // Add test case to test setNFTMarketplaceRole
  describe("Test revoke NFT marketplace function", function () {
    it("Should set marketplace BukNFTs  and revoke contract", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      await expect(
        await deployerContract.setNFTMarketplaceRole(
          eventDetails[9],
          account1.address,
        ),
      ).not.be.reverted;

      await expect(
        await deployerContract.revokeNFTMarketplaceRole(
          eventDetails[9],
          account1.address,
        ),
      ).not.be.reverted;
    });

    it("Should set and revoke marketplace BukNFTs contract and check role", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      const MARKETPLACE_CONTRACT_ROLE =
        "0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f";

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      let eventAddress = eventDetails[9];
      await expect(
        await deployerContract.setNFTMarketplaceRole(
          eventAddress,
          account1.address,
        ),
      ).not.be.reverted;

      let eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventAddress,
      );

      await expect(
        await eventNFTContract.hasRole(
          MARKETPLACE_CONTRACT_ROLE,
          account1.address,
        ),
      ).to.equal(true);

      await expect(
        await deployerContract.revokeNFTMarketplaceRole(
          eventDetails[9],
          account1.address,
        ),
      ).not.be.reverted;

      await expect(
        await eventNFTContract.hasRole(
          MARKETPLACE_CONTRACT_ROLE,
          account1.address,
        ),
      ).to.equal(false);
    });

    it("Should not revoke MARKETPLACE role, Permission error", async function () {
      // Create event
      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 5 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      const eventName = "Web3 Carnival";
      const refId =
        "0x3633666663356135366139343361313561626261336134630000000000000000";
      const _eventType = 1;
      const _start = startFromNow;
      const _end = endFromNow;
      const _noOfTickets = 10000;
      const _total = 100000000;
      const _baseRate = 80000000;
      const _tradeTimeLimit = 24;
      const _tradeable = true;

      const MARKETPLACE_CONTRACT_ROLE =
        "0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f";

      await bukEventProtocolContract.createEvent(
        eventName,
        refId,
        _eventType,
        _start,
        _end,
        _noOfTickets,
        _tradeTimeLimit,
        account1.address,
      );
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      let eventAddress = eventDetails[9];

      let eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventAddress,
      );

      await expect(
        deployerContract
          .connect(account1)
          .revokeNFTMarketplaceRole(eventAddress, account1.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await eventNFTContract.ADMIN_ROLE()}`,
      );
    });
  });
});
