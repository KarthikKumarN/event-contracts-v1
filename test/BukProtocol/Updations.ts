import { expect } from "chai";
import { ethers } from "hardhat";

/**
 * The above function is a TypeScript function that retrieves the current timestamp of the latest
 * block in the Ethereum blockchain and saves an initial snapshot of the blockchain state.
 * @returns The function `getCurrentTime` returns a Promise that resolves to a number, which is the
 * current timestamp of the latest block.
 */
const getCurrentTime = async (): Promise<number> => {
  const block: any = await ethers.provider.getBlock("latest");
  return block.timestamp;
};
let initialSnapshotId: number;
const saveInitialSnapshot = async () => {
  const response = await ethers.provider.send("evm_snapshot");
  initialSnapshotId = response;
};

/**
 * The function `restoreInitialSnapshot` reverts the Ethereum Virtual Machine (EVM) state to the
 * initial snapshot identified by `initialSnapshotId`.
 */
const restoreInitialSnapshot = async () => {
  await ethers.provider.send("evm_revert", [initialSnapshotId]);
};

/**
 * The function `fastForwardTo` allows you to fast forward the Ethereum Virtual Machine (EVM) to
 * a specific timestamp.
 * @param {number} timestamp - The `timestamp` parameter is a number representing the desired
 * timestamp to fast forward to. It is the target time that you want to set for the Ethereum
 * Virtual Machine (EVM) during testing or development.
 */
const fastForwardTo = async (timestamp: number): Promise<void> => {
  const currentTime = await getCurrentTime();
  const diff = timestamp - currentTime;

  if (diff > 0) {
    await ethers.provider.send("evm_increaseTime", [diff]);
    await ethers.provider.send("evm_mine");
  } else {
    await restoreInitialSnapshot();
    const currentTime = await getCurrentTime(); // Store current time before calculating difference
    const remainingDiff = timestamp - currentTime;
    if (remainingDiff > 0) {
      await ethers.provider.send("evm_increaseTime", [remainingDiff]);
      await ethers.provider.send("evm_mine");
    }
  }
};

describe("BukProtocol Updations", function () {
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
  let nftPosContract;
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

    // BukPOSNFT
    const BukPOSNFT = await ethers.getContractFactory("BukPOSNFTs");
    nftPosContract = await BukPOSNFT.deploy(
      "BUK_POS",
      bukProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
    );

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      nftPosContract.getAddress(),
      bukProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
    );

    //Set BukNFTs address in BukPOSNFTs
    await nftPosContract.setBukNFTRole(nftContract.getAddress());

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukProtocolContract.getAddress(),
      nftContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    //Set BukNFTs address in Buk Protocol
    const setBukNFTs = await bukProtocolContract.setBukNFTs(
      nftContract.getAddress(),
    );

    //Set BukPOSNFTs address in Buk Protocol
    const setBukPOSNFTs = await bukProtocolContract.setBukPOSNFTs(
      nftPosContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukProtocol = await bukTreasuryContract.setBukProtocol(
      bukProtocolContract.getAddress(),
    );

    await saveInitialSnapshot();
  });

  afterEach(async function () {
    await restoreInitialSnapshot();
  });

  describe("Set Treasury in BukProtocol", function () {
    it("Should set treasury by admin", async function () {
      //Set treasury
      expect(
        await bukProtocolContract.connect(adminWallet).setBukTreasury(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(adminWallet)
        .getWallets();
      expect(addresses[4]).to.equal(await account1.getAddress());
    });
    it("Should set treasury and emit events", async function () {
      //Set treasury
      expect(
        await bukProtocolContract.connect(adminWallet).setBukTreasury(account1),
      )
        .to.emit(bukProtocolContract, "SetBukTreasury")
        .withArgs(await account1.getAddress());
    });
    it("Should not set treasury if not admin", async function () {
      //Set treasury
      await expect(
        bukProtocolContract.connect(account2).setBukTreasury(account1),
      ).to.be.reverted;
    });
  });

  describe("Set Admin in BukProtocol", function () {
    it("Should set admin by admin", async function () {
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account1))
        .not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(account1)
        .getWallets();
      expect(addresses[7]).to.equal(await account1.getAddress());
    });
    it("Should set admin and emit events", async function () {
      const addresses = await bukProtocolContract
        .connect(adminWallet)
        .getWallets();
      //Get the old admin
      const oldAdmin = addresses[7];
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account1))
        .to.emit(bukProtocolContract, "SetAdminWallet")
        .withArgs(oldAdmin, await account1.getAddress());
    });
    it("Should not set admin if not admin", async function () {
      //Set admin
      await expect(bukProtocolContract.connect(account2).setAdmin(account1)).to
        .be.reverted;
    });
  });

  describe("Set Signature Verifier in BukProtocol", function () {
    it("Should set signature verifier by admin", async function () {
      //Set signature verifier
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setSignatureVerifier(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(adminWallet)
        .getWallets();
      expect(addresses[3]).to.equal(await account1.getAddress());
    });
    it("Should set signature verifier and emit events", async function () {
      //Set signature verifier
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setSignatureVerifier(account1),
      )
        .to.emit(bukProtocolContract, "SetSignerVerifier")
        .withArgs(await account1.getAddress());
    });
    it("Should not set signature verifier if not admin", async function () {
      //Set signature verifier
      await expect(
        bukProtocolContract.connect(account2).setSignatureVerifier(account1),
      ).to.be.reverted;
    });
  });

  describe("Set Royalties Contract in BukProtocol", function () {
    it("Should set royalties contract by admin", async function () {
      //Set royalties
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setRoyaltiesContract(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(account1)
        .getWallets();
      expect(addresses[2]).to.equal(await account1.getAddress());
    });
    it("Should set royalties contract and emit events", async function () {
      //Set royalties
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setRoyaltiesContract(account1),
      )
        .to.emit(bukProtocolContract, "SetRoyaltiesContract")
        .withArgs(await account1.getAddress());
    });
    it("Should not set royalties contract if not admin", async function () {
      //Set royalties
      await expect(
        bukProtocolContract.connect(account2).setRoyaltiesContract(account1),
      ).to.be.reverted;
    });
  });

  describe("Set Buk Wallet in BukProtocol", function () {
    it("Should set Buk Wallet by admin", async function () {
      //Set Buk Wallet
      expect(
        await bukProtocolContract.connect(adminWallet).setBukWallet(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(adminWallet)
        .getWallets();
      expect(addresses[6]).to.equal(await account1.getAddress());
    });
    it("Should set Buk Wallet and emit events", async function () {
      //Set Buk Wallet
      expect(
        await bukProtocolContract.connect(adminWallet).setBukWallet(account1),
      )
        .to.emit(bukProtocolContract, "SetBukWallet")
        .withArgs(await account1.getAddress());
    });
    it("Should not set Buk Wallet if not admin", async function () {
      //Set Buk Wallet
      await expect(bukProtocolContract.connect(account2).setBukWallet(account1))
        .to.be.reverted;
    });
  });

  describe("Set stable token in BukProtocol", function () {
    it("Should set stable token by admin", async function () {
      //Set Stable Token
      expect(
        await bukProtocolContract.connect(adminWallet).setStableToken(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(adminWallet)
        .getWallets();
      expect(addresses[5]).to.equal(await account1.getAddress());
    });
    it("Should set stable token and emit events", async function () {
      //Set Stable Token
      expect(
        await bukProtocolContract.connect(adminWallet).setStableToken(account1),
      )
        .to.emit(bukProtocolContract, "SetStableToken")
        .withArgs(await account1.getAddress());
    });
    it("Should not set stable token if not admin", async function () {
      //Set Stable Token
      await expect(
        bukProtocolContract.connect(account2).setStableToken(account1),
      ).to.be.reverted;
    });
  });

  describe("Set BukNFTs in BukProtocol", function () {
    it("Should set BukNFTs contract address by admin", async function () {
      // Set BukNFTs
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukNFTs(await nftContract.getAddress()),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(account1)
        .getWallets();
      const addr2: string = await nftContract.getAddress();
      expect(addresses[0]).to.be.equal(addr2);
    });

    it("Should set BukNFTs contract address and emit events", async function () {
      // Set BukNFTs
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukNFTs(await nftContract.getAddress()),
      )
        .to.emit(bukProtocolContract, "SetBukNFTs")
        .withArgs(await nftContract.getAddress());
    });
    it("Should not set BukNFTs address if not admin", async function () {
      //Set BukNFTs
      await expect(
        bukProtocolContract
          .connect(account1)
          .setBukNFTs(await nftContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set BukPOSNFTs in BukProtocol", function () {
    it("Should set BukPOSNFTs contract address by admin", async function () {
      // Set BukPOSNFTs
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukPOSNFTs(await nftPosContract.getAddress()),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(account1)
        .getWallets();
      const addr2: string = await nftPosContract.getAddress();
      expect(addresses[1]).to.be.equal(addr2);
    });
    it("Should set BukPOSNFTs contract address and emit events", async function () {
      // Set BukPOSNFTs
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukPOSNFTs(await nftPosContract.getAddress()),
      )
        .to.emit(bukProtocolContract, "SetBukPOSNFTs")
        .withArgs(await nftPosContract.getAddress());
    });
    it("Should not set BukPOSNFTs contract address if not admin", async function () {
      // Set BukPOSNFTs
      await expect(
        bukProtocolContract
          .connect(account1)
          .setBukPOSNFTs(await nftPosContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set Buk Royalties Contract in BukProtocol", function () {
    it("Should set royaltiesContract by admin", async function () {
      //Set royaltiesContract
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setRoyaltiesContract(account1),
      ).not.be.reverted;
      const addresses = await bukProtocolContract
        .connect(account1)
        .getWallets();
      const addr1: string = addresses[2];
      const addr2: string = await account1.getAddress();
      expect(addr1).to.be.equal(addr2);
    });
    it("Should set royaltiesContract and emit events", async function () {
      //Set royaltiesContract
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setRoyaltiesContract(account1),
      )
        .to.emit(bukProtocolContract, "SetBukRoyalties")
        .withArgs(await account1.getAddress());
    });
    it("Should not set royaltiesContract if not admin", async function () {
      //Set royaltiesContract
      await expect(
        bukProtocolContract.connect(account2).setRoyaltiesContract(account1),
      ).to.be.reverted;
    });
  });

  describe("Set Buk commission in BukProtocol", function () {
    it("Should set Buk commission by admin", async function () {
      //Set Commission
      const COMMISSION: number = 10;
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setCommission(COMMISSION),
      ).not.be.reverted;
      const newCommission = await bukProtocolContract.commission();
      expect(newCommission).to.equal(COMMISSION);
    });
    it("Should set Buk commission and emit events", async function () {
      //Set Commission
      const COMMISSION: number = 10;
      await expect(
        bukProtocolContract.connect(adminWallet).setCommission(COMMISSION),
      )
        .to.emit(bukProtocolContract, "SetCommission")
        .withArgs(5, COMMISSION);
    });
    it("Should not set Buk commission if not admin", async function () {
      //Set Commission
      const COMMISSION: number = 10;
      await expect(
        bukProtocolContract.connect(account1).setCommission(COMMISSION),
      ).to.be.reverted;
    });
  });

  // Define the all possible test cased for pause and unpause functions and add test case to check whenNotPaused modifier
  describe("Pause and Unpause functions", function () {
    it("Should pause the contract by admin", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      const paused = await bukProtocolContract.paused();
      expect(paused).to.equal(true);
    });

    it("Should pause the contract and emit events", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause())
        .to.emit(bukProtocolContract, "Paused")
        .withArgs(await adminWallet.getAddress());
    });

    it("Should not pause the contract if not admin", async function () {
      //Pause
      await expect(bukProtocolContract.connect(account1).pause()).to.be
        .reverted;
    });

    it("Should unpause the contract by admin", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      const paused = await bukProtocolContract.paused();
      expect(paused).to.equal(true);
      //Unpause
      expect(await bukProtocolContract.connect(adminWallet).unpause()).not.be
        .reverted;
      const paused2 = await bukProtocolContract.paused();
      expect(paused2).to.equal(false);
    });

    it("Should unpause the contract and emit events", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      //Unpause
      expect(await bukProtocolContract.connect(adminWallet).unpause())
        .to.emit(bukProtocolContract, "Unpaused")
        .withArgs(await adminWallet.getAddress());
    });

    it("Should not unpause the contract if not admin", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      //Unpause
      await expect(bukProtocolContract.connect(account1).unpause()).to.be
        .reverted;
    });
    it("Should not unpause the contract if not paused", async function () {
      //Unpause
      await expect(bukProtocolContract.connect(adminWallet).unpause()).to.be
        .reverted;
    });

    // Add test case whenNotPaused modifier used
    it("Should not allow to call when paused", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      //Unpause
      await expect(bukProtocolContract.connect(account1).setCommission(10)).to
        .be.reverted;
    });
    // Add test case whenNotPaused modifier used and unpaused
    it("Should allow to call when unpaused", async function () {
      //Pause
      expect(await bukProtocolContract.connect(adminWallet).pause()).not.be
        .reverted;
      //Set Commission
      const COMMISSION: number = 10;
      await expect(
        bukProtocolContract.connect(adminWallet).setCommission(COMMISSION),
      ).to.be.reverted;
      //Unpause
      await expect(bukProtocolContract.connect(adminWallet).unpause()).not.be
        .reverted;
      //Set Commission
      await expect(
        bukProtocolContract.connect(adminWallet).setCommission(COMMISSION),
      ).not.be.reverted;
    });
  });
});
