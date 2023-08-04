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
  
  describe("BukProtocol", function () {
    let stableTokenContract;
    let bukProtocolContract;
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
  
    before("deploy the contract instance first", async function () {
      [
        owner,
        account1,
        account2,
        adminWallet,
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
        2000000,
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
        bukProtocolContract.getAddress()
      );
  
      // BukNFT
      const BukNFT = await ethers.getContractFactory("BukNFTs");
      nftContract = await BukNFT.deploy(
        "BUK_NFT",
        nftPosContract.getAddress(),
        bukProtocolContract.getAddress()
      );
  
      //Set BukNFTs address in Buk Protocol
      const setBukNFTs = await bukProtocolContract.setBukNFTs(nftContract.getAddress())
  
      //Set BukPOSNFTs address in Buk Protocol
      const setBukPoSNFTs = await bukProtocolContract.setBukPoSNFTs(nftPosContract.getAddress())
      
    });
 });
  