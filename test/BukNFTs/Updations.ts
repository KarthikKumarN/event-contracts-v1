import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

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

describe("BukNFTs Updations", function () {
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
  let testMarketplace1;
  let testMarketplace2;

  beforeEach("deploy the contract instance first", async function () {
    [
      adminWallet,
      owner,
      account1,
      account2,
      testMarketplace1,
      testMarketplace2,
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

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      await bukProtocolContract.getAddress(),
      await bukTreasuryContract.getAddress(),
    );

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

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );

    //Grant allowance permission
    const res = await stableTokenContract
      .connect(owner)
      .approve(await bukProtocolContract.getAddress(), 150000000);

    //Book room
    expect(
      await bukProtocolContract
        .connect(owner)
        .bookRooms(
          [100000000],
          [80000000],
          [70000000],
          "0x3633666663356135366139343361313561626261336134630000000000000000",
          1729847061,
          1729947061,
          12,
          true,
        ),
    ).not.be.reverted;

    //Mint NFT
    await expect(
      bukProtocolContract.mintBukNFTOwner(
        [1],
        [
          "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        ],
        owner.address,
      ),
    ).not.be.reverted;
    await saveInitialSnapshot();
  });
  afterEach(async function () {
    await restoreInitialSnapshot();
  });

  describe("Set Buk Protocol in BukNFTs", function () {
    it("Should set Buk Protocol in BukNFTs", async function () {
      expect(
        await nftContract.setBukEventProtocol(
          await bukProtocolContract.getAddress(),
        ),
      ).not.be.reverted;
      //Check if Buk Protocol is set
      expect(await nftContract.bukProtocolContract()).to.equal(
        await bukProtocolContract.getAddress(),
      );
    });
    it("Should set Buk Protocol and emit event", async function () {
      expect(
        await nftContract.setBukEventProtocol(bukProtocolContract.getAddress()),
      )
        .to.emit(nftContract, "SetBukEventProtocol")
        .withArgs(
          bukProtocolContract.getAddress(),
          bukProtocolContract.getAddress(),
        );
    });
    it("Should revert if not called by admin", async function () {
      await expect(
        nftContract
          .connect(account1)
          .setBukEventProtocol(bukProtocolContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set Buk Treasury in BukNFTs", function () {
    it("Should set Buk Treasury in BukNFTs", async function () {
      expect(
        await nftContract.setBukTreasury(
          await bukTreasuryContract.getAddress(),
        ),
      ).not.be.reverted;
    });
    it("Should set Buk Treasury and emit event", async function () {
      expect(await nftContract.setBukTreasury(bukTreasuryContract.getAddress()))
        .to.emit(nftContract, "SetBukTreasury")
        .withArgs(
          bukTreasuryContract.getAddress(),
          bukTreasuryContract.getAddress(),
        );
    });
    it("Should revert if not called by admin", async function () {
      await expect(
        nftContract
          .connect(account1)
          .setBukTreasury(bukTreasuryContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set Marketplace Role in BukNFTs", function () {
    //Get the keccak256 hash of the MARKETPLACE_ROLE
    const MARKETPLACE_ROLE = keccak256(toUtf8Bytes("MARKETPLACE_ROLE"));

    it("Should set Marketplace in BukNFTs", async function () {
      expect(
        await nftContract.setMarketplaceRole(marketplaceContract.getAddress()),
      ).not.be.reverted;
      //Check if Marketplace is set
      expect(
        await nftContract.hasRole(
          MARKETPLACE_ROLE,
          await marketplaceContract.getAddress(),
        ),
      ).not.be.reverted;
    });
    it("Should set Marketplace and emit event", async function () {
      expect(
        await nftContract.setMarketplaceRole(marketplaceContract.getAddress()),
      )
        .to.emit(nftContract, "SetMarketplace")
        .withArgs(
          marketplaceContract.getAddress(),
          marketplaceContract.getAddress(),
        );
    });
    it("Should revert if not called by admin", async function () {
      await expect(
        nftContract
          .connect(account1)
          .setMarketplaceRole(marketplaceContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set Token URIs for NFTS in BukNFTs", function () {
    it("Should set Token URIs for BukNFTs by admin", async function () {
      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      expect(await nftContract.connect(adminWallet).setURI(1, newUri)).not.be
        .reverted;
      const uri = await nftContract.uri(1);
      expect(uri).to.equal(newUri);
    });
    it("Should set Token URIs and emit events", async function () {
      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      expect(await nftContract.connect(adminWallet).setURI(1, newUri))
        .to.emit(nftContract, "SetURI")
        .withArgs(1, newUri);
    });
    it("Should not set if token is not minted", async function () {
      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      await expect(
        nftContract.connect(adminWallet).setURI(3, newUri),
      ).to.be.revertedWith("Token does not exist on BukNFTs");
    });
    it("Should not set Token URIs if not admin", async function () {
      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      await expect(nftContract.connect(account1).setURI(1, newUri)).to.be
        .reverted;
      const uri = await nftContract.uri(1);
      expect(uri).not.equal(newUri);
    });
  });

  // Add test cases for pause and unpause and test whenNotPaused modifier
  describe("Pause and Unpause", function () {
    it("Should pause the contract", async function () {
      expect(await nftContract.pause()).not.be.reverted;
      expect(await nftContract.paused()).to.equal(true);
    });
    it("Should unpause the contract", async function () {
      expect(await nftContract.pause()).not.be.reverted;
      expect(await nftContract.paused()).to.equal(true);
      expect(await nftContract.unpause()).not.be.reverted;
      expect(await nftContract.paused()).to.equal(false);
    });
    it("Should revert if not called by admin", async function () {
      await expect(nftContract.connect(account1).pause()).to.be.reverted;
      await expect(nftContract.connect(account1).unpause()).to.be.reverted;
    });
    it("Should revert if paused", async function () {
      expect(await nftContract.connect(adminWallet).pause()).not.be.reverted;
      expect(await nftContract.paused()).to.equal(true);
      expect(
        await nftContract.setMarketplaceRole(testMarketplace1.getAddress()),
      ).not.be.reverted;
      await expect(
        nftContract
          .connect(testMarketplace1)
          .safeTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            1,
            1,
            "0x",
          ),
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
