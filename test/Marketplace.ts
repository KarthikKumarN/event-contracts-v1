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

    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2] = await ethers.getSigners();
    console.log(owner, " owner");

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplaceContract = await Marketplace.deploy(
      BUK_PROTOCOL,
      BUK_NFT,
      CURRENCY,
    );

    return {
      marketplaceContract,
      BUK_PROTOCOL,
      BUK_NFT,
      CURRENCY,
      owner,
      account1,
      account2,
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

    it("Should set the stable token", async function () {
      const { marketplaceContract, CURRENCY } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getStableToken()).to.equal(CURRENCY);
    });

    it("Should set the buk protocol contract", async function () {
      const { marketplaceContract, BUK_PROTOCOL } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getBukProtocol()).to.equal(BUK_PROTOCOL);
    });

    it("Should set the buk NFT contract", async function () {
      const { marketplaceContract, BUK_NFT } = await loadFixture(
        deployMarketplaceFixture,
      );
      expect(await marketplaceContract.getBukNFT()).to.equal(BUK_NFT);
    });
  });

  // Test cases for setting buk protocol
  describe("Set Buk protocol contract for marketplace", function () {
    it("Should set the BUK protocol", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newContract = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukProtocol(newContract)).to.not
        .be.reverted;
      expect(await marketplaceContract.getBukProtocol()).to.equal(newContract);
    });
    it("Should reverted with error Buk protocol contract", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setBukProtocol(newContract),
      ).to.be.revertedWith("Invalid address");
    });

    it("Should set the Buk protocol contract and emit event", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let oldAddress = await marketplaceContract.getBukProtocol();
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukProtocol(newAddress))
        .to.emit(marketplaceContract, "BukProtocolSet")
        .withArgs(oldAddress, newAddress);
    });

    it("Should reverted with admin error Buk protocol contract", async function () {
      const { marketplaceContract, owner, account1 } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";

      console.log(owner, account1);
      console.log(await marketplaceContract.ADMIN_ROLE());
      await expect(
        marketplaceContract.connect(account1).setBukProtocol(newAddress),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await marketplaceContract.ADMIN_ROLE()}`,
      );
    });
  });

  // Test cases for setting buk NFT
  describe("Set Buk NFT contract for marketplace", function () {
    it("Should set the BUK NFT", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newContract = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukNFT(newContract)).to.not.be
        .reverted;
      expect(await marketplaceContract.getBukNFT()).to.equal(newContract);
    });
    it("Should reverted with error Buk NFT contract", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setBukNFT(newContract),
      ).to.be.revertedWith("Invalid address");
    });

    it("Should set the Buk NFT contract and emit event", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let oldAddress = await marketplaceContract.getBukNFT();
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukNFT(newAddress))
        .to.emit(marketplaceContract, "BukNFTSet")
        .withArgs(oldAddress, newAddress);
    });

    it("Should reverted with admin error Buk NFT contract", async function () {
      const { marketplaceContract, owner, account1 } = await loadFixture(
        deployMarketplaceFixture,
      );
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";

      console.log(owner, account1);
      console.log(await marketplaceContract.ADMIN_ROLE());
      await expect(
        marketplaceContract.connect(account1).setBukNFT(newAddress),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await marketplaceContract.ADMIN_ROLE()}`,
      );
    });
  });
  // Test cases for getting listed status
  describe("Listed status marketplace", function () {
    it("Should get listed status", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      await expect(await marketplaceContract.isListed(0)).to.equal(false);
    });
    //TODO Check for listed status
  });

  // Test cases for getting listing details
  describe("Listing details marketplace", function () {
    it("Should get listed details should be zero", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let listingDetails = await marketplaceContract.getListingDetails(0);
      await expect(listingDetails[0]).to.equal(0);
      await expect(listingDetails[1]).to.equal(0);
      await expect(listingDetails[2]).to.equal(0);
    });
    //TODO Check for listed once listed
  });
});
