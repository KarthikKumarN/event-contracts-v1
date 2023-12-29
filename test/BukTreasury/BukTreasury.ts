import { expect } from "chai";
import { ethers } from "hardhat";

describe("BukTreasury", () => {
  let stableTokenContract;
  let bukProtocolContract;
  let signatureVerifierContract;
  let royaltiesContract;
  let owner;
  let account1;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;

  beforeEach("deploy the contract instance first", async function () {
    [owner, account1, adminWallet, bukWallet] = await ethers.getSigners();

    // Token
    const Token = await ethers.getContractFactory("Token");
    stableTokenContract = await Token.deploy(
      "USD Dollar",
      "USDC",
      18,
      owner.address,
      100000000000,
    );
    // await stableTokenContract.deployed();

    //BukTreasury
    const BukTreasury = await ethers.getContractFactory("BukTreasury");
    bukTreasuryContract = await BukTreasury.deploy(
      stableTokenContract.getAddress(),
    );
    // await bukTreasuryContract.deployed();

    //Deploy SignatureVerifier contract
    const SignatureVerifier = await ethers.getContractFactory(
      "SignatureVerifier",
    );
    signatureVerifierContract = await SignatureVerifier.deploy();

    //Deploy BukRoyalties contract
    const BukRoyalties = await ethers.getContractFactory("BukRoyalties");
    royaltiesContract = await BukRoyalties.deploy();

    //BukProtocol
    const BukProtocol = await ethers.getContractFactory("BukProtocol");
    bukProtocolContract = await BukProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );
    // await bukProtocolContract.deployed();

    // Set BukProtocol in BukTreasury
    await bukTreasuryContract.setBukProtocol(bukProtocolContract.getAddress());
  });

  // Add all possible testcase for the BukTreasury pause and unpause function
  describe("Pause and Unpause", () => {
    it("Should pause the contract", async () => {
      await bukTreasuryContract.pause();
      expect(await bukTreasuryContract.paused()).to.equal(true);
    });

    it("Should unpause the contract", async () => {
      await bukTreasuryContract.pause();
      expect(await bukTreasuryContract.paused()).to.equal(true);
      await bukTreasuryContract.unpause();
      expect(await bukTreasuryContract.paused()).to.equal(false);
    });

    it("Should revert if not called by the owner", async () => {
      await expect(
        bukTreasuryContract.connect(account1).pause(),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract.connect(account1).unpause(),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });
    // Add more test cases to test whenNotPaused modifier
    it("Should revert if the contract is paused", async () => {
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract.withdrawStableToken(100, adminWallet.address),
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
