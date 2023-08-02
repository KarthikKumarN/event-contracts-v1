import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractTransactionResponse } from "ethers";
import { Marketplace } from "../typechain-types";
import { BukProtocol } from "../typechain-types";
import { bukNfTs } from "../typechain-types/contracts";

describe("Marketplace", function () {
  let stableTokenContract;
  let marketplaceContract;
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
    console.log(await stableTokenContract.getAddress(), " tokenContract");

    //BukTreasury
    const BukTreasury = await ethers.getContractFactory("BukTreasury");
    bukTreasuryContract = await BukTreasury.deploy(
      stableTokenContract.getAddress(),
    );
    console.log(await bukTreasuryContract.getAddress(), " bukTreasuryContract");

    //BukProtocol
    const BukProtocol = await ethers.getContractFactory("BukProtocol");
    bukProtocolContract = await BukProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.address,
    );
    console.log(await bukProtocolContract.getAddress(), " bukProtocolContract");

    // BukPOSNFT
    const BukPOSNFT = await ethers.getContractFactory("BukPOSNFTs");
    nftPosContract = await BukPOSNFT.deploy(
      "BUK_POS",
      bukProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
    );
    console.log(await nftPosContract.getAddress(), " nftPosContract");

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      nftPosContract.getAddress(),
      bukProtocolContract.getAddress(),
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
    );
    console.log(await nftContract.getAddress(), " nftContract");

    //Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(
      bukProtocolContract.getAddress(),
      nftContract.getAddress(),
      stableTokenContract.getAddress(),
    );
    console.log(await marketplaceContract.getAddress(), " marketplaceContract");
  });

  describe("Deployment marketplace", function () {
    it("Should set the BUK protocol address", async function () {
      expect(await marketplaceContract.getBukProtocol()).to.equal(
        await bukProtocolContract.getAddress(),
      );
    });

    it("Should set the BUK NFT address", async function () {
      expect(await marketplaceContract.getBukNFT()).to.equal(
        await nftContract.getAddress(),
      );
    });

    it("Should set the stable token", async function () {
      expect(await marketplaceContract.getStableToken()).to.equal(
        await stableTokenContract.getAddress(),
      );
    });

    it("Should set the buk protocol contract", async function () {
      expect(await marketplaceContract.getBukProtocol()).to.equal(
        await bukProtocolContract.getAddress(),
      );
    });

    it("Should set the buk NFT contract", async function () {
      expect(await marketplaceContract.getBukNFT()).to.equal(
        await nftContract.getAddress(),
      );
    });
  });

  // Test cases for setting buk protocol
  describe("Set Buk protocol contract for marketplace", function () {
    it("Should set the BUK protocol", async function () {
      let newContract = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukProtocol(newContract)).to.not
        .be.reverted;
      expect(await marketplaceContract.getBukProtocol()).to.equal(newContract);
    });
    it("Should reverted with error Buk protocol contract", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setBukProtocol(newContract),
      ).to.be.revertedWith("Invalid address");
    });

    it("Should set the Buk protocol contract and emit event", async function () {
      let oldAddress = await marketplaceContract.getBukProtocol();
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukProtocol(newAddress))
        .to.emit(marketplaceContract, "BukProtocolSet")
        .withArgs(oldAddress, newAddress);
    });

    it("Should reverted with admin error Buk protocol contract", async function () {
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(
        marketplaceContract.connect(account1).setBukProtocol(newAddress),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await marketplaceContract.ADMIN_ROLE()}`,
      );
    });
  });

  // // Test cases for setting buk NFT
  describe("Set Buk NFT contract for marketplace", function () {
    it("Should set the BUK NFT", async function () {
      let newContract = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukNFT(newContract)).to.not.be
        .reverted;
      expect(await marketplaceContract.getBukNFT()).to.equal(newContract);
    });
    it("Should reverted with error Buk NFT contract", async function () {
      let newContract = "0x0000000000000000000000000000000000000000";
      await expect(
        marketplaceContract.setBukNFT(newContract),
      ).to.be.revertedWith("Invalid address");
    });

    it("Should set the Buk NFT contract and emit event", async function () {
      let oldAddress = await marketplaceContract.getBukNFT();
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";
      await expect(await marketplaceContract.setBukNFT(newAddress))
        .to.emit(marketplaceContract, "BukNFTSet")
        .withArgs(oldAddress, newAddress);
    });

    it("Should reverted with admin error Buk NFT contract", async function () {
      let newAddress = "0xa9a1C7be37Cb72811A6C4C278cA7C403D6459b78";

      await expect(
        marketplaceContract.connect(account1).setBukNFT(newAddress),
      ).to.be.revertedWith(
        `AccessControl: account ${account1.address.toLowerCase()} is missing role ${await marketplaceContract.ADMIN_ROLE()}`,
      );
    });
  });
  // // Test cases for getting listed status
  describe("Listed status marketplace", function () {
    it("Should get listed status for not listed tokeId", async function () {
      await expect(await marketplaceContract.isListed(0)).to.equal(false);
    });
    it("Should book and mint and get details", async function () {
      let tokenId = 1;
      let price = 100;
      //Grant allowance permission
      await stableTokenContract.approve(
        await bukProtocolContract.getAddress(),
        200000000000,
      );
      // Book room and mint NFT

      expect(
        await bukProtocolContract.bookRoom(
          1,
          [100000000],
          [80000000],
          1691064540,
          1691150940,
        ),
      ).not.be.reverted;
      //Mint
      await expect(
        bukProtocolContract.mintBukNFT(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ),
      ).not.be.reverted;
      // await marketplaceContract.createListing(tokenId, price);
      // await expect(await marketplaceContract.isListed(tokenId)).to.equal(true);
    });
    //TODO Check for listed status
  });

  // // Test cases for getting listing details
  // describe("Listing details marketplace", function () {
  //   it("Should get listed details should be zero", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let listingDetails = await marketplaceContract.getListingDetails(0);
  //     await expect(listingDetails[0]).to.equal(0);
  //     await expect(listingDetails[1]).to.equal(0);
  //   });
  //   it("Should get listed details and verify for valid values", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await marketplaceContract.createListing(tokenId, price);
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);
  //     await expect(listingDetails[0]).to.equal(price);
  //     await expect(listingDetails[1]).to.equal(0);
  //   });
  //   //TODO Check for listed status
  // });

  // // Test cases for create listing
  // describe("Crate Listing marketplace", function () {
  //   it("Should create listing", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //   });

  //   it("Should create and verify listing", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await marketplaceContract.createListing(tokenId, price);
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);

  //     await expect(listingDetails[0]).to.equal(price);
  //     // Since listing with active status value will be 0
  //     await expect(listingDetails[1]).to.equal(0);
  //   });

  //   it("Should revert for already listed token ID", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await marketplaceContract.createListing(tokenId, price);
  //     await expect(
  //       marketplaceContract.createListing(tokenId, price),
  //     ).to.be.revertedWith("NFT already listed");
  //   });

  //   // it("Should emit event listed token ID", async function () {
  //   //   const { marketplaceContract } = await loadFixture(
  //   //     deployMarketplaceFixture,
  //   //   );
  //   //   let tokenId = 1;
  //   //   let price = 100;
  //   //   await expect(await marketplaceContract.createListing(tokenId, price))
  //   //     .to.emit(marketplaceContract, "BukNFTSet")
  //   //     .withArgs(oldAddress, newAddress);
  //   // });

  //   //TODO Check emit event
  // });

  // // Test cases for delist
  // describe("Delist function marketplace", function () {
  //   it("Should delist ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;

  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.delist(tokenId)).to.not.be
  //       .reverted;
  //   });
  //   it("Should delist and verify delist status ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;

  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.delist(tokenId)).to.not.be
  //       .reverted;
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);
  //     await expect(listingDetails[0]).to.equal(price);
  //     await expect(listingDetails[1]).to.equal(1);
  //   });

  //   it("Should emit event delisted token ID", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;

  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.delist(tokenId))
  //       .to.emit(marketplaceContract, "Delisted")
  //       .withArgs(tokenId);
  //   });
  //   it("Should revert delist for not listed token ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     await expect(marketplaceContract.delist(tokenId)).to.be.revertedWith(
  //       "NFT not listed",
  //     );
  //   });
  //   // TODO for owner validation
  // });

  // // Test cases for delete
  // describe("Delete listing function marketplace", function () {
  //   it("Should delete listing ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.deleteListing(tokenId)).to.not.be
  //       .reverted;
  //   });
  //   it("Should delete listing and verify status", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.deleteListing(tokenId)).to.not.be
  //       .reverted;
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);
  //     await expect(listingDetails[0]).to.equal(0);
  //     await expect(listingDetails[1]).to.equal(0);
  //   });

  //   it("Should emit event deleted token ID", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;

  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.deleteListing(tokenId))
  //       .to.emit(marketplaceContract, "DeletedListing")
  //       .withArgs(tokenId);
  //   });
  //   it("Should revert delete listing for not listed token ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     await expect(
  //       marketplaceContract.deleteListing(tokenId),
  //     ).to.be.revertedWith("NFT not listed");
  //   });
  //   //TODO owner check and contract
  // });

  // // Test cases for relist
  // describe("Relist listing function marketplace", function () {
  //   it("Should relist listing ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     let price2 = 200;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.relist(tokenId, price2)).to.not.be
  //       .reverted;
  //   });
  //   it("Should revert relist listing for not listed token ", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await expect(
  //       marketplaceContract.relist(tokenId, price),
  //     ).to.be.revertedWith("NFT not listed");
  //   });
  //   it("Should relist listing and verify status", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     let price2 = 200;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.relist(tokenId, price2)).to.not.be
  //       .reverted;
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);
  //     await expect(listingDetails[0]).to.equal(price2);
  //     await expect(listingDetails[1]).to.equal(0);
  //   });

  //   it("Should delist and relist listing and verify status", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.delist(tokenId)).to.not.be
  //       .reverted;
  //     let listingDetails = await marketplaceContract.getListingDetails(tokenId);
  //     await expect(listingDetails[0]).to.equal(price);
  //     await expect(listingDetails[1]).to.equal(1);
  //     await expect(await marketplaceContract.relist(tokenId, price)).to.not.be
  //       .reverted;
  //     let listingDetails2 = await marketplaceContract.getListingDetails(
  //       tokenId,
  //     );
  //     await expect(listingDetails2[0]).to.equal(price);
  //     await expect(listingDetails2[1]).to.equal(0);
  //   });

  //   it("Should emit event on relist token ID", async function () {
  //     const { marketplaceContract } = await loadFixture(
  //       deployMarketplaceFixture,
  //     );
  //     let tokenId = 1;
  //     let price = 100;
  //     let price2 = 100;
  //     await expect(await marketplaceContract.createListing(tokenId, price)).to
  //       .not.be.reverted;
  //     await expect(await marketplaceContract.relist(tokenId, price2))
  //       .to.emit(marketplaceContract, "Relisted")
  //       .withArgs(tokenId, price, price2);
  //   });
  // });
});
// });
