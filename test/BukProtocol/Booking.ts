import { expect } from "chai";
import { ethers } from "hardhat";
import {
  keccak256,
  toUtf8Bytes,
  AbiCoder,
  toBeArray,
  ethers as eth,
  recoverAddress,
} from "ethers";

describe("BukEventProtocol Bookings", function () {
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
  let sellerWallet;
  let buyerWallet;
  let initialTime;
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
      100000000000,
    );

    //BukTreasury
    const BukTreasury = await ethers.getContractFactory("BukTreasury");
    bukTreasuryContract = await BukTreasury.deploy(
      stableTokenContract.getAddress(),
    );

    //Deploy SignatureVerifier contract
    const SignatureVerifier = await ethers.getContractFactory(
      "SignatureVerifier",
    );
    signatureVerifierContract = await SignatureVerifier.deploy();

    //Deploy BukRoyalties contract
    const BukRoyalties = await ethers.getContractFactory("BukRoyalties");
    royaltiesContract = await BukRoyalties.deploy();

    //BukEventProtocol
    const BukEventProtocol = await ethers.getContractFactory(
      "BukEventProtocol",
    );
    bukProtocolContract = await BukEventProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );

    // BukNFT
    const BukNFT = await ethers.getContractFactory("BukNFTs");
    nftContract = await BukNFT.deploy(
      "BUK_NFT",
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

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukProtocolContract.getAddress(),
    );

    //Set Buk Protocol in BukRoyalties
    const setBukEventProtocolRoyalties =
      await royaltiesContract.setBukEventProtocolContract(
        bukProtocolContract.getAddress(),
      );

    //Set Buk Royalty Info in BukRoyalties
    await royaltiesContract.setBukRoyaltyInfo(bukTreasuryContract, 200);
    //Set Hotel Royalty Info in BukRoyalties
    await royaltiesContract.setHotelRoyaltyInfo(bukTreasuryContract, 200);
    //Set First Owner Royalty Info in BukRoyalties
    await royaltiesContract.setFirstOwnerRoyaltyInfo(200);
    //Set Buk Treasury in BukNFTs
    await nftContract.setBukTreasury(await bukTreasuryContract.getAddress());
  });

  /**
   * This describe block contains tests for booking rooms in the Buk Protocol.
   * It includes multiple test cases to cover different scenarios related to the booking process.
   */
  describe("Book rooms in Buk Protocol", function () {
    it("Should succeed booking", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;
      const bookingDetails = await bukProtocolContract.getBookingDetails(1);
    });

    it("Should succeed booking and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      let total: number = 0;
      for (let i: number = 0; i < 1; ++i) {
        total += 100000000 + 80000000 * 0.05;
      }
      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      )
        .to.emit(bukProtocolContract, "BookRoom")
        .withArgs(
          1,
          "0x3633666663356135366139343361313561626261336134630000000000000000",
          1729847061,
          1729947061,
          2,
          0,
        );
    });
    it("Should succeed booking and get booking details", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
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
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1677830948,
            1729947061,
            12,
            true,
          ),
      ).to.be.revertedWith("Checkin date must be in the future");
    });
    it("Should fail booking when check-out date should be greater than check-in date", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729947061,
            1729847061,
            12,
            true,
          ),
      ).to.be.revertedWith("Checkout date must be after checkin");
    });
    it("Should fail booking when there isn't enough allowance from the sender", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).to.be.revertedWith("Check the allowance of the sender");
    });
    it("Should fail booking when there is array size mismatch", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).to.be.revertedWith("Array sizes mismatch");
    });

    it("Booking should fail when multiple bookings array crosses the limit", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [
              100000000, 100000000, 100000000, 100000000, 100000000, 100000000,
              100000000, 100000000, 100000000, 100000000, 100000000, 100000000,
            ],
            [
              80000000, 80000000, 80000000, 80000000, 80000000, 80000000,
              80000000, 80000000, 80000000, 80000000, 80000000, 80000000,
            ],
            [
              70000000, 70000000, 70000000, 70000000, 70000000, 70000000,
              70000000, 70000000, 70000000, 70000000, 70000000, 70000000,
            ],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).to.be.revertedWith("Exceeded max rooms per booking");
    });
  });

  /**
   * This describe block contains tests for booking rooms in the Buk Protocol.
   * It includes multiple test cases to cover different scenarios related to the booking process.
   */
  describe("Book rooms by admin in Buk Protocol", function () {
    it("Should succeed booking", async function () {
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;
      const bookingDetails = await bukProtocolContract.getBookingDetails(1);
    });

    it("Should succeed booking and emit events", async function () {
      //Grant allowance permission
      // const res = await stableTokenContract
      //   .connect(owner)
      //   .approve(await bukProtocolContract.getAddress(), 150000000);
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      let total: number = 0;
      for (let i: number = 0; i < 1; ++i) {
        total += 100000000 + 80000000 * 0.05;
      }
      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      )
        .to.emit(bukProtocolContract, "BookRoom")
        .withArgs(
          1,
          "0x3633666663356135366139343361313561626261336134630000000000000000",
          1729847061,
          1729947061,
          2,
          0,
        );
    });
    it("Should succeed booking and get booking details", async function () {
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      //Get booking details
      const bookingDetails = await bukProtocolContract.getBookingDetails(1);
      expect(bookingDetails[0]).to.equal(1);
    });
    it("Should fail booking when check-in date is less than current date", async function () {
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      await expect(
        bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1677830948,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).to.be.revertedWith("Checkin date must be in the future");
    });
    it("Should fail booking when check-out date should be greater than check-in date", async function () {
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;
      //Book room
      await expect(
        bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729947061,
            1729847061,
            12,
            true,
            account1.getAddress(),
          ),
      ).to.be.revertedWith("Checkout date must be after checkin");
    });
    it("Should fail booking when there is array size mismatch", async function () {
      //Set admin
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      await expect(
        bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).to.be.revertedWith("Array sizes mismatch");
    });

    it("Should fail booking when non admin called", async function () {
      //Book room
      await expect(
        bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).to.be.revertedWith("Only admin has access to this function");
    });
  });

  describe("Refund amount for failed booking in Buk Protocol", function () {
    it("Should refund the booking total to the user", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 300000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000, 100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .bookingRefund([1], owner.getAddress()),
      ).not.be.reverted;
    });
    it("Should refund the booking total to the user and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 300000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000, 100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .bookingRefund([1], owner.getAddress()),
      )
        .to.emit(bukProtocolContract, "BookingRefund")
        .withArgs(1, owner.getAddress());
    });
    it("Should not refund the booking when array is empty", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 300000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000, 100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Booking Refund
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .bookingRefund([], owner.getAddress()),
      ).to.be.revertedWith("Array is empty");
    });
    it("Should not refund the booking when the owner is not the booking owner", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 300000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000, 100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Booking Refund
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .bookingRefund([1], account1.getAddress()),
      ).to.be.revertedWith("Check the booking owner");
    });
    it("Should not refund the booking when the booking status is not booked", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 300000000);

      //Book room
      await expect(
        bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000, 100000000],
            [80000000, 80000000],
            [70000000, 70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Booking Refund
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .bookingRefund([2], owner.getAddress()),
      ).to.be.revertedWith("Check the Booking status");
    });
  });

  // describe("Minting Buk NFT in Buk Protocol", function () {
  //   it("Should mint successfully", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 150000000);

  //     //Book room
  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .bookRooms(
  //           [100000000],
  //           [80000000],
  //           [70000000],
  //           "0x3633666663356135366139343361313561626261336134630000000000000000",
  //           1729847061,
  //           1729947061,
  //           12,
  //           true,
  //         ),
  //     ).not.be.reverted;

  //     //Mint NFT
  //     await expect(
  //       bukProtocolContract
  //         .connect(owner)
  //         .mintBukNFT(
  //           [1],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     ).not.be.reverted;
  //   });
  //   it("Should mint successfully and emit event", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 150000000);

  //     //Book room
  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .bookRooms(
  //           [100000000],
  //           [80000000],
  //           [70000000],
  //           "0x3633666663356135366139343361313561626261336134630000000000000000",
  //           1729847061,
  //           1729947061,
  //           12,
  //           true,
  //         ),
  //     ).not.be.reverted;

  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .mintBukNFT(
  //           [1],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     )
  //       .to.emit(bukProtocolContract, "MintBookingNFT")
  //       .withArgs([1], true);
  //   });
  //   it("Should fail minting with array size mismatch", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 150000000);

  //     //Book room
  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .bookRooms(
  //           [100000000],
  //           [80000000],
  //           [70000000],
  //           "0x3633666663356135366139343361313561626261336134630000000000000000",
  //           1729847061,
  //           1729947061,
  //           12,
  //           true,
  //         ),
  //     ).not.be.reverted;

  //     //Mint NFT
  //     await expect(
  //       bukProtocolContract
  //         .connect(owner)
  //         .mintBukNFT(
  //           [1, 2],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     ).to.be.revertedWith("Check Ids and URIs size");
  //   });
  //   it("Should fail minting with array size limit", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 15000000000);

  //     //Book room
  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .bookRooms(
  //           [
  //             100000000, 100000000, 100000000, 100000000, 100000000, 100000000,
  //             100000000, 100000000, 100000000, 100000000, 100000000,
  //           ],
  //           [
  //             80000000, 80000000, 80000000, 80000000, 80000000, 80000000,
  //             80000000, 80000000, 80000000, 80000000, 80000000,
  //           ],
  //           [
  //             70000000, 70000000, 70000000, 70000000, 70000000, 70000000,
  //             70000000, 70000000, 70000000, 70000000, 70000000,
  //           ],
  //           "0x3633666663356135366139343361313561626261336134630000000000000000",
  //           1729847061,
  //           1729947061,
  //           12,
  //           true,
  //         ),
  //     ).not.be.reverted;

  //     //Mint NFT
  //     await expect(
  //       bukProtocolContract
  //         .connect(owner)
  //         .mintBukNFT(
  //           [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     ).to.be.revertedWith("Not in max - min booking limit");
  //   });
  //   it("Should fail minting with booking status", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 150000000);

  //     //Mint NFT
  //     await expect(
  //       bukProtocolContract
  //         .connect(owner)
  //         .mintBukNFT(
  //           [1],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     ).to.be.revertedWith("Check the Booking status");
  //   });
  //   it("Should fail minting when the sender is not the owner", async function () {
  //     //Grant allowance permission
  //     const res = await stableTokenContract
  //       .connect(owner)
  //       .approve(await bukProtocolContract.getAddress(), 150000000);

  //     //Book room
  //     expect(
  //       await bukProtocolContract
  //         .connect(owner)
  //         .bookRooms(
  //           [100000000],
  //           [80000000],
  //           [70000000],
  //           "0x3633666663356135366139343361313561626261336134630000000000000000",
  //           1729847061,
  //           1729947061,
  //           12,
  //           true,
  //         ),
  //     ).not.be.reverted;

  //     //Mint NFT
  //     await expect(
  //       bukProtocolContract
  //         .connect(account1)
  //         .mintBukNFT(
  //           [1],
  //           [
  //             "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
  //           ],
  //         ),
  //     ).to.be.revertedWith("Only booking owner can mint");
  //   });
  // });

  describe("Minting Buk NFT by Admin in Buk Protocol", function () {
    it("Should mint successfully", async function () {
      //Grant allowance permission
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(account2)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            account1.getAddress(),
          ),
      ).not.be.reverted;
    });
    it("Should mint successfully and emit event", async function () {
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      expect(
        await bukProtocolContract
          .connect(account2)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            account1.getAddress(),
          ),
      )
        .to.emit(bukProtocolContract, "MintBookingNFT")
        .withArgs([1], true);
    });
    it("Should fail minting with array size mismatch", async function () {
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(account2)
          .mintBukNFTOwner(
            [1, 2],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            account1.getAddress(),
          ),
      ).to.be.revertedWith("Check Ids and URIs size");
    });
    it("Should fail minting with array size limit 11", async function () {
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 250000000);

      //Grant allowance permission
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(account2)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin([]),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-in when the booking status is not confirmed", async function () {
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      await expect(
        bukProtocolContract.connect(owner).checkin([1]),
      ).to.be.revertedWith("Admin or NFT owner can access booking");
    });
    it("Should book by admin and minted user successfully", async function () {
      //Grant allowance permission
      expect(await bukProtocolContract.connect(adminWallet).setAdmin(account2))
        .not.be.reverted;

      //Book room
      expect(
        await bukProtocolContract
          .connect(account2)
          .bookRoomsOwner(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
            account1.getAddress(),
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(account2)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            account1.getAddress(),
          ),
      ).not.be.reverted;
    });
  });

  describe("Check-out for a booking in Buk Protocol", function () {
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
    /* The above code is using the Chai testing framework to define a "before" and "after" hook. */
    beforeEach(async function () {
      await saveInitialSnapshot();
    });
    afterEach(async function () {
      await restoreInitialSnapshot();
    });
    it("Should check-out successfully", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      await fastForwardTo(1730039516);

      //Check-out NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .checkout([1], [owner.getAddress()]),
      ).not.be.reverted;
    });
    it("Should check-out successfully and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      await fastForwardTo(1730039516);

      //Check-out NFT
      expect(
        await bukProtocolContract
          .connect(adminWallet)
          .checkout([1], [owner.getAddress()]),
      )
        .to.emit(bukProtocolContract, "CheckoutRooms")
        .withArgs([1], true);
    });
    it("Should not check-out with empty array", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      await fastForwardTo(1730039516);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([], []),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-out with array size limit", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [
              100000000, 100000000, 100000000, 100000000, 100000000, 100000000,
              100000000, 100000000, 100000000, 100000000, 100000000,
            ],
            [
              80000000, 80000000, 80000000, 80000000, 80000000, 80000000,
              80000000, 80000000, 80000000, 80000000, 80000000,
            ],
            [
              70000000, 70000000, 70000000, 70000000, 70000000, 70000000,
              70000000, 70000000, 70000000, 70000000, 70000000,
            ],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      await fastForwardTo(1729997061);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([], []),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-out if checkout date is less than current date", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      //Check-out NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .checkout([1], [owner.getAddress()]),
      ).to.be.revertedWith("Checkout date must be before today");
    });
    it("Should not check-out when the booking status is not checkedin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-out NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .checkout([1], [owner.getAddress()]),
      ).to.be.revertedWith("Check the Booking status");
    });
    it("Should not check-out when the booking status if not admin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-out NFT
      await expect(
        bukProtocolContract
          .connect(account1)
          .checkout([1], [owner.getAddress()]),
      ).to.be.reverted;
    });
    it("Should not check-out when the booking id and recipients length different", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout([1], []),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-out when the booking id and recipients address different", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;
      await fastForwardTo(1730039516);

      //Check-out NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .checkout([1], [account1.getAddress()]),
      ).to.be.revertedWith("Check NFT owner balance");
    });
  });

  // Cancellation
  describe("Cancel a booking in Buk Protocol", function () {
    it("Should cancel successfully before checkin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      const _id = [1];
      const _penalty = [0]; // Example values, use your actual logic
      const _refund = [18950000];
      const _charges = [0];
      const _bookingOwner = await owner.getAddress();

      // Formulate the message for signing
      const message = `Cancellation Details:\nTotal Penalty: ${_penalty[0]}\nTotal Refund: ${_refund[0]}\nTotal Charges: ${_charges[0]}`;
      const signature = await owner.signMessage(message);

      //Cancel Room
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .cancelRooms(
            _id,
            _penalty,
            _refund,
            _charges,
            _bookingOwner,
            signature,
          ),
      ).not.be.reverted;
    });
    it("Should cancel successfully after checkin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      const _id = [1];
      const _penalty = [50000000]; // Example values, use your actual logic
      const _refund = [30000000];
      const _charges = [20000000];
      const _bookingOwner = await owner.getAddress();

      // Formulate the message for signing
      const message = `Cancellation Details:\nTotal Penalty: ${_penalty[0]}\nTotal Refund: ${_refund[0]}\nTotal Charges: ${_charges[0]}`;
      const signature = await owner.signMessage(message);

      //Cancel Room
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .cancelRooms(
            _id,
            _penalty,
            _refund,
            _charges,
            _bookingOwner,
            signature,
          ),
      ).not.be.reverted;
    });
    it("Should cancel successfully and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      const _id = [1];
      const _penalty = [50000000]; // Example values, use your actual logic
      const _refund = [30000000];
      const _charges = [20000000];
      const _bookingOwner = await owner.getAddress();

      // Formulate the message for signing
      const message = `Cancellation Details:\nTotal Penalty: ${_penalty[0]}\nTotal Refund: ${_refund[0]}\nTotal Charges: ${_charges[0]}`;
      const signature = await owner.signMessage(message);

      //Cancel Room
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .cancelRooms(
            _id,
            _penalty,
            _refund,
            _charges,
            _bookingOwner,
            signature,
          ),
      )
        .to.emit(bukProtocolContract, "CancelRoom")
        .withArgs([1], 30000000, true);
    });

    it("Should not cancel when the booking status is not confirmed or checkedin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      const _id = [1];
      const _penalty = [50000000]; // Example values, use your actual logic
      const _refund = [30000000];
      const _charges = [20000000];
      const _bookingOwner = await owner.getAddress();

      // Formulate the message for signing
      const message = `Cancellation Details:\nTotal Penalty: ${_penalty[0]}\nTotal Refund: ${_refund[0]}\nTotal Charges: ${_charges[0]}`;
      const signature = await owner.signMessage(message);

      //Cancel Room
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .cancelRooms(
            _id,
            _penalty,
            _refund,
            _charges,
            _bookingOwner,
            signature,
          ),
      ).to.be.revertedWith("Not a confirmed or checkedin Booking");
    });
    it("Should not cancel when transfer amount exceeds total", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      const _id = [1];
      const _penalty = [50000000]; // Example values, use your actual logic
      const _refund = [50000000];
      const _charges = [20000000];
      const _bookingOwner = await owner.getAddress();

      // Formulate the message for signing
      const message = `Cancellation Details:\nTotal Penalty: ${_penalty[0]}\nTotal Refund: ${_refund[0]}\nTotal Charges: ${_charges[0]}`;
      const signature = await owner.signMessage(message);

      //Cancel Room
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .cancelRooms(
            _id,
            _penalty,
            _refund,
            _charges,
            _bookingOwner,
            signature,
          ),
      ).to.be.revertedWith("Transfer amount exceeds total");
    });
  });

  describe("Emergency Cancellations in Buk Protocol", function () {
    it("Should cancel successfully before checkin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      const _id = 1;
      const _refund = 30000000;
      const _charges = 20000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      ).not.be.reverted;
    });
    it("Should cancel successfully after checkin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      const _id = 1;
      const _refund = 30000000;
      const _charges = 20000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      ).not.be.reverted;
    });
    it("Should cancel successfully and emit events", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(bukProtocolContract.connect(owner).checkin([1])).not.be
        .reverted;

      const _id = 1;
      const _refund = 30000000;
      const _charges = 20000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      )
        .to.emit(bukProtocolContract, "EmergencyCancellation")
        .withArgs(1, true);
    });
    it("Should cancel successfully and check the BukNFTs status", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      //Check the balance of NFT
      expect(await nftContract.balanceOf(owner.getAddress(), 1)).to.equal(1);

      const _id = 1;
      const _refund = 30000000;
      const _charges = 20000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      ).not.be.reverted;

      //Check the balance of NFT
      expect(await nftContract.balanceOf(owner.getAddress(), 1)).to.equal(0);
    });
    it("Should not cancel when the booking status is not confirmed or checkedin", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      const _id = 1;
      const _refund = 30000000;
      const _charges = 20000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      ).to.be.revertedWith("Not a confirmed or checkedin Booking");
    });
    it("Should not cancel when transfer amount exceeds total", async function () {
      //Grant allowance permission
      const res = await stableTokenContract
        .connect(owner)
        .approve(await bukProtocolContract.getAddress(), 150000000);

      //Book room
      expect(
        await bukProtocolContract
          .connect(owner)
          .bookRooms(
            [100000000],
            [80000000],
            [70000000],
            "0x3633666663356135366139343361313561626261336134630000000000000000",
            1729847061,
            1729947061,
            12,
            true,
          ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .mintBukNFTOwner(
            [1],
            [
              "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            ],
            owner.getAddress(),
          ),
      ).not.be.reverted;

      const _id = 1;
      const _refund = 80000000;
      const _charges = 30000000;
      const _bookingOwner = await owner.getAddress();

      //Emergency Cancellation
      await expect(
        bukProtocolContract
          .connect(adminWallet)
          .emergencyCancellation(_id, _refund, _charges, _bookingOwner),
      ).to.be.revertedWith("Transfer amount exceeds total");
    });
  });
});
