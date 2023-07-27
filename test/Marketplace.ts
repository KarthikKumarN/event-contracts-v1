import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Marketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployMarketplaceFixture() {
    const BUK_PROTOCOL = "0x72a8d29b9b9EFCc0B58e11bb42686a527f978699";
    const BUK_NFT = "0xd84C3b47770aeCF852E99C5FdE2C987783027385";
    const CURRENCY = "0xae9B20071252B2f6e807D0D58e94763Aa08905aB";
    const WALLET = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
    const BUK_ROYALTY = 5;
    const HOTEL_ROYALTY = 2;
    const USER_ROYALTY = 1;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    console.log(owner, " owner");

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplaceContract = await Marketplace.deploy(
      BUK_PROTOCOL,
      BUK_NFT,
      WALLET,
      WALLET,
      BUK_ROYALTY,
      HOTEL_ROYALTY,
      USER_ROYALTY,
      CURRENCY,
    );

    return {
      marketplaceContract,
      BUK_PROTOCOL,
      BUK_NFT,
      CURRENCY,
      WALLET,
      BUK_ROYALTY,
      HOTEL_ROYALTY,
      USER_ROYALTY,
      owner,
      otherAccount,
    };
  }

  describe("Deployment marketplace", function () {
    it("Should set the BUK protocol address", async function () {
      const { marketplaceContract, BUK_PROTOCOL } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getBukProtocol()).to.equal(BUK_PROTOCOL);
    });

    it("Should set the BUK NFT address", async function () {
      const { marketplaceContract, BUK_NFT, BUK_PROTOCOL } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getBukNFT()).to.equal(BUK_NFT);
    });

    it("Should set the treasury contract", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getTreasuryContract()).to.equal(WALLET);
    });

    it("Should set the hotel wallet", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getHotelWallet()).to.equal(WALLET);
    });

    it("Should set the BUK royalty", async function () {
      const { marketplaceContract, BUK_ROYALTY } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getBukRoyalty()).to.equal(BUK_ROYALTY);
    });

    it("Should set the hotel royalty", async function () {
      const { marketplaceContract, HOTEL_ROYALTY } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getHotelRoyalty()).to.equal(
        HOTEL_ROYALTY,
      );
    });

    it("Should set the User royalty", async function () {
      const { marketplaceContract, USER_ROYALTY } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getUserRoyalty()).to.equal(USER_ROYALTY);
    });

    it("Should set the stable token", async function () {
      const { marketplaceContract, CURRENCY } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getStableToken()).to.equal(CURRENCY);
    });
  });
  // Test cases for setting royalties
  describe("Set royalty for marketplace", function () {
    it("Should set the BUK royalty", async function () {
      const { marketplaceContract, BUK_ROYALTY } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newBukRoyalty = 3;
      await expect(await marketplaceContract.setBukRoyalty(newBukRoyalty)).to
        .not.be.reverted;
      expect(await marketplaceContract.getBukRoyalty()).to.equal(newBukRoyalty);
    });
    it("Should reverted for 0 BUK royalty", async function () {
      const { marketplaceContract, BUK_ROYALTY } = await loadFixture(
        deployMarketplaceFixture,
      );
      await expect(marketplaceContract.setBukRoyalty(0)).to.be.revertedWith(
        "Value should be greater than zero",
      );
    });

    it("Should set the Hotel royalty", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newHotelRoyalty = 3;
      await expect(await marketplaceContract.setHotelRoyalty(newHotelRoyalty))
        .to.not.be.reverted;
      expect(await marketplaceContract.getHotelRoyalty()).to.equal(
        newHotelRoyalty,
      );
    });
    it("Should reverted for 0 Hotel royalty", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      await expect(marketplaceContract.setHotelRoyalty(0)).to.be.revertedWith(
        "Value should be greater than zero",
      );
    });

    it("Should set the User royalty", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newUserRoyalty = 3;
      await expect(await marketplaceContract.setUserRoyalty(newUserRoyalty)).to
        .not.be.reverted;
      expect(await marketplaceContract.getUserRoyalty()).to.equal(
        newUserRoyalty,
      );
    });
    it("Should reverted for 0 User royalty", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      await expect(marketplaceContract.setUserRoyalty(0)).to.be.revertedWith(
        "Value should be greater than zero",
      );
    });
  });

  // Test cases for setting royalties
  describe("Set Treasury contract for marketplace", function () {
    it("Should set the BUK treasury", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newTreasury = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setTreasuryContract(newTreasury))
        .to.not.be.reverted;
      expect(await marketplaceContract.getTreasuryContract()).to.equal(
        newTreasury,
      );
    });
    it("Should reverted with error BUK treasury", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newTreasury = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setTreasuryContract(newTreasury),
      ).to.be.revertedWith("Invalid address");
    });
  });

  // Test cases for setting royalties
  describe("Set hotel wallet for marketplace", function () {
    it("Should set the hotel wallet", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newWallet = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setHotelWallet(newWallet)).to.not
        .be.reverted;
      expect(await marketplaceContract.getHotelWallet()).to.equal(newWallet);
    });
    it("Should reverted with error hotel wallet", async function () {
      const { marketplaceContract, WALLET } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newWallet = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setHotelWallet(newWallet),
      ).to.be.revertedWith("Invalid address");
    });
  });
});
