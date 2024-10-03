import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("BukEventProtocol Access Control", function () {
  let stableTokenContract;
  let bukEventProtocolContract;
  let marketplaceContract;
  let signatureVerifierContract;
  let royaltiesContract;
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
      10000000000,
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
    // const BukNFT = await ethers.getContractFactory("BukNFTs");
    // nftContract = await BukNFT.deploy(
    //   "BUK_NFT",
    //   await bukEventProtocolContract.getAddress(),
    //   await bukTreasuryContract.getAddress(),
    // );

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukEventProtocolContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukEventProtocolContract.getAddress(),
    );

    //Set Buk Protocol in BukRoyalties
    const setBukEventProtocolRoyalties =
      await royaltiesContract.setBukEventProtocolContract(
        bukEventProtocolContract.getAddress(),
      );
  });

  describe("Manage Default Admin Role", function () {
    it("Should set new default admin", async function () {
      //Assign the value of DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(DEFAULT_ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin has DEFAULT_ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(DEFAULT_ADMIN_ROLE, account1),
      ).to.equal(true);
    });
    it("Should set new default admin and revoke old one", async function () {
      //Assign the value of DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(DEFAULT_ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin has DEFAULT_ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(DEFAULT_ADMIN_ROLE, account1),
      ).to.equal(true);

      //Revoke the new admin's access
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .revokeRole(DEFAULT_ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin still has DEFAULT_ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(DEFAULT_ADMIN_ROLE, account1),
      ).to.equal(false);
    });
    it("Should set new default admin and check function with new one", async function () {
      // Assign the value of DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      // Add new address to default admin role
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .grantRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.not.be.reverted;

      // Check if the new admin has DEFAULT_ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(account1)
          .hasRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.equal(true);

      //Revoke the old admin's access
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .revokeRole(DEFAULT_ADMIN_ROLE, await adminWallet.getAddress()),
      ).not.be.reverted;

      await expect(
        royaltiesContract
          .connect(account1)
          .grantRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.not.be.reverted;
    });

    it("Should set new default admin and check function with old one", async function () {
      // Assign the value of DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";

      // Add new address to default admin role
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .grantRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.not.be.reverted;

      // Check if the new admin has DEFAULT_ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(account1)
          .hasRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.equal(true);

      //Revoke the old admin's access
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .revokeRole(DEFAULT_ADMIN_ROLE, await adminWallet.getAddress()),
      ).not.be.reverted;

      await expect(
        royaltiesContract
          .connect(adminWallet)
          .grantRole(DEFAULT_ADMIN_ROLE, await account1.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Manage Admin Role", function () {
    it("Should add new admin", async function () {
      //Get the keccak256 hash of the ADMIN_ROLE
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(ADMIN_ROLE, account1),
      ).to.equal(true);
    });
    it("Should set new admin and revoke old admin", async function () {
      //Get the keccak256 hash of the ADMIN_ROLE
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(ADMIN_ROLE, account1),
      ).to.equal(true);

      //Revoke the new admin's access
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .revokeRole(ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin still has ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(ADMIN_ROLE, account1),
      ).to.equal(false);
    });
    it("Should execute function with new admin", async function () {
      //Get the keccak256 hash of the ADMIN_ROLE
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(ADMIN_ROLE, account1),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .hasRole(ADMIN_ROLE, account1),
      ).to.equal(true);

      //Set buk protocol
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukEventProtocolContract(account1),
      ).not.be.reverted;
    });
    it("Should fail for zero address", async function () {
      //Get the keccak256 hash of the ADMIN_ROLE
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      //Add new address to Admin role
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .grantRole(ADMIN_ROLE, account1),
      ).not.be.reverted;

      let newContract = "0x0000000000000000000000000000000000000000";

      await expect(
        royaltiesContract.setBukEventProtocolContract(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  describe("Set other Royalties in BukRoyalties", async function () {
    // get current epoch time and add 10 days to it
    const now = Math.floor(Date.now() / 1000);
    const fiveDays = 5 * 24 * 60 * 60;
    const startFromNow = now + fiveDays;
    const endFromNow = startFromNow + fiveDays;

    // Create event
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
    let eventAddress;
    let eventDetails;
    let eventNFTContract;

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

    it("Should set other Royalty by admin", async function () {
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
