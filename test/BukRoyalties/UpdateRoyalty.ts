import { expect } from "chai";
import { ethers } from "hardhat";

describe("BukRoyalty", function () {
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
  // let nftContract;
  let sellerWallet;
  let buyerWallet;
  let eventDetails;
  let eventAddress;
  let eventNFTContract;
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

    //EventProtocol
    const EventProtocol = await ethers.getContractFactory("BukEventProtocol");
    bukEventProtocolContract = await EventProtocol.deploy(
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

    // Deployer
    const BukEventDeployerFactory =
      await ethers.getContractFactory("BukEventDeployer");
    deployerContract = await BukEventDeployerFactory.deploy(
      await bukEventProtocolContract.getAddress(),
      await marketplaceContract.getAddress(),
    );

    //Set Buk Royalty Info in BukRoyalties
    await royaltiesContract.setBukRoyaltyInfo(bukTreasuryContract, 200);
    //Set Hotel Royalty Info in BukRoyalties
    await royaltiesContract.setHotelRoyaltyInfo(bukTreasuryContract, 200);
    //Set First Owner Royalty Info in BukRoyalties
    await royaltiesContract.setFirstOwnerRoyaltyInfo(200);

    await royaltiesContract.setBukEventProtocolContract(
      bukEventProtocolContract.getAddress(),
    );
    // //Set Buk Treasury in BukNFTs
    // await nftContract.setBukTreasury(await bukTreasuryContract.getAddress());

    // Set deployer contract
    await bukEventProtocolContract.setEventDeployerContract(
      await deployerContract.getAddress(),
    );

    //Grant allowance permission
    const res = await stableTokenContract
      .connect(owner)
      .approve(await bukEventProtocolContract.getAddress(), 150000000);

    // Create event
    const now = Math.floor(Date.now() / 1000);
    const tenDays = 10 * 24 * 60 * 60;
    const tenDaysFromNow = now + tenDays;
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
    eventDetails = await bukEventProtocolContract.getEventDetails(1);
    eventAddress = eventDetails[9];
    eventNFTContract = await ethers.getContractAt("BukNFTs", eventAddress);

    let eventId = 1;
    let bookingRefId = [
      "0x3633666663356135366139343361313561626261336134630000000000000000",
    ];
    let total = [100000000];
    let baseRate = [80000000];
    let start = [startFromNow];
    let end = [endFromNow];
    let tradeable = [true];
    let nftIds = [1];
    let urls = [
      "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
    ];

    await bukEventProtocolContract
      .connect(owner)
      .bookEvent(eventId, bookingRefId, total, baseRate, start, end, tradeable);

    await bukEventProtocolContract.mintBukNFTOwner(eventId, nftIds, urls);
  });

  describe("Test Other royalties", function () {
    it("Should set other Royalty by admin", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).not.be.reverted;
      const royaltyInfo = await royaltiesContract.getRoyaltyInfo(
        eventAddress,
        1,
      );
      const royalties: number[] = [];
      for (let i = 3; i < royaltyInfo.length; i++) {
        expect(royaltyFractions[i - 3]).to.equal(royaltyInfo[i][1]);
      }
    });
    it("Should set other Royalty and emit events", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      )
        .to.emit(royaltiesContract, "SetOtherRoyalties")
        .withArgs([], [2000, 3000]);
    });
    it("Should set and replace the existing other royalties by admin", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).not.be.reverted;
      const royaltyInfo = await royaltiesContract.getRoyaltyInfo(
        eventAddress,
        1,
      );
      for (let i = 3; i < royaltyInfo.length; i++) {
        expect(royaltyFractions[i - 3]).to.equal(royaltyInfo[i][1]);
      }

      //Setting new royalties and check the update
      const newRoyaltyFractions = [4000, 1000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, newRoyaltyFractions),
      ).not.be.reverted;
      const newRoyaltyInfo = await royaltiesContract.getRoyaltyInfo(
        eventAddress,
        1,
      );
      for (let i = 3; i < newRoyaltyInfo.length; i++) {
        expect(newRoyaltyFractions[i - 3]).to.equal(newRoyaltyInfo[i][1]);
      }
    });
    it("Should not set other Royalty if not admin", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      await expect(
        royaltiesContract
          .connect(account1)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.reverted;
    });
    it("Should not set other Royalty if array size mismatch is there", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Arrays must have the same length");
    });
    it("Should not set other Royalty if total royalty fee is more than 10000", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [20000, 1000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Royalty is more than 10000");
    });
    it("Should not set other Royalty if royalty fee is more than 10000", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [8000, 8000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Total cannot be more than 10000");
    });
  });
});
