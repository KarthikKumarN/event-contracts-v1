import { expect } from "chai";
import { ethers } from "hardhat";

describe("BukEventProtocol Bookings", function () {
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

    //Grant allowance permission
    const res = await stableTokenContract
      .connect(owner)
      .approve(await bukEventProtocolContract.getAddress(), 150000000);

    // Create event
    const now = Math.floor(Date.now() / 1000);
    const tenDays = 10 * 24 * 60 * 60;
    const tenDaysFromNow = now + tenDays;
    const eventName = "Web3 Carnival";
    const refId = 1234;
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
      _tradeable,
      account1.address,
    );
    const eventDetails = await bukEventProtocolContract.getEventDetails(1);
  });

  describe("Test Book Event function", function () {
    it("should book a event", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
    });

    it("should book event and emit", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      )
        .to.emit(bukEventProtocolContract, "EventBooked")
        .withArgs(
          eventId,
          1,
          owner.address,
          refId,
          startFromNow,
          endFromNow,
          total,
          baseRate,
          tradeable,
        );
    });

    it("should book event and verify with booking details", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;

      const bookingDetails =
        await bukEventProtocolContract.getEventBookingDetails(
          eventDetails[10],
          1,
        );
      expect(bookingDetails[4]).to.equal(total[0]);
    });

    it("should book event and verify with booking details", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;

      const bookingDetails =
        await bukEventProtocolContract.getEventBookingDetails(
          eventDetails[10],
          1,
        );
      expect(bookingDetails[4]).to.equal(total[0]);
    });
  });

  describe("Test admin booking", function () {
    it("should book event by admin", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract.bookEventOwner(
          eventId,
          refId,
          total,
          baseRate,
          start,
          end,
          tradeable,
          users,
        ),
      ).not.be.reverted;
    });
    it("should book event by admin and verify details", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract.bookEventOwner(
          eventId,
          refId,
          total,
          baseRate,
          start,
          end,
          tradeable,
          users,
        ),
      ).not.be.reverted;

      const bookingDetails =
        await bukEventProtocolContract.getEventBookingDetails(
          eventDetails[10],
          1,
        );
      expect(bookingDetails[10]).to.equal(users[0]);
    });
    it("should fail, book event only by admin", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];

      await expect(
        bukEventProtocolContract
          .connect(account1)
          .bookEventOwner(
            eventId,
            refId,
            total,
            baseRate,
            start,
            end,
            tradeable,
            users,
          ),
      ).to.be.revertedWith("Only admin has access to this function");
    });
  });

  // add test cases to test isBookingTradeable function
  describe("Test isBookingTradeable function", function () {
    it("should return true if booking is tradeable", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      const isTradeable = await bukEventProtocolContract.isBookingTradeable(
        eventDetails[10],
        1,
      );
      expect(isTradeable).to.equal(true);
    });

    it("should return false if booking is not tradeable", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [false];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      const isTradeable = await bukEventProtocolContract.isBookingTradeable(
        eventDetails[10],
        1,
      );
      expect(isTradeable).to.equal(false);
    });

    it("should return false if booking is crossed trade block time", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];

      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 1 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      const isTradeable = await bukEventProtocolContract.isBookingTradeable(
        eventDetails[10],
        1,
      );
      expect(isTradeable).to.equal(false);
    });
    it("should return true if booking is not crossed trade block time", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];

      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 2 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      const isTradeable = await bukEventProtocolContract.isBookingTradeable(
        eventDetails[10],
        1,
      );

      expect(isTradeable).to.equal(true);
    });

    it("should return false, booking is not crossed trade block but tradeable is false", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];

      const now = Math.floor(Date.now() / 1000);
      const fiveDays = 2 * 24 * 60 * 60;
      const startFromNow = now + fiveDays;
      const endFromNow = startFromNow + fiveDays;

      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [false];

      expect(
        await bukEventProtocolContract
          .connect(owner)
          .bookEvent(eventId, refId, total, baseRate, start, end, tradeable),
      ).not.be.reverted;
      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      const isTradeable = await bukEventProtocolContract.isBookingTradeable(
        eventDetails[10],
        1,
      );
      expect(isTradeable).to.equal(false);
    });
  });

  // Test cases for minting NFT
  describe("Booking and Mint", function () {
    it("should book event and mint by admin success", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];
      let nftIds = [1];
      let urls = [
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      ];

      expect(
        await bukEventProtocolContract.bookEventOwner(
          eventId,
          refId,
          total,
          baseRate,
          start,
          end,
          tradeable,
          users,
        ),
      ).not.be.reverted;

      expect(
        await bukEventProtocolContract.mintBukNFTOwner(eventId, nftIds, urls),
      ).not.be.reverted;
    });
    it("should mint event by admin and verify details", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];
      let nftIds = [1];
      let urls = [
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      ];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract.bookEventOwner(
          eventId,
          refId,
          total,
          baseRate,
          start,
          end,
          tradeable,
          users,
        ),
      ).not.be.reverted;

      expect(
        await bukEventProtocolContract.mintBukNFTOwner(eventId, nftIds, urls),
      ).not.be.reverted;

      const bookingDetails =
        await bukEventProtocolContract.getEventBookingDetails(
          eventDetails[10],
          1,
        );

      expect(bookingDetails[9]).to.equal(2); // 2 status confirmed
    });

    it("should fail, mint event only by admin", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];
      let nftIds = [1];
      let urls = [
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      ];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      expect(
        await bukEventProtocolContract.bookEventOwner(
          eventId,
          refId,
          total,
          baseRate,
          start,
          end,
          tradeable,
          users,
        ),
      ).not.be.reverted;

      await expect(
        bukEventProtocolContract
          .connect(account1)
          .mintBukNFTOwner(eventId, nftIds, urls),
      ).to.be.revertedWith("Only admin has access to this function");
    });
    it("should fail, mint event only booked", async function () {
      let eventId = 1;
      let refId = [123];
      let total = [100000000];
      let baseRate = [80000000];
      let start = [startFromNow];
      let end = [endFromNow];
      let tradeable = [true];
      let users = [account1.address];
      let nftIds = [1];
      let urls = [
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      ];

      const eventDetails = await bukEventProtocolContract.getEventDetails(1);

      await expect(
        bukEventProtocolContract.mintBukNFTOwner(eventId, nftIds, urls),
      ).to.be.revertedWith("Check the Booking status");
    });
  });
});
