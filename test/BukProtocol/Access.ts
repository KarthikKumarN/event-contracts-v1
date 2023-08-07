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

describe("BukProtocol Access Control", function () {
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
  });

  describe("Manage Admin Role", function () {
    it("Should add new admin", async function () {      
      //Add new address to Admin role
      console.log("🚀 ~ file: Access.ts:108 ~ bukProtocolContract:", bukProtocolContract.getAddress())
      expect(
        await bukProtocolContract.connect(adminWallet).grantRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await bukProtocolContract.connect(adminWallet).hasRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).to.equal(true)
    });
    it("Should set new admin and revoke old admin", async function () {
      //Add new address to Admin role
      expect(
        await bukProtocolContract.connect(adminWallet).grantRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await bukProtocolContract.connect(adminWallet).hasRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).to.equal(true)

      //Revoke the new admin's access
      expect(
        await bukProtocolContract.connect(adminWallet).revokeRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).not.be.reverted;


      //Check if the new admin still has ADMIN_ROLE
      expect(
        await bukProtocolContract.connect(adminWallet).hasRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).to.equal(false)
      
    });
    it("Should execute function with new admin", async function () {      
      //Add new address to Admin role
      expect(
        await bukProtocolContract.connect(adminWallet).grantRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).not.be.reverted;

      //Check if the new admin has ADMIN_ROLE
      expect(
        await bukProtocolContract.connect(adminWallet).hasRole(
          "0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42",
          account1
        ),
      ).to.equal(true)

      expect((await bukProtocolContract.connect(account1).getWallets())
      ).not.be.reverted;
    });
  });
});
