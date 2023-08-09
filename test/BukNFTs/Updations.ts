import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes } from "ethers";

describe("BukNFTs Updations", function () {
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
  });

  describe("Set Buk Protocol in BukNFTs", function () {
    it("Should set Buk Protocol in BukNFTs", async function () {
      expect(await nftContract.setBukProtocol(await bukProtocolContract.getAddress()))
        .not.be.reverted;
      //Check if Buk Protocol is set
      expect(await nftContract.bukProtocolContract()).to.equal(await bukProtocolContract.getAddress());
    });
    it("Should set Buk Protocol and emit event", async function () {
      expect(await nftContract.setBukProtocol(bukProtocolContract.getAddress()))
        .to.emit(nftContract, "SetBukProtocol")
        .withArgs(bukProtocolContract.getAddress());
    });
    it("Should revert if not called by admin", async function () {
      await expect(nftContract.connect(account1)
        .setBukProtocol(bukProtocolContract.getAddress())).to.be.reverted;
    })
  });

  describe("Set Buk Treasury in BukNFTs", function () {
    it("Should set Buk Treasury in BukNFTs", async function () {
      expect(await nftContract.setBukTreasury(await bukTreasuryContract.getAddress()))
        .not.be.reverted;
    });
    it("Should set Buk Treasury and emit event", async function () {
      expect(await nftContract.setBukTreasury(bukTreasuryContract.getAddress()))
        .to.emit(nftContract, "SetBukTreasury")
        .withArgs(bukTreasuryContract.getAddress());
    });
    it("Should revert if not called by admin", async function () {
      await expect(nftContract.connect(account1)
        .setBukTreasury(bukTreasuryContract.getAddress())).to.be.reverted;
    })
  });

  describe("Set Marketplace Role in BukNFTs", function () {
    //Get the keccak256 hash of the MARKETPLACE_ROLE
    const MARKETPLACE_ROLE = keccak256(toUtf8Bytes("MARKETPLACE_ROLE"));

    it("Should set Marketplace in BukNFTs", async function () {
      expect(await nftContract.setMarketplaceRole(marketplaceContract.getAddress()))
        .not.be.reverted;
      //Check if Marketplace is set
      expect(await nftContract.hasRole(MARKETPLACE_ROLE, await marketplaceContract.getAddress()))
        .not.be.reverted;
    });
    it("Should set Marketplace and emit event", async function () {
      expect(await nftContract.setMarketplaceRole(marketplaceContract.getAddress()))
        .to.emit(nftContract, "SetMarketplace")
        .withArgs(marketplaceContract.getAddress());
    });
    it("Should revert if not called by admin", async function () {
      await expect(nftContract.connect(account1)
        .setMarketplaceRole(marketplaceContract.getAddress())).to.be.reverted;
    })
  });

  describe("Grant BukPOSNFTs Role in BukNFTs", function () {
    it("Should grant BukPOSNFTs role in BukNFTs", async function () {
      expect(await nftContract.grantBukPOSNFTRole(await nftPosContract.getAddress()))
        .not.be.reverted;
      //Check if BukPOSNFTs is set
      expect(await nftContract.nftPoSContract())
        .to.equal(await nftPosContract.getAddress());
    })
    it("Should grant BukPOSNFTs role and emit event", async function () {
      expect(await nftContract.grantBukPOSNFTRole(await nftPosContract.getAddress()))
        .to.emit(nftContract, "GrantNftPoSContractRole")
        .withArgs(await nftPosContract.getAddress());
    })
    it("Should revert if not called by admin", async function () {
      await expect(nftContract.connect(account1)
        .grantBukPOSNFTRole(await nftPosContract.getAddress()))
        .to.be.reverted;
    })

  });

  describe("Safe transfer of Buk PoS NFTs", function () {
    it("Should safe transfer Buk PoS NFTs", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;
      expect(
        await nftContract.connect(testMarketplace1).safeTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          1,
          1,
          "0x"
        )
      ).not.be.reverted;

    })

    it("Should safe transfer Buk PoS NFTs and emit event", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;
      expect(
        await nftContract.connect(testMarketplace1).safeTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          1,
          1,
          "0x"
        )
      )
        .to.emit(nftContract, "TransferSingle")
        .withArgs(await testMarketplace1.getAddress(), owner.getAddress(), account1.getAddress(), 1, 1);

    })

    it("Should revert if not called by marketplace", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;
      await expect(
        nftContract.connect(account1).safeTransferFrom(
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
    it("Should safe batch transfer Buk PoS NFTs", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;
      expect(
        await nftContract.connect(testMarketplace1).safeBatchTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          [1],
          [1],
          "0x"
        )
      ).not.be.reverted;

    })

    it("Should safe batch transfer Buk PoS NFTs and emit event", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      //Set Marketplace
      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;

      //Safe batch transfer
      expect(
        await nftContract.connect(testMarketplace1).safeBatchTransferFrom(
          await owner.getAddress(),
          await account1.getAddress(),
          [1],
          [1],
          "0x"
        )
      )
        .to.emit(nftContract, "TransferBatch")
        .withArgs(await testMarketplace1.getAddress(), owner.getAddress(), account1.getAddress(), [1], [1]);

    })

    it("Should revert if not called by marketplace", async function () {
      //Approve marketplace
      await expect(nftContract.connect(owner)
        .setApprovalForAll(await testMarketplace1.getAddress(), 1)
      ).not.be.reverted;

      //Check the allowance
      const allowance = await nftContract.connect(owner).isApprovedForAll(owner.address, await testMarketplace1.getAddress())

      //Set Marketplace role in BukNFTs
      expect(await nftContract.setMarketplaceRole(testMarketplace1.getAddress()))
        .not.be.reverted;

      await expect(
        nftContract.connect(account1).safeBatchTransferFrom(
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
