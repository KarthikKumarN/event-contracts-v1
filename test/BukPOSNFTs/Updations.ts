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

    //BukProtocol
    const BukProtocol = await ethers.getContractFactory("BukProtocol");
    bukProtocolContract = await BukProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.address,
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
    const setBukPoSNFTs = await bukProtocolContract.setBukPoSNFTs(
      nftPosContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukProtocol = await bukTreasuryContract.setBukProtocol(bukProtocolContract.getAddress())

    //Set BukNFTS in BukPOSNFTs
    const setBukNFTsInBukPOSNFTs = await nftPosContract.connect(adminWallet).grantBukNFTRole(await nftContract.getAddress())

    //Grant allowance permission
    const res = await stableTokenContract.connect(owner).approve(
      await bukProtocolContract.getAddress(),
      150000000,
    );

    //Book room
    expect(
      await bukProtocolContract.connect(owner).bookRoom(
        1,
        [100000000],
        [80000000],
        [70000000],
        1701504548,
        1701590948,
        12,
        true,
      ),
    ).not.be.reverted;

    //Mint NFT
    await expect(
      bukProtocolContract.connect(owner).mintBukNFT(
        [1],
        [
          "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        ],
      ),
    ).not.be.reverted;


    //Check-in NFT
    await expect(
      bukProtocolContract.connect(owner).checkin(
        [1]
      ),
    ).not.be.reverted;
  });

  describe("Set Buk Protocol in BukPOSNFTs", function () {
    it("Should set Buk Protocol in BukPOSNFTs", async function () {
      expect(await nftPosContract.setBukProtocol(await bukProtocolContract.getAddress()))
        .not.be.reverted;

      //Check if Buk Protocol is set
      expect(await nftPosContract.bukProtocolContract()).to.equal(await bukProtocolContract.getAddress());
    });
    it("Should set Buk Protocol and emit event", async function () {
      expect(await nftPosContract.setBukProtocol(bukProtocolContract.getAddress()))
        .to.emit(nftPosContract, "SetBukProtocol")
        .withArgs(bukProtocolContract.getAddress());
    });
    it("Should revert if not called by owner", async function () {
      await expect(nftPosContract.connect(account1)
        .setBukProtocol(bukProtocolContract.getAddress())).to.be.reverted;
    })
  });

  describe("Set Buk Treasury in BukPOSNFTs", function () {
    it("Should set Buk Treasury in BukPOSNFTs", async function () {
      expect(await nftPosContract.setBukTreasury(await bukTreasuryContract.getAddress()))
        .not.be.reverted;
    });
    it("Should set Buk Treasury and emit event", async function () {
      expect(await nftPosContract.setBukTreasury(bukTreasuryContract.getAddress()))
        .to.emit(nftPosContract, "SetBukTreasury")
        .withArgs(bukTreasuryContract.getAddress());
    });
    it("Should revert if not called by admin", async function () {
      await expect(nftPosContract.connect(account1)
        .setBukTreasury(bukTreasuryContract.getAddress())).to.be.reverted;
    })
  });

  describe("Grant BukNFTs Role in BukPOSNFTs", function () {
    it("Should grant BukPOSNFTs role in BukNFTs", async function () {
      expect(await nftPosContract.grantBukNFTRole(await nftContract.getAddress()))
        .not.be.reverted;
      //Check if BukPOSNFTs is set
      expect(await nftPosContract.nftContract())
        .to.equal(await nftContract.getAddress());
    })
    it("Should grant BukPOSNFTs role and emit event", async function () {
      expect(await nftPosContract.grantBukNFTRole(await nftContract.getAddress()))
        .to.emit(nftPosContract, "GrantNftContractRole")
        .withArgs(await nftContract.getAddress());
    })
    it("Should revert if not called by owner", async function () {
      await expect(nftPosContract.connect(account1)
        .grantBukNFTRole(await nftContract.getAddress()))
        .to.be.reverted;
    })

  });

  describe("Safe transfer of Buk PoS NFTs", function () {

    /* The above code is using the Chai testing framework to define a "before" and "after" hook. */
    beforeEach(async function () {
      await saveInitialSnapshot();

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).not.be.reverted;

      //Toggle tradeability
      const toggle = await bukProtocolContract.toggleTradeability(1);

    });
    afterEach(async function () {
      await restoreInitialSnapshot();
    });

    it("Should safe transfer Buk PoS NFTs", async function () {
      expect(
        await nftPosContract.connect(adminWallet).safeTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          1,
          1,
          "0x"
        )
      ).not.be.reverted;

    })

    it("Should safe transfer Buk PoS NFTs and emit event", async function () {
      expect(
        await nftPosContract.connect(adminWallet).safeTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          1,
          1,
          "0x"
        )
      )
        .to.emit(nftPosContract, "TransferSingle")
        .withArgs(await adminWallet.getAddress(), owner.getAddress(), account1.getAddress(), 1, 1);

    })

    it("Should revert if not called by admin", async function () {

      //Check the allowance
      await expect(
        nftPosContract.connect(account1).safeTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          1,
          1,
          "0x"
        )
      ).to.be.reverted;
    })
  });

  describe("Safe batch transfer of Buk PoS NFTs", function () {

    /* The above code is using the Chai testing framework to define a "before" and "after" hook. */
    beforeEach(async function () {
      await saveInitialSnapshot();

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).not.be.reverted;

      //Toggle tradeability
      const toggle = await bukProtocolContract.toggleTradeability(1);

    });
    afterEach(async function () {
      await restoreInitialSnapshot();
    });

    it("Should safe batch transfer Buk PoS NFTs", async function () {
      expect(
        await nftPosContract.connect(adminWallet).safeBatchTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          [1],
          [1],
          "0x"
        )
      ).not.be.reverted;

    })

    it("Should safe batch transfer Buk PoS NFTs and emit event", async function () {

      //Safe batch transfer
      expect(
        await nftPosContract.connect(adminWallet).safeBatchTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          [1],
          [1],
          "0x"
        )
      )
        .to.emit(nftPosContract, "TransferBatch")
        .withArgs(await testMarketplace1.getAddress(), owner.getAddress(), account1.getAddress(), [1], [1]);

    })

    it("Should revert if not called by marketplace", async function () {

      await expect(
        nftPosContract.connect(account1).safeBatchTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          [1],
          [1],
          "0x"
        )
      ).to.be.reverted;
    })

  });

});
