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
describe("BukPOSNFTs Updations", function () {
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
      await nftPosContract.getAddress(),
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

    //Set BukPOSNFTs address in Buk Protocol
    const setBukPOSNFTs = await bukProtocolContract.setBukPOSNFTs(
      nftPosContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );

    //Set BukNFTS in BukPOSNFTs
    const setBukNFTsInBukPOSNFTs = await nftPosContract
      .connect(adminWallet)
      .setBukNFTRole(await nftContract.getAddress());

    //Set Buk Protocol in BukRoyalties
    const setBukEventProtocolRoyalties =
      await royaltiesContract.setBukEventProtocolContract(
        bukProtocolContract.getAddress(),
      );

    // Set all required
    await royaltiesContract.setBukRoyaltyInfo(bukTreasuryContract, 200);
    await royaltiesContract.setHotelRoyaltyInfo(bukTreasuryContract, 200);
    await royaltiesContract.setFirstOwnerRoyaltyInfo(200);
    await nftContract.setBukTreasury(await bukTreasuryContract.getAddress());

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

    //Check-in NFT
    await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
      .reverted;
    await saveInitialSnapshot();
  });
  afterEach(async function () {
    await restoreInitialSnapshot();
  });

  describe("Set Buk Protocol in BukPOSNFTs", function () {
    it("Should set Buk Protocol in BukPOSNFTs", async function () {
      expect(
        await nftPosContract.setBukEventProtocol(
          await bukProtocolContract.getAddress(),
        ),
      ).not.be.reverted;

      //Check if Buk Protocol is set
      expect(await nftPosContract.bukProtocolContract()).to.equal(
        await bukProtocolContract.getAddress(),
      );
    });
    it("Should set Buk Protocol and emit event", async function () {
      expect(
        await nftPosContract.setBukEventProtocol(
          bukProtocolContract.getAddress(),
        ),
      )
        .to.emit(nftPosContract, "SetBukEventProtocol")
        .withArgs(
          bukProtocolContract.getAddress(),
          bukProtocolContract.getAddress(),
        );
    });
    it("Should revert if not called by owner", async function () {
      await expect(
        nftPosContract
          .connect(account1)
          .setBukEventProtocol(bukProtocolContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set Buk Treasury in BukPOSNFTs", function () {
    it("Should set Buk Treasury in BukPOSNFTs", async function () {
      expect(
        await nftPosContract.setBukTreasury(
          await bukTreasuryContract.getAddress(),
        ),
      ).not.be.reverted;
    });
    it("Should set Buk Treasury and emit event", async function () {
      expect(
        await nftPosContract.setBukTreasury(bukTreasuryContract.getAddress()),
      )
        .to.emit(nftPosContract, "SetBukTreasury")
        .withArgs(
          bukTreasuryContract.getAddress(),
          bukTreasuryContract.getAddress(),
        );
    });
    it("Should revert if not called by admin", async function () {
      await expect(
        nftPosContract
          .connect(account1)
          .setBukTreasury(bukTreasuryContract.getAddress()),
      ).to.be.reverted;
    });
  });

  describe("Set BukNFTs Role in BukPOSNFTs", function () {
    it("Should set BukNFTs role in BukPOSNFTs", async function () {
      expect(await nftPosContract.setBukNFTRole(await nftContract.getAddress()))
        .not.be.reverted;
      //Check if BukPOSNFTs is set
      expect(await nftPosContract.nftContract()).to.equal(
        await nftContract.getAddress(),
      );
    });
    it("Should set BukNFTs role and emit event", async function () {
      expect(await nftPosContract.setBukNFTRole(await nftContract.getAddress()))
        .to.emit(nftPosContract, "SetNFTContractRole")
        .withArgs(
          await nftContract.getAddress(),
          await nftContract.getAddress(),
        );
    });
    it("Should revert if not called by owner", async function () {
      await expect(
        nftPosContract
          .connect(account1)
          .setBukNFTRole(await nftContract.getAddress()),
      ).to.be.reverted;
    });
  });
  describe("Set Token URIs for NFTS in BukPOSNFTs", function () {
    it("Should set Token URIs for BukPOSNFTs by admin", async function () {
      await fastForwardTo(1729997061);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([1], [owner.address]),
      ).not.be.reverted;

      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      expect(await nftPosContract.connect(adminWallet).setURI(1, newUri)).not.be
        .reverted;
      const uri = await nftPosContract.uri(1);
      expect(uri).to.equal(newUri);
    });
    it("Should set Token URIs and emit events", async function () {
      await fastForwardTo(1729997061);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([1], [owner.address]),
      ).not.be.reverted;

      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      expect(await nftPosContract.connect(adminWallet).setURI(1, newUri))
        .to.emit(nftPosContract, "SetURI")
        .withArgs(1, newUri);
    });
    it("Should not set if token is not minted", async function () {
      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      await expect(
        nftPosContract.connect(adminWallet).setURI(3, newUri),
      ).to.be.revertedWith("Token not exist on BukPOSNFTs");
    });
    it("Should not set Token URIs if not admin", async function () {
      //Set Token URI
      const newUri =
        "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
      await expect(nftPosContract.connect(account1).setURI(1, newUri)).to.be
        .reverted;
      const uri = await nftPosContract.uri(1);
      expect(uri).not.equal(newUri);
    });
  });

  describe("Set NFT contract name in BukPOSNFTs", function () {
    it("Should set NFT contract name by admin", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New";
      expect(await nftPosContract.connect(adminWallet).setNFTContractName(NAME))
        .not.be.reverted;
      const newName = await nftPosContract.connect(adminWallet).name();
      expect(newName).to.equal(NAME);
    });
    it("Should set NFT contract name and emit events", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New";
      expect(await nftPosContract.connect(adminWallet).setNFTContractName(NAME))
        .to.emit(nftPosContract, "SetNFTContractName")
        .withArgs(NAME);
    });
    it("Should not set NFT contract name if not admin", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New";
      await expect(nftPosContract.connect(account1).setNFTContractName(NAME)).to
        .be.reverted;
    });
  });

  describe("Safe transfer of Buk POS NFTs", function () {
    /* The above code is using the Chai testing framework to define a "before" and "after" hook. */
    beforeEach(async function () {
      await saveInitialSnapshot();

      await fastForwardTo(1729997061);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([1], [owner.address]),
      ).not.be.reverted;

      //Toggle tradeability
      const toggle = await bukProtocolContract.toggleTradeability(1);
    });
    afterEach(async function () {
      await restoreInitialSnapshot();
    });

    it("Should safe transfer Buk POS NFTs", async function () {
      expect(
        await nftPosContract
          .connect(adminWallet)
          .safeTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            1,
            1,
            "0x",
          ),
      ).not.be.reverted;
    });

    it("Should safe transfer Buk POS NFTs and emit event", async function () {
      expect(
        await nftPosContract
          .connect(adminWallet)
          .safeTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            1,
            1,
            "0x",
          ),
      )
        .to.emit(nftPosContract, "TransferSingle")
        .withArgs(
          await adminWallet.getAddress(),
          owner.getAddress(),
          account1.getAddress(),
          1,
          1,
        );
    });

    it("Should revert if not called by admin", async function () {
      //Check the allowance
      await expect(
        nftPosContract
          .connect(account1)
          .safeTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            1,
            1,
            "0x",
          ),
      ).to.be.reverted;
    });
  });

  describe("Safe batch transfer of Buk POS NFTs", function () {
    /* The above code is using the Chai testing framework to define a "before" and "after" hook. */
    beforeEach(async function () {
      await saveInitialSnapshot();

      await fastForwardTo(1729997061);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([1], [owner.address]),
      ).not.be.reverted;

      //Toggle tradeability
      const toggle = await bukProtocolContract.toggleTradeability(1);
    });
    afterEach(async function () {
      await restoreInitialSnapshot();
    });

    it("Should safe batch transfer Buk POS NFTs", async function () {
      expect(
        await nftPosContract
          .connect(adminWallet)
          .safeBatchTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            [1],
            [1],
            "0x",
          ),
      ).not.be.reverted;
    });

    it("Should safe batch transfer Buk POS NFTs and emit event", async function () {
      //Safe batch transfer
      expect(
        await nftPosContract
          .connect(adminWallet)
          .safeBatchTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            [1],
            [1],
            "0x",
          ),
      )
        .to.emit(nftPosContract, "TransferBatch")
        .withArgs(
          await testMarketplace1.getAddress(),
          owner.getAddress(),
          account1.getAddress(),
          [1],
          [1],
        );
    });

    it("Should revert if not called by marketplace", async function () {
      await expect(
        nftPosContract
          .connect(account1)
          .safeBatchTransferFrom(
            await owner.getAddress(),
            await account1.getAddress(),
            [1],
            [1],
            "0x",
          ),
      ).to.be.reverted;
    });
  });
});
