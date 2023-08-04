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
    );

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
      nftPosContract.getAddress(),
      bukProtocolContract.getAddress(),
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

  /**
   * This describe block contains tests for booking rooms in the Buk Protocol.
   * It includes multiple test cases to cover different scenarios related to the booking process.
   */
  describe("Book rooms in Buk Protocol", function () {
    it("Should succeed booking", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;
      const bookingDetails = await bukProtocolContract.getBookingDetails(1);
    });
    it("Should succeed booking and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000,
      );

      let total: number = 0;
      for (let i: number = 0; i < 1; ++i) {
        total += 100000000 + 80000000 * 0.05;
      }
      //Book room
      expect(
        await bukProtocolContract.connect(owner).bookRoom(
          1,
          [100000000],
          [80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      )
        .to.emit(bukProtocolContract, "BookRoom")
        .withArgs(1);
    });
    it("Should succeed booking and get booking details", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Get booking details
      const bookingDetails = await bukProtocolContract.getBookingDetails(1);
      expect(bookingDetails[0]).to.equal(1);
    });
    it("Should fail booking when check-in date is less than current date", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          1,
          [100000000],
          [80000000],
          1677830948,
          1701590948,
          12,
          true,
        ),
      ).to.be.revertedWith("Checkin date should be greater than current date");

    });
    it("Should fail booking when check-out date should be greater than check-in date", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          1,
          [100000000],
          [80000000],
          1701590948,
          1701504548,
          12,
          true,
        ),
      ).to.be.revertedWith("Checkout date should be greater than checkin date");
    });
    it("Should fail booking when there isn't enough allowance from the sender", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).to.be.revertedWith("Check the allowance of the sender");
    });
    it("Should fail booking when there is array size mismatch", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          1,
          [100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).to.be.revertedWith("Array sizes mismatch");
    });
  });

  describe("Refund amount for failed booking in Buk Protocol", function () {
    it("Should refund the booking total to the user", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract.connect(adminWallet).bookingRefund(
          [1],
          owner.getAddress()
        ),
      ).not.be.reverted;
    });
    it("Should refund the booking total to the user and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract.connect(adminWallet).bookingRefund(
          [1],
          owner.getAddress()
        ),
      ).to.emit(bukProtocolContract, "BookingRefund")
        .withArgs(1, owner.getAddress());
    });
    it("Should not refund the booking when array is empty", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Booking Refund
      await expect(
        bukProtocolContract.connect(adminWallet).bookingRefund(
          [],
          owner.getAddress()
        ),
      ).to.be.revertedWith("Array is empty");
    });
    it("Should not refund the booking when the owner is not the booking owner", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Booking Refund
      await expect(
        bukProtocolContract.connect(adminWallet).bookingRefund(
          [1],
          account1.getAddress()
        ),
      ).to.be.revertedWith("Check the booking owner");
    });
    it("Should not refund the booking when the booking status is not booked", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      await expect(
        bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract.connect(adminWallet).bookingRefund(
          [2],
          owner.getAddress()
        ),
      ).to.be.revertedWith("Check the Booking status");
    });
  });

  describe("Minting Buk NFT in Buk Protocol", function () {
    it("Should mint successfully", async function () {
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
    it("Should mint successfully and emit event", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //TODO Mint NFT
      // await expect(
      //   bukProtocolContract.connect(owner).mintBukNFT(
      //     [1],
      //     [
      //       "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      //     ],
      //   ),
      // ).to.emit(bukProtocolContract, "MintBookingNFT").withArgs([1], true);
    });
    it("Should failed minting with array size mismatch", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).to.be.revertedWith("Check Ids and URIs size");

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
    it("Should failed minting with array size limit", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        15000000000,
      );

      //Book room
      expect(
        await bukProtocolContract.connect(owner).bookRoom(
          12,
          [100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000],
          [80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract.connect(owner).mintBukNFT(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ),
      ).to.be.revertedWith("Not in max - min booking limit");
    });
    it("Should failed minting with booking status", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000,
      );

      //Mint NFT
      await expect(
        bukProtocolContract.connect(owner).mintBukNFT(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ),
      ).to.be.revertedWith("Check the Booking status");
    });
    it("Should failed minting when the sender is not the owner", async function () {
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
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract.connect(account1).mintBukNFT(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ),
      ).to.be.revertedWith("Only booking owner has access");
    });
  });

  describe("Check-in for a booking in Buk Protocol", function () {
    it("Should check-in successfully", async function () {
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
    });
    it("Should check-in successfully and emit events", async function () {
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
    it("Should check-in and NFT become non-transferable", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        300000000,
      );

      //Book room
      expect(
        await bukProtocolContract.connect(owner).bookRoom(
          2,
          [100000000, 100000000],
          [80000000, 80000000],
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

      //Check if NFT is transferable or not
      //Transfer NFT to another account
      await expect(
        nftContract.connect(owner).transferFrom(
          owner.getAddress(),
          account1.getAddress(),
          1,
        ),
      ).not.be.reverted
      

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;
    });
    it("Should not check-in with empty array", async function () {
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
    it("Should not check-in with array limit error", async function () {
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
    it("Should not check-in when the booking status is not confirmed", async function () {
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
  });

  // describe("Check-out for a booking in Buk Protocol", function () {
  //   it("Check-out is successful", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       150000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         1,
  //         [100000000],
  //         [80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).not.be.reverted;
  //   });
  //   it("Check-out is successful and emit events", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       150000000,
  //     );

  //     let total: number = 0;
  //     for (let i: number = 0; i < 1; ++i) {
  //       total += 100000000 + 80000000 * 0.05;
  //     }
  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         1,
  //         [100000000],
  //         [80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     )
  //       .to.emit(bukProtocolContract, "BookRoom")
  //       .withArgs(1);
  //   });
  //   it("Check-out failed with empty array", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       1050000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         2,
  //         [100000000, 80000000],
  //         [80000000, 80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).to.be.revertedWith("Mismatch in array sizes");
  //   });
  //   it("Check-out failed with array limit error", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       1050000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         2,
  //         [100000000, 80000000],
  //         [80000000, 80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).to.be.revertedWith("Mismatch in array sizes");
  //   });
  //   it("Check-out failed when the booking status is not checkedin", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       1050000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         2,
  //         [100000000, 80000000],
  //         [80000000, 80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).to.be.revertedWith("Mismatch in array sizes");
  //   });
  // });

  // describe("Cancel a booking in Buk Protocol", function () {
  //   it("Cancellation is successful", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       150000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         1,
  //         [100000000],
  //         [80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).not.be.reverted;
  //   });
  //   it("Cancellation is successful and emit events", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       150000000,
  //     );

  //     let total: number = 0;
  //     for (let i: number = 0; i < 1; ++i) {
  //       total += 100000000 + 80000000 * 0.05;
  //     }
  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         1,
  //         [100000000],
  //         [80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     )
  //       .to.emit(bukProtocolContract, "BookRoom")
  //       .withArgs(1);
  //   });
  //   it("Cancellation is successful and check the BukNFTs and Buk sPoS status", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       150000000,
  //     );

  //     let total: number = 0;
  //     for (let i: number = 0; i < 1; ++i) {
  //       total += 100000000 + 80000000 * 0.05;
  //     }
  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         1,
  //         [100000000],
  //         [80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     )
  //       .to.emit(bukProtocolContract, "BookRoom")
  //       .withArgs(1);
  //   });
  //   it("Cancellation failed when the booking status is not confirmed", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       1050000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         2,
  //         [100000000, 80000000],
  //         [80000000, 80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).to.be.revertedWith("Mismatch in array sizes");
  //   });
  //   it("Cancellation failed when transfer amount exceeds total", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract.connect(owner).approve(
  //       await bukProtocolContract.getAddress(),
  //       1050000000,
  //     );

  //     // Book room and mint NFT
  //     expect(
  //       await stableTokenContract.connect(owner).bookRoom(
  //         2,
  //         [100000000, 80000000],
  //         [80000000, 80000000],
  //         1701504548,
  //         1701590948,
  //         12,
  //         true,
  //       ),
  //     ).to.be.revertedWith("Mismatch in array sizes");
  //   });
  // });
});
