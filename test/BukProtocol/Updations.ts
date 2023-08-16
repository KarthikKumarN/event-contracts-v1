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
    const SignatureVerifier = await ethers.getContractFactory("SignatureVerifier");
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

    //Set BukNFTs address in BukPoSNFTs
    await nftPosContract.setBukNFTRole(nftContract.getAddress())

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

    await saveInitialSnapshot();
  });
  afterEach(async function () {
    await restoreInitialSnapshot();
  });

  describe("Set Treasury in BukProtocol", function () {
    it("Should set treasury by admin", async function () {
      //Set treasury
      expect(await bukProtocolContract.connect(adminWallet).setBukTreasury(account1)).not.be.reverted;
      const addresses = await bukProtocolContract.connect(adminWallet).getWallets()
      expect(addresses[0]).to.equal(await account1.getAddress());
    });
    it("Should set treasury and emit events", async function () {
      //Set treasury
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukTreasury(account1))
        .to.emit(bukProtocolContract, "SetBukTreasury")
        .withArgs(await account1.getAddress());
    });
    it("Should not set treasury if not admin", async function () {
      //Set treasury
      await expect(bukProtocolContract.connect(account2).setBukTreasury(account1)).to.be.reverted;
    });
  });

  describe("Set Buk Wallet in BukProtocol", function () {
    it("Should set Buk Wallet by admin", async function () {
      //Set Buk Wallet
      expect(await bukProtocolContract.connect(adminWallet).setBukWallet(account1)).not.be.reverted;
      const addresses = await bukProtocolContract.connect(adminWallet).getWallets()
      expect(addresses[1]).to.equal(await account1.getAddress());
    });
    it("Should set Buk Wallet and emit events", async function () {
      //Set Buk Wallet
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setBukWallet(account1))
        .to.emit(bukProtocolContract, "SetBukWallet")
        .withArgs(await account1.getAddress());
    });
    it("Should not set Buk Wallet if not admin", async function () {
      //Set Buk Wallet
      await expect(bukProtocolContract.connect(account2).setBukWallet(account1)).to.be.reverted;
    });
  });

  describe("Set stable token in BukProtocol", function () {
    it("Should set stable token by admin", async function () {
      //Set Stable Token
      expect(await bukProtocolContract.connect(adminWallet).setStableToken(account1)).not.be.reverted;
      const addresses = await bukProtocolContract.connect(adminWallet).getWallets()
      expect(addresses[2]).to.equal(await account1.getAddress());
    });
    it("Should set stable token and emit events", async function () {
      //Set Stable Token
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setStableToken(account1))
        .to.emit(bukProtocolContract, "SetStableToken")
        .withArgs(await account1.getAddress());
    });
    it("Should not set stable token if not admin", async function () {
      //Set Stable Token
      await expect(bukProtocolContract.connect(account2).setStableToken(account1)).to.be.reverted;
    });
  });

  describe("Set BukNFTs in BukProtocol", function () {
    it("Should set BukNFTs contract address by admin", async function () {
      // Set BukNFTs
      expect(await bukProtocolContract.connect(adminWallet)
        .setBukNFTs(await nftContract.getAddress())).not.be.reverted;
      const addr1: string = await bukProtocolContract.nftContract();
      const addr2: string = await nftContract.getAddress();
      expect(addr1).to.be.equal(addr2);
    });


    it("Should set BukNFTs contract address and emit events", async function () {
      // Set BukNFTs
      expect(await bukProtocolContract.connect(adminWallet)
        .setBukNFTs(await nftContract.getAddress()))
        .to.emit(bukProtocolContract, "SetBukNFTs")
        .withArgs(await nftContract.getAddress());
    });
    it("Should not set BukNFTs address if not admin", async function () {
      //Set BukNFTs
      await expect(bukProtocolContract.connect(account1)
        .setBukNFTs(await nftContract.getAddress()))
        .to.be.reverted;
    });
  });

  describe("Set BukPOSNFTs in BukProtocol", function () {
    it("Should set BukPOSNFTs contract address by admin", async function () {
      // Set BukPoSNFTs
      expect(await bukProtocolContract.connect(adminWallet)
        .setBukPoSNFTs(await nftPosContract.getAddress())).not.be.reverted;
      const addr1: string = await bukProtocolContract.nftPoSContract();
      const addr2: string = await nftPosContract.getAddress();
      expect(addr1).to.be.equal(addr2);
    });
    it("Should set BukPOSNFTs contract address and emit events", async function () {
      // Set BukPoSNFTs
      expect(await bukProtocolContract.connect(adminWallet)
        .setBukPoSNFTs(await nftPosContract.getAddress()))
        .to.emit(bukProtocolContract, "SetBukPoSNFTs")
        .withArgs(await nftPosContract.getAddress());
    });
    it("Should not set BukPOSNFTs contract address if not admin", async function () {
      // Set BukPoSNFTs
      await expect(bukProtocolContract.connect(account1)
        .setBukPoSNFTs(await nftPosContract.getAddress())).to.be.reverted;
    });
  });

  describe("Set Buk Royalties Contract in BukProtocol", function () {
    it("Should set royaltiesContract by admin", async function () {
      //Set royaltiesContract
      expect(await bukProtocolContract.connect(adminWallet).setRoyaltiesContract(account1)).not.be.reverted;
      const addr1: string = await bukProtocolContract.royaltiesContract();
      const addr2: string = await account1.getAddress();
      expect(addr1).to.be.equal(addr2);
    });
    it("Should set royaltiesContract and emit events", async function () {
      //Set royaltiesContract
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .setRoyaltiesContract(account1))
        .to.emit(bukProtocolContract, "SetBukRoyalties")
        .withArgs(await account1.getAddress());
    });
    it("Should not set royaltiesContract if not admin", async function () {
      //Set royaltiesContract
      await expect(bukProtocolContract.connect(account2).setRoyaltiesContract(account1)).to.be.reverted;
    });
  });

  describe("Set Token URIs for NFTS in BukProtocol", function () {
    it("Should set Token URIs for BukNFTs by admin", async function () {
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

      //Set Token URI
      const newUri = "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json"
      expect(await bukProtocolContract.connect(adminWallet)
        .setTokenUri(
          1,
          newUri,
        )).not.be.reverted;
      const uri = await nftContract.uri(1);
      expect(uri).to.equal(newUri);
    });
    it("Should set Token URIs for BukPOSNFTs by admin", async function () {
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

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).not.be.reverted;

      //Set Token URI
      const newUri = "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json"
      expect(await bukProtocolContract.connect(adminWallet)
        .setTokenUri(
          1,
          newUri,
        )).not.be.reverted;
      const uri = await nftPosContract.uri(1);
      expect(uri).to.equal(newUri);
    });
    it("Should set Token URIs and emit events", async function () {
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

      //Set Token URI
      const newUri = "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json"
      expect(await bukProtocolContract.connect(adminWallet)
        .setTokenUri(
          1,
          newUri,
        ))
        .to.emit(bukProtocolContract, "SetStableToken")
        .withArgs(1, newUri);
    });
    it("Should not set Token URIs if not admin", async function () {
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

      //Set Token URI
      const newUri = "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json"
      await expect(bukProtocolContract.connect(account1)
        .setTokenUri(
          1,
          newUri,
        )).to.be.reverted;
      const uri = await nftContract. uriByTokenId(1);
      expect(uri).not.equal(newUri);
    });
  });

  describe("Set NFT contract name in BukProtocol", function () {
    it("Should set NFT contract name by admin", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New"
      expect(await bukProtocolContract.connect(adminWallet).setNFTContractName(NAME)).not.be.reverted;
      const newName = await nftContract.connect(adminWallet).name()
      expect(newName).to.equal(NAME);
    });
    it("Should set NFT contract name and emit events", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New"
      expect(await bukProtocolContract.connect(adminWallet).setNFTContractName(NAME))
        .to.emit(bukProtocolContract, "UpdateContractName")
        .withArgs(NAME);
    });
    it("Should not set NFT contract name if not admin", async function () {
      //Set Name for NFTs
      const NAME = "BukTrips New"
      await expect(bukProtocolContract.connect(account1).setNFTContractName(NAME))
        .to.be.reverted;
    });
  });

  describe("Set Buk commission in BukProtocol", function () {
    it("Should set Buk commission by admin", async function () {
      //Set Commission
      const COMMISSION: number = 10
      expect(await bukProtocolContract.connect(adminWallet).setCommission(COMMISSION)).not.be.reverted;
      const newCommission = await bukProtocolContract.commission()
      expect(newCommission).to.equal(COMMISSION);
    });
    it("Should set Buk commission and emit events", async function () {
      //Set Commission
      const COMMISSION: number = 10
      await expect(bukProtocolContract.connect(adminWallet).setCommission(COMMISSION))
        .to.emit(bukProtocolContract, "SetCommission")
        .withArgs(5,COMMISSION);
    });
    it("Should not set Buk commission if not admin", async function () {
      //Set Commission
      const COMMISSION: number = 10
      await expect(bukProtocolContract.connect(account1).setCommission(COMMISSION)).to.be.reverted;
    });
  });

})
