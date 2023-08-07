import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import { ethers } from "hardhat";
  import { ContractTransactionResponse } from "ethers";
  import { BukProtocol } from "../../typechain-types";
  import { bukNfTs } from "../../typechain-types/contracts";
  
  describe("BukProtocol Updations", function () {
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
      nftPosContract.getAddress(),
      bukProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
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

    describe("Set Currency in BukProtocol", function () {
      it("Should set Currency by admin", async function () {
        //Set Currency
      expect(await bukProtocolContract.connect(adminWallet).setCurrency(account1)).not.be.reverted;
        const addresses = await bukProtocolContract.connect(adminWallet).getWallets()
        expect(addresses[2]).to.equal(await account1.getAddress());
      });
      it("Should set Currency and emit events", async function () {
        //Set Currency
      expect(
        await bukProtocolContract
        .connect(adminWallet)
        .setCurrency(account1))
        .to.emit(bukProtocolContract, "SetCurrency")
        .withArgs(await account1.getAddress());
      });
      it("Should not set Currency if not admin", async function () {
        //Set Currency
        await expect(bukProtocolContract.connect(account2).setCurrency(account1)).to.be.reverted;
      });
    });

})
  