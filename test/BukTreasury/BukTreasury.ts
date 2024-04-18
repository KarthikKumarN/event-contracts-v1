import { expect } from "chai";
import { ethers } from "hardhat";

describe("BukTreasury", () => {
  let stableTokenContract;
  let otherTokenContract;
  let bukProtocolContract;
  let signatureVerifierContract;
  let royaltiesContract;
  let owner;
  let account1;
  let account2;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;
  let bukProtocolContract1;

  beforeEach("deploy the contract instance first", async function () {
    [owner, account1, account2, adminWallet, bukWallet, bukProtocolContract1] =
      await ethers.getSigners();

    // Token
    const Token = await ethers.getContractFactory("Token");
    stableTokenContract = await Token.deploy(
      "USD Dollar",
      "USDC",
      18,
      owner.address,
      100000000000,
    );

    otherTokenContract = await Token.deploy(
      "USD Dollar",
      "USDC1",
      18,
      owner.address,
      100000000000,
    );

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

    //BukEventProtocol
    const BukEventProtocol = await ethers.getContractFactory(
      "BukEventProtocol",
    );
    bukProtocolContract = await BukEventProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );
    // await bukProtocolContract.deployed();

    // Set BukEventProtocol in BukTreasury
    await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );
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

  describe("setStableToken", () => {
    it("Should set the stable token address", async () => {
      await bukTreasuryContract.setStableToken(account1.address);
      expect(await bukTreasuryContract.getStableToken()).to.equal(
        account1.address,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await expect(
        bukTreasuryContract.connect(account1).setStableToken(account1.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });
    it("Should revert if the address is 0", async () => {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract.setStableToken(newContract),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Add all possible testcase for the BukTreasury setBukEventProtocol function
  describe("setBukEventProtocol", () => {
    it("Should set the BukEventProtocol address", async () => {
      expect(await bukTreasuryContract.setBukEventProtocol(account1.address)).to
        .not.be.reverted;
    });

    it("Should revert if not called by the owner", async () => {
      await expect(
        bukTreasuryContract
          .connect(account1)
          .setBukEventProtocol(account1.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });
    it("Should revert if the address is 0", async () => {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract.setBukEventProtocol(newContract),
      ).to.be.revertedWith("Invalid address");
    });

    it("Should emit event when BukEventProtocol address is set", async () => {
      await bukTreasuryContract.setBukEventProtocol(account1.address);
      let oldAddress = await bukTreasuryContract.bukProtocolContract();
      await expect(bukTreasuryContract.setBukEventProtocol(account2.address))
        .to.emit(bukTreasuryContract, "BukEventProtocolSet")
        .withArgs(oldAddress, account2.address);
    });
  });

  describe("withdrawStableToken", () => {
    it("Should withdraw the stable token", async () => {
      await stableTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await bukTreasuryContract.withdrawStableToken(
        100000000000,
        adminWallet.address,
      );
      expect(await stableTokenContract.balanceOf(adminWallet.address)).to.equal(
        100000000000,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await stableTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await expect(
        bukTreasuryContract
          .connect(account1)
          .withdrawStableToken(100000000000, adminWallet.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });
    it("Should revert if the address is 0", async () => {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract.withdrawStableToken(10000000000, newContract),
      ).to.be.revertedWith("Invalid address");
    });
    // Test when paused
    it("Should revert if the contract is paused", async () => {
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract.withdrawStableToken(
          10000000000,
          adminWallet.address,
        ),
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("withdrawOtherToken", () => {
    it("Should withdraw the other token", async () => {
      await otherTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        10000000000,
      );
      await bukTreasuryContract.withdrawOtherToken(
        1000000000,
        adminWallet.address,
        await otherTokenContract.getAddress(),
      );
      expect(await otherTokenContract.balanceOf(adminWallet.address)).to.equal(
        1000000000,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await otherTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await expect(
        bukTreasuryContract
          .connect(account1)
          .withdrawOtherToken(
            10000000000,
            adminWallet.address,
            await otherTokenContract.getAddress(),
          ),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.ADMIN_ROLE()}`,
      );
    });
    // Add more test cases to test whenNotPaused modifier
    it("Should revert if the contract is paused", async () => {
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract.withdrawOtherToken(
          10000000000,
          adminWallet.address,
          await otherTokenContract.getAddress(),
        ),
      ).to.be.revertedWith("Pausable: paused");
    });
    it("Should revert if the address is 0", async () => {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract.withdrawOtherToken(
          10000000000,
          newContract,
          await otherTokenContract.getAddress(),
        ),
      ).to.be.revertedWith("Invalid address");
    });
    it("Should revert if the address is 0", async () => {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract.withdrawOtherToken(
          10000000000,
          await otherTokenContract.getAddress(),
          newContract,
        ),
      ).to.be.revertedWith("Invalid token address");
    });
  });

  describe("stableRefund", () => {
    it("Should refund the stable token", async () => {
      await stableTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await bukTreasuryContract.setBukEventProtocol(
        bukProtocolContract1.getAddress(),
      );
      await bukTreasuryContract
        .connect(bukProtocolContract1)
        .stableRefund(10000000000, adminWallet.address);
      expect(await stableTokenContract.balanceOf(adminWallet.address)).to.equal(
        10000000000,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await stableTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await expect(
        bukTreasuryContract
          .connect(account1)
          .stableRefund(100000000000, adminWallet.address),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.BUK_PROTOCOL_ROLE()}`,
      );
    });

    it("Should revert if the address is 0", async () => {
      await stableTokenContract.transfer(
        await bukProtocolContract1.getAddress(),
        100000000000,
      );
      await bukTreasuryContract.setBukEventProtocol(
        bukProtocolContract1.getAddress(),
      );
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract
          .connect(bukProtocolContract1)
          .stableRefund(10000000000, newContract),
      ).to.be.revertedWith("Invalid address");
    });
    // Test when paused
    it("Should revert if the contract is paused", async () => {
      await bukTreasuryContract.setBukEventProtocol(
        await bukProtocolContract1.getAddress(),
      );
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract
          .connect(bukProtocolContract1)
          .stableRefund(100000000000, adminWallet.address),
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  // Add all possible testcase for the BukTreasury otherRefund function
  describe("otherRefund", () => {
    it("Should refund the other token", async () => {
      await otherTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        10000000000,
      );
      await bukTreasuryContract.setBukEventProtocol(
        bukProtocolContract1.getAddress(),
      );
      await bukTreasuryContract
        .connect(bukProtocolContract1)
        .otherRefund(
          1000000000,
          adminWallet.address,
          await otherTokenContract.getAddress(),
        );
      expect(await otherTokenContract.balanceOf(adminWallet.address)).to.equal(
        1000000000,
      );
    });

    it("Should revert if not called by the owner", async () => {
      await otherTokenContract.transfer(
        await bukTreasuryContract.getAddress(),
        100000000000,
      );
      await expect(
        bukTreasuryContract
          .connect(account1)
          .otherRefund(
            10000000000,
            adminWallet.address,
            await otherTokenContract.getAddress(),
          ),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await bukTreasuryContract.BUK_PROTOCOL_ROLE()}`,
      );
    });
    // Add more test cases to test whenNotPaused modifier
    it("Should revert if the contract is paused", async () => {
      await bukTreasuryContract.setBukEventProtocol(
        await bukProtocolContract1.getAddress(),
      );
      await bukTreasuryContract.pause();
      await expect(
        bukTreasuryContract
          .connect(bukProtocolContract1)
          .otherRefund(
            10000000000,
            adminWallet.address,
            await otherTokenContract.getAddress(),
          ),
      ).to.be.revertedWith("Pausable: paused");
    });
    it("Should revert if the address is 0", async () => {
      await stableTokenContract.transfer(
        await bukProtocolContract1.getAddress(),
        100000000000,
      );
      await bukTreasuryContract.setBukEventProtocol(
        bukProtocolContract1.getAddress(),
      );
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract
          .connect(bukProtocolContract1)
          .otherRefund(
            10000000000,
            newContract,
            await otherTokenContract.getAddress(),
          ),
      ).to.be.revertedWith("Invalid address");
    });
    it("Should revert if the address is 0", async () => {
      await stableTokenContract.transfer(
        await bukProtocolContract1.getAddress(),
        100000000000,
      );
      await bukTreasuryContract.setBukEventProtocol(
        bukProtocolContract1.getAddress(),
      );
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        bukTreasuryContract
          .connect(bukProtocolContract1)
          .otherRefund(
            10000000000,
            await otherTokenContract.getAddress(),
            newContract,
          ),
      ).to.be.revertedWith("Invalid token address");
    });
  });
});
