import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("BukEventProtocol Access Control", function () {
  let stableTokenContract;
  let bukProtocolContract;
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
    bukProtocolContract = await BukEventProtocol.deploy(
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
    //   await bukProtocolContract.getAddress(),
    //   await bukTreasuryContract.getAddress(),
    // );

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukProtocolContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );

    //Set Buk Protocol in BukRoyalties
    const setBukEventProtocolRoyalties =
      await royaltiesContract.setBukEventProtocolContract(
        bukProtocolContract.getAddress(),
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
  });
});
