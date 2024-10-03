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

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukEventProtocolContract.getAddress(),
      // nftContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    // Deployer
    const BukEventDeployerFactory =
      await ethers.getContractFactory("BukEventDeployer");
    deployerContract = await BukEventDeployerFactory.deploy(
      await bukEventProtocolContract.getAddress(),
      await account1.address,
    );

    //Set Buk Royalty Info in BukRoyalties
    await royaltiesContract.setBukRoyaltyInfo(bukTreasuryContract, 200);
    //Set Hotel Royalty Info in BukRoyalties
    await royaltiesContract.setHotelRoyaltyInfo(bukTreasuryContract, 200);
    //Set First Owner Royalty Info in BukRoyalties
    await royaltiesContract.setFirstOwnerRoyaltyInfo(200);
    //Set Buk Treasury in BukNFTs
    // await nftContract.setBukTreasury(await bukTreasuryContract.getAddress());

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
    const _end = endFromNow;
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

      const eventNFTContract = await ethers.getContractAt(
        "BukNFTs",
        eventDetails[9],
      );
      const contractName = await eventNFTContract.name();
      expect(contractName).to.equal(eventName);
    });

    it("Should fail create a new event, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .createEvent(
            eventName,
            refId,
            _eventType,
            _start,
            _end,
            _noOfTickets,
            _tradeTimeLimit,
            account1.address,
          ),
      ).to.be.revertedWith("Only admin");
    });
  });

  // Add test cases for setAdmin function
  describe("Test setAdmin function", function () {
    it("should set admin", async function () {
      expect(await bukEventProtocolContract.setAdmin(account1.address)).not.be
        .reverted;
    });

    it("should set admin and verify", async function () {
      await bukEventProtocolContract.setAdmin(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[6]).to.equal(account1.address);
    });

    it("should fail set admin, Only admin", async function () {
      await expect(
        bukEventProtocolContract.connect(account1).setAdmin(account1.address),
      ).to.be.revertedWith("Only admin");
    });
  });

  // Add test cases for setAdmin function
  describe("Test setSignatureVerifier function", function () {
    it("should setSignatureVerifier", async function () {
      expect(
        await bukEventProtocolContract.setSignatureVerifier(account1.address),
      ).not.be.reverted;
    });

    it("should set signature and verify", async function () {
      await bukEventProtocolContract.setSignatureVerifier(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[2]).to.equal(account1.address);
    });

    it("should fail set signature, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .setSignatureVerifier(account1.address),
      ).to.be.revertedWith("Only admin");
    });
  });

  // Add test cases for setBukWallet function
  describe("Test setBukWallet function", function () {
    it("should setBukWallet", async function () {
      expect(await bukEventProtocolContract.setBukWallet(account1.address)).not
        .be.reverted;
    });

    it("should set setBukWallet and verify", async function () {
      await bukEventProtocolContract.setBukWallet(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[5]).to.equal(account1.address);
    });

    it("should fail set setBukWallet, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .setBukWallet(account1.address),
      ).to.be.revertedWith("Only admin");
    });
    it("should fail set setBukWallet, Zero address", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukEventProtocolContract.setBukWallet(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Add test cases for setBukTreasury function
  describe("Test setBukTreasury function", function () {
    it("should setBukTreasury", async function () {
      expect(await bukEventProtocolContract.setBukTreasury(account1.address))
        .not.be.reverted;
    });

    it("should set setBukTreasury and verify", async function () {
      await bukEventProtocolContract.setBukTreasury(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[3]).to.equal(account1.address);
    });

    it("should fail set setBukTreasury, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .setBukTreasury(account1.address),
      ).to.be.revertedWith("Only admin");
    });
    it("should fail set setBukTreasury, Zero address", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukEventProtocolContract.setBukTreasury(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Add test cases for setStableToken function
  describe("Test setStableToken function", function () {
    it("should setStableToken", async function () {
      expect(await bukEventProtocolContract.setStableToken(account1.address))
        .not.be.reverted;
    });

    it("should set setStableToken and verify", async function () {
      await bukEventProtocolContract.setStableToken(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[4]).to.equal(account1.address);
    });

    it("should fail set setStableToken, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .setStableToken(account1.address),
      ).to.be.revertedWith("Only admin");
    });
    it("should fail set setStableToken, Zero address", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukEventProtocolContract.setStableToken(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Add test cases for setRoyaltiesContract function
  describe("Test setRoyaltiesContract function", function () {
    it("should setRoyaltiesContract", async function () {
      expect(
        await bukEventProtocolContract.setRoyaltiesContract(account1.address),
      ).not.be.reverted;
    });

    it("should set setRoyaltiesContract and verify", async function () {
      await bukEventProtocolContract.setRoyaltiesContract(account1.address);
      let wallets = await bukEventProtocolContract.getWallets();
      expect(wallets[1]).to.equal(account1.address);
    });

    it("should fail set setRoyaltiesContract, Only admin", async function () {
      await expect(
        bukEventProtocolContract
          .connect(account1)
          .setRoyaltiesContract(account1.address),
      ).to.be.revertedWith("Only admin");
    });
  });
});
