import { expect } from "chai";
import { ethers } from "hardhat";

describe("BukProtocol Bookings", function () {
  let stableTokenContract;
  let bukProtocolContract;
  let marketplaceContract;
  let signatureVerifierContract;
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
    const SignatureVerifier = await ethers.getContractFactory("SignatureVerifier");
    signatureVerifierContract = await SignatureVerifier.deploy();

    //BukProtocol
    const BukProtocol = await ethers.getContractFactory("BukProtocol");
    bukProtocolContract = await BukProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
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

    //Set BukNFTs address in BukPoSNFTs
    await nftPosContract.setBukNFTRole(nftContract.getAddress())

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
          [70000000],
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
          [70000000],
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
          [70000000],
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
          [70000000],
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
          [70000000],
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
          [70000000],
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
          [70000000, 70000000],
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
          [70000000, 70000000],
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
          [70000000, 70000000],
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
          [70000000, 70000000],
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
          [70000000, 70000000],
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
          [70000000, 70000000],
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
          [70000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      expect((await
        bukProtocolContract.connect(owner).mintBukNFT(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ))
      ).to.emit(bukProtocolContract, "MintBookingNFT").withArgs([1], true);
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
          [70000000],
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
          [70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000],
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
          [70000000],
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
    it("Should check-in successfully by admin", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkin(
          [1]
        ),
      ).not.be.reverted;
    });
    it("Should check-in successfully by owner", async function () {
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
          [70000000, 70000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      //Mint NFT
      await expect(
        bukProtocolContract.connect(owner).mintBukNFT(
          [1, 2],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
        ),
      ).not.be.reverted;

      let tokenId = 1;
      let salePrice = 110000000;
      let transferMoney = 210000000;

      await expect(marketplaceContract.connect(owner).createListing(tokenId, salePrice)).not.to
        .be.reverted;

      //Grant permission to the marketplace
      await expect(
        nftContract.connect(owner).setApprovalForAll(
          await marketplaceContract.getAddress(),
          true,
        ),
      ).not.to.be.reverted;

      //Set Marketplace role in BukNFTs
      expect(await nftContract.connect(adminWallet).setMarketplaceRole(marketplaceContract.getAddress()))
        .not.be.reverted;

      //Transfer tokens to buyer
      await stableTokenContract.connect(owner).transfer(
        await account1.getAddress(),
        transferMoney,
      );

      //Approve tokens to marketplace by buyer
      await stableTokenContract
        .connect(account1)
        .approve(await marketplaceContract.getAddress(), transferMoney);

      //Buy NFT
      await expect(marketplaceContract.connect(account1).buyRoom(tokenId)).not
        .to.be.reverted;

      //Check NFT balance
      await expect(
        await nftContract.balanceOf(await account1.getAddress(), tokenId),
      ).to.equal(1);


      //Check-in NFT by new owner
      await expect(
        bukProtocolContract.connect(account1).checkin(
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          []
        ),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-in with array limit error", async function () {
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
          [70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      const uris = [
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
        "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
      ]

      //Mint NFT
      await expect(
        bukProtocolContract.connect(owner).mintBukNFT(
          [1, 2, 3, 4, 5, 6],
          uris,
        ),
      ).not.be.reverted;
      await expect(
        bukProtocolContract.connect(owner).mintBukNFT(
          [7, 8, 9, 10, 11, 12],
          uris,
        ),
      ).not.be.reverted;

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        ),
      ).to.be.revertedWith("Not in max-min booking limit");
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
          [70000000],
          1701504548,
          1701590948,
          12,
          true,
        ),
      ).not.be.reverted;

      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).to.be.revertedWith("Only admin or owner of the NFT can access the booking");
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).not.be.reverted;

    });
    it("Should check-out successfully and emit events", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      await fastForwardTo(1701590949);

      //Check-out NFT
      expect(await
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        )
      ).to.emit(bukProtocolContract, "CheckoutRooms")
        .withArgs([1], true);
    });
    it("Should not check-out with empty array", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          []
        ),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-out with array size limit", async function () {
      //Grant allowance permission
      const res = await stableTokenContract.connect(owner).approve(
        await bukProtocolContract.getAddress(),
        150000000000,
      );

      //Book room
      expect(
        await bukProtocolContract.connect(owner).bookRoom(
          12,
          [100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000, 100000000],
          [80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000, 80000000],
          [70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000, 70000000],
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

      await fastForwardTo(1701590949);

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          []
        ),
      ).to.be.revertedWith("Not in max-min booking limit");
    });
    it("Should not check-out if checkout date is less than current date", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).to.be.revertedWith("Checkout date should be less than current date");

    });
    it("Should not check-out when the booking status is not checkedin", async function () {
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

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(adminWallet).checkout(
          [1]
        ),
      ).to.be.revertedWith("Check the Booking status");
    });
    it("Should not check-out when the booking status if not admin", async function () {
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

      //Check-out NFT
      await expect(
        bukProtocolContract.connect(account1).checkout(
          [1]
        ),
      ).to.be.reverted;
    });
  });

  describe("Cancel a booking in Buk Protocol", function () {
    it("Should cancel successfully before checkin", async function () {
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


      //Get the private key of the owner from hardhat
      




  // Create message to sign
  const message = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "uint256", "uint256"], 
    [1, 50000000, 30000000, 20000000]
  );

  // Sign message
  const signer = new ethers.Wallet(privateKey);
  const signature = await signer.signMessage(ethers.utils.arrayify(message));

  // Call contract
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const tx = await contract.cancelRoom(bookingId, penalty, refund, charges, signature);
  await tx.wait();


      //Cancel Room
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          30000000,
          20000000
        ),
      ).not.be.reverted;
    });
    it("Should cancel successfully after checkin", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      //Cancel Room
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          30000000,
          20000000
        ),
      ).not.be.reverted;
    });
    it("Should cancel successfully and emit events", async function () {
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

      //Check-in NFT
      await expect(
        bukProtocolContract.connect(owner).checkin(
          [1]
        ),
      ).not.be.reverted;

      //Cancel Booking
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          30000000,
          20000000
        ),
      )
        .to.emit(bukProtocolContract, "CancelRoom")
        .withArgs(1, true);
    });
    it("Should cancel successfully and check the BukNFTs and Buk PoS status", async function () {
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

      //Check the balance of NFT
      expect(await nftContract.balanceOf(owner.getAddress(), 1)).to.equal(1);
      //Check the balance of PoS NFT
      expect(await nftPosContract.balanceOf(owner.getAddress(), 1)).to.equal(0);

      //Cancel Room 
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          30000000,
          20000000
        ),
      ).not.be.reverted;

      //Check the balance of NFT
      expect(await nftContract.balanceOf(owner.getAddress(), 1)).to.equal(0);
      //Check the balance of PoS NFT
      expect(await nftPosContract.balanceOf(owner.getAddress(), 1)).to.equal(0);

    });
    it("Should not cancel when the booking status is not confirmed or checkedin", async function () {
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

      //Cancel Room 
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          30000000,
          20000000
        ),
      ).to.be.revertedWith("Not a confirmed or checkedin Booking");
    });
    it("Should not cancel when transfer amount exceeds total", async function () {
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

      //Cancel Room 
      await expect(
        bukProtocolContract.connect(adminWallet).cancelRoom(
          1,
          50000000,
          50000000,
          20000000
        ),
      ).to.be.revertedWith("Transfer amount exceeds total");
    });
  });
});
