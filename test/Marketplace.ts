import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { IMarketplace__factory } from "../typechain-types";

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
    it("Should get listed status for true", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await marketplaceContract.createListing(tokenId, price);
      await expect(await marketplaceContract.isListed(tokenId)).to.equal(true);
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
    });
    it("Should get listed details and verify for valid values", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await marketplaceContract.createListing(tokenId, price);
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);
      await expect(listingDetails[0]).to.equal(price);
      await expect(listingDetails[1]).to.equal(0);
    });
    //TODO Check for listed status
  });

  // Test cases for create listing
  describe("Crate Listing marketplace", function () {
    it("Should create listing", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
    });

    it("Should create and verify listing", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await marketplaceContract.createListing(tokenId, price);
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);

      await expect(listingDetails[0]).to.equal(price);
      // Since listing with active status value will be 0
      await expect(listingDetails[1]).to.equal(0);
    });

    it("Should revert for already listed token ID", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await marketplaceContract.createListing(tokenId, price);
      await expect(
        marketplaceContract.createListing(tokenId, price),
      ).to.be.revertedWith("NFT already listed");
    });

    // it("Should emit event listed token ID", async function () {
    //   const { marketplaceContract } = await loadFixture(
    //     deployMarketplaceFixture,
    //   );
    //   let tokenId = 1;
    //   let price = 100;
    //   await expect(await marketplaceContract.createListing(tokenId, price))
    //     .to.emit(marketplaceContract, "BukNFTSet")
    //     .withArgs(oldAddress, newAddress);
    // });

    //TODO Check emit event
  });

  // Test cases for delist
  describe("Delist function marketplace", function () {
    it("Should delist ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;

      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.delist(tokenId)).to.not.be
        .reverted;
    });
    it("Should delist and verify delist status ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;

      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.delist(tokenId)).to.not.be
        .reverted;
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);
      await expect(listingDetails[0]).to.equal(price);
      await expect(listingDetails[1]).to.equal(1);
    });

    it("Should emit event delisted token ID", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;

      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.delist(tokenId))
        .to.emit(marketplaceContract, "Delisted")
        .withArgs(tokenId);
    });
    it("Should revert delist for not listed token ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      await expect(marketplaceContract.delist(tokenId)).to.be.revertedWith(
        "NFT not listed",
      );
    });
    // TODO for owner validation
  });

  // Test cases for delete
  describe("Delete listing function marketplace", function () {
    it("Should delete listing ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.deleteListing(tokenId)).to.not.be
        .reverted;
    });
    it("Should delete listing and verify status", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.deleteListing(tokenId)).to.not.be
        .reverted;
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);
      await expect(listingDetails[0]).to.equal(0);
      await expect(listingDetails[1]).to.equal(0);
    });

    it("Should emit event deleted token ID", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;

      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.deleteListing(tokenId))
        .to.emit(marketplaceContract, "DeletedListing")
        .withArgs(tokenId);
    });
    it("Should revert delete listing for not listed token ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      await expect(
        marketplaceContract.deleteListing(tokenId),
      ).to.be.revertedWith("NFT not listed");
    });
    //TODO owner check and contract
  });

  // Test cases for relist
  describe("Relist listing function marketplace", function () {
    it("Should relist listing ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      let price2 = 200;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.relist(tokenId, price2)).to.not.be
        .reverted;
    });
    it("Should revert relist listing for not listed token ", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await expect(
        marketplaceContract.relist(tokenId, price),
      ).to.be.revertedWith("NFT not listed");
    });
    it("Should relist listing and verify status", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      let price2 = 200;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.relist(tokenId, price2)).to.not.be
        .reverted;
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);
      await expect(listingDetails[0]).to.equal(price2);
      await expect(listingDetails[1]).to.equal(0);
    });

    it("Should delist and relist listing and verify status", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.delist(tokenId)).to.not.be
        .reverted;
      let listingDetails = await marketplaceContract.getListingDetails(tokenId);
      await expect(listingDetails[0]).to.equal(price);
      await expect(listingDetails[1]).to.equal(1);
      await expect(await marketplaceContract.relist(tokenId, price)).to.not.be
        .reverted;
      let listingDetails2 = await marketplaceContract.getListingDetails(
        tokenId,
      );
      await expect(listingDetails2[0]).to.equal(price);
      await expect(listingDetails2[1]).to.equal(0);
    });

    it("Should emit event on relist token ID", async function () {
      const { marketplaceContract } = await loadFixture(
        deployMarketplaceFixture,
      );
      let tokenId = 1;
      let price = 100;
      let price2 = 100;
      await expect(await marketplaceContract.createListing(tokenId, price)).to
        .not.be.reverted;
      await expect(await marketplaceContract.relist(tokenId, price2))
        .to.emit(marketplaceContract, "Relisted")
        .withArgs(tokenId, price, price2);
    });
  });
});
