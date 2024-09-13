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

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukProtocolContract.getAddress(),
      stableTokenContract.getAddress(),
    );

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      await bukProtocolContract.getAddress(),
      await bukTreasuryContract.getAddress(),
      await marketplaceContract.getAddress(),
    );

    //Set BukNFTs address in Buk Protocol
    // const setBukNFTs = await bukProtocolContract.setBukNFTs(
    //   nftContract.getAddress(),
    // );

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );

    //Grant allowance permission
    const res = await stableTokenContract
      .connect(owner)
      .approve(await bukProtocolContract.getAddress(), 150000000);

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
      expect(await nftContract.bukEventProtocolContract()).to.equal(
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

  describe(" Mint test case BukNFTs", function () {
    it("should mint a new token", async function () {
      const BUK_EVENT_PROTOCOL_ROLE = keccak256(
        toUtf8Bytes("BUK_EVENT_PROTOCOL_ROLE"),
      );
      await nftContract.grantRole(BUK_EVENT_PROTOCOL_ROLE, owner.address);

      const tokenId = 1;
      const amount = 10;
      const data = "0x";
      const uri = "https://example.com/token/1";
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        nftContract
          .connect(owner)
          .mint(tokenId, account1.address, amount, data, uri),
      )
        .to.emit(nftContract, "TransferSingle")
        .withArgs(
          owner.address,
          newContract,
          account1.address,
          tokenId,
          amount,
        );

      // Verify the balance
      expect(await nftContract.balanceOf(account1.address, tokenId)).to.equal(
        amount,
      );
    });

    it("should fail to mint if caller does not have BUK_EVENT_PROTOCOL_ROLE", async function () {
      const BUK_EVENT_PROTOCOL_ROLE = keccak256(
        toUtf8Bytes("BUK_EVENT_PROTOCOL_ROLE"),
      );
      const tokenId = 1;
      const amount = 10;
      const data = "0x";
      const uri = "https://example.com/token/1";

      await expect(
        nftContract
          .connect(account1)
          .mint(tokenId, account1.address, amount, data, uri),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await nftContract.BUK_EVENT_PROTOCOL_ROLE()}`,
      );
    });
    it("should mint set new url, admin", async function () {
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      const BUK_EVENT_DEPLOYER_ROLE = keccak256(
        toUtf8Bytes("BUK_EVENT_DEPLOYER_ROLE"),
      );

      await nftContract.grantRole(BUK_EVENT_DEPLOYER_ROLE, owner.address);
      await nftContract.grantRole(ADMIN_ROLE, account1.address);

      await nftContract.connect(account1).setBukEventProtocol(owner.address);

      const tokenId = 1;
      const amount = 10;
      const data = "0x";
      const uri = "https://example.com/token/1";
      const uri2 = "https://example.com/token/2";
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        nftContract
          .connect(owner)
          .mint(tokenId, account1.address, amount, data, uri),
      )
        .to.emit(nftContract, "TransferSingle")
        .withArgs(
          owner.address,
          newContract,
          account1.address,
          tokenId,
          amount,
        );

      // // setURI
      await expect(await nftContract.connect(account1).setURI(tokenId, uri2))
        .not.be.reverted;

      expect(await nftContract.uri(1)).to.equal(uri2);
    });
  });

  describe("Burn test case BukNFTs", function () {
    it("should burn a token", async function () {
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      const BUK_EVENT_PROTOCOL_ROLE = keccak256(
        toUtf8Bytes("BUK_EVENT_PROTOCOL_ROLE"),
      );
      await nftContract.grantRole(BUK_EVENT_PROTOCOL_ROLE, owner.address);

      const tokenId = 1;
      const amount = 10;
      const data = "0x";
      const uri = "https://example.com/token/1";

      // Mint a token first
      await nftContract
        .connect(owner)
        .mint(tokenId, account1.address, amount, data, uri);
      let newContract = "0x0000000000000000000000000000000000000000";

      // Burn the token
      await expect(
        nftContract.connect(owner).burn(account1.address, tokenId, amount),
      )
        .to.emit(nftContract, "TransferSingle")
        .withArgs(
          owner.address,
          account1.address,
          newContract,
          tokenId,
          amount,
        );

      // Verify the balance
      expect(await nftContract.balanceOf(account1.address, tokenId)).to.equal(
        0,
      );

      // Verify the URI is deleted
      expect(await nftContract.uri(tokenId)).to.equal("");
    });

    it("should fail to burn if caller does not have BUK_EVENT_PROTOCOL_ROLE", async function () {
      const ADMIN_ROLE = keccak256(toUtf8Bytes("ADMIN_ROLE"));

      const BUK_EVENT_PROTOCOL_ROLE = keccak256(
        toUtf8Bytes("BUK_EVENT_PROTOCOL_ROLE"),
      );
      const tokenId = 1;
      const amount = 10;
      const data = "0x";
      const uri = "https://example.com/token/1";

      // Mint a token first
      await nftContract.grantRole(BUK_EVENT_PROTOCOL_ROLE, owner.address);
      await nftContract
        .connect(owner)
        .mint(tokenId, account1.address, amount, data, uri);

      // Attempt to burn the token without the required role
      await expect(
        nftContract.connect(account1).burn(account1.address, tokenId, amount),
      ).to.be.revertedWith(
        "AccessControl: account " +
          account1.address.toLowerCase() +
          " is missing role " +
          BUK_EVENT_PROTOCOL_ROLE,
      );
    });
  });
  //   it("Should set Token URIs for BukNFTs by admin", async function () {
  //     //Check-in NFT
  //     // await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
  //     //   .reverted;

  //     //Set Token URI
  //     const newUri =
  //       "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
  //     expect(await nftContract.connect(adminWallet).setURI(1, newUri)).not.be
  //       .reverted;
  //     const uri = await nftContract.uri(1);
  //     expect(uri).to.equal(newUri);
  //   });
  //   it("Should set Token URIs and emit events", async function () {
  //     //Check-in NFT
  //     // await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
  //     //   .reverted;

  //     //Set Token URI
  //     const newUri =
  //       "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
  //     expect(await nftContract.connect(adminWallet).setURI(1, newUri))
  //       .to.emit(nftContract, "SetURI")
  //       .withArgs(1, newUri);
  //   });
  //   it("Should not set if token is not minted", async function () {
  //     //Set Token URI
  //     const newUri =
  //       "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
  //     await expect(
  //       nftContract.connect(adminWallet).setURI(3, newUri),
  //     ).to.be.revertedWith("Token does not exist on BukNFTs");
  //   });
  //   it("Should not set Token URIs if not admin", async function () {
  //     //Set Token URI
  //     const newUri =
  //       "http://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json";
  //     await expect(nftContract.connect(account1).setURI(1, newUri)).to.be
  //       .reverted;
  //     const uri = await nftContract.uri(1);
  //     expect(uri).not.equal(newUri);
  //   });
  // });

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
