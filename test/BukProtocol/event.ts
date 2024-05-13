import { expect } from "chai";
import { ethers } from "hardhat";

describe("EventProtocol Bookings", function () {
  // get current epoch time and add 10 days to it
  const now = Math.floor(Date.now() / 1000);
  const fiveDays = 5 * 24 * 60 * 60;
  const startFromNow = now + fiveDays;
  const endFromNow = startFromNow + fiveDays;

  let stableTokenContract;
  let bukEventProtocolContract;
  let marketplaceContract;
  let signatureVerifierContract;
  let royaltiesContract;
  let deployerContract;
  let owner;
  let account1;
  let account2;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;
  let nftContract;
  let sellerWallet;
  let buyerWallet;
  beforeEach("deploy the contract instance first", async function () {
    [
      adminWallet,
      owner,
      account1,
      account2,
      sellerWallet,
      buyerWallet,
      bukWallet,
    ] = await ethers.getSigners();

    // Token
    const Token = await ethers.getContractFactory("Token");
    stableTokenContract = await Token.deploy(
      "USD Dollar",
      "USDC",
      18,
      owner.address,
      100000000000,
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

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      bukEventProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
    );

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukEventProtocolContract.getAddress(),
      nftContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    // Deployer
    const BukEventDeployerFactory =
      await ethers.getContractFactory("BukEventDeployer");
    deployerContract = await BukEventDeployerFactory.deploy(
      await bukEventProtocolContract.getAddress(),
    );

    //Set Buk Royalty Info in BukRoyalties
    await royaltiesContract.setBukRoyaltyInfo(bukTreasuryContract, 200);
    //Set Hotel Royalty Info in BukRoyalties
    await royaltiesContract.setHotelRoyaltyInfo(bukTreasuryContract, 200);
    //Set First Owner Royalty Info in BukRoyalties
    await royaltiesContract.setFirstOwnerRoyaltyInfo(200);
    //Set Buk Treasury in BukNFTs
    await nftContract.setBukTreasury(await bukTreasuryContract.getAddress());

    // Set deployer contract
    await bukEventProtocolContract.setEventDeployerContract(
      await deployerContract.getAddress(),
    );
  });

  describe("Test Create event function", function () {
    // get current epoch time and add 10 days to it
    const now = Math.floor(Date.now() / 1000);
    const tenDays = 10 * 24 * 60 * 60;
    const tenDaysFromNow = now + tenDays;
    const eventName = "Web3 Carnival";
    const refId =
      "0x3633666663356135366139343361313561626261336134630000000000000000";
    const _eventType = 1;
    const _start = startFromNow;

    console.debug("🚀 ~ file: Event.ts:121 ~ _start:", _start);

    const _end = endFromNow;

    console.debug("🚀 ~ file: Event.ts:125 ~ _end:", _end);

    const _noOfTickets = 10000;
    const _tradeTimeLimit = 12;
    const _tradeable = true;

    it("should create a new event", async function () {
      expect(
        await bukEventProtocolContract.createEvent(
          eventName,
          refId,
          _eventType,
          _start,
          _end,
          _noOfTickets,
          _tradeTimeLimit,
          account1.address,
        ),
      ).not.be.reverted;
    });

    it("should create a new event and verify details", async function () {
      let eventResult = await bukEventProtocolContract.createEvent(
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
      expect(eventDetails[0]).to.equal(1);
      expect(eventDetails[1]).to.equal(eventName);
    });
    it("should create a new event and verify NFT", async function () {
      let eventResult = await bukEventProtocolContract.createEvent(
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

      console.debug("🚀 ~ file: Event.ts:181 ~ eventDetails:", eventDetails);

      const eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventDetails[9],
      );
      const contractName = await eventNFTContract.name();
      expect(contractName).to.equal(eventName);
    });
  });
});
