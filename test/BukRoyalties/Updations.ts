import { expect } from "chai";
import { ethers } from "hardhat";
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
describe("BukRoyalties Updations", function () {
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

    //Set BukNFTs address in BukPOSNFTs
    await nftPosContract.setBukNFTRole(nftContract.getAddress());

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
    const setBukPOSNFTs = await bukProtocolContract.setBukPOSNFTs(
      nftPosContract.getAddress(),
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

    await saveInitialSnapshot();
  });
  afterEach(async function () {
    await restoreInitialSnapshot();
  });

  describe("Set Buk Protocol in BukRoyalties", function () {
    it("Should set buk protocol by admin", async function () {
      //Set buk protocol
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukEventProtocolContract(account1),
      ).not.be.reverted;
      const addr = await royaltiesContract
        .connect(adminWallet)
        .bukProtocolContract();
      expect(addr).to.equal(await account1.getAddress());
    });
    it("Should set buk protocol and emit events", async function () {
      //Set buk protocol
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukEventProtocolContract(account1),
      )
        .to.emit(royaltiesContract, "SetBukTreasury")
        .withArgs(await account1.getAddress());
    });
    it("Should not set buk protocol if not admin", async function () {
      //Set buk protocol
      await expect(
        royaltiesContract
          .connect(account2)
          .setBukEventProtocolContract(account1),
      ).to.be.reverted;
    });
  });

  describe("Set Buk Royalty in BukRoyalties", function () {
    it("Should set Buk Royalty by admin", async function () {
      //Set Buk Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukRoyaltyInfo(bukTreasuryContract, 200),
      ).not.be.reverted;
      const bukRoyaltyRes = (await royaltiesContract.bukRoyalty())[1];
      expect(200).to.equal(bukRoyaltyRes);
    });
    it("Should set Buk Royalty and emit events", async function () {
      //Set Buk Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukRoyaltyInfo(bukTreasuryContract, 200),
      )
        .to.emit(royaltiesContract, "SetStableToken")
        .withArgs(await account1.getAddress());
    });
    it("Should not set Buk Royalty if not admin", async function () {
      //Set Buk Royalty
      await expect(
        royaltiesContract
          .connect(account1)
          .setBukRoyaltyInfo(bukTreasuryContract, 200),
      ).to.be.reverted;
    });
    it("Should not set Buk Royalty if royalty fee is more than 10000", async function () {
      //Set Buk Royalty
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setBukRoyaltyInfo(bukTreasuryContract, 20000),
      ).to.be.revertedWith("Royalty is more than 10000");
    });
  });

  describe("Set Hotel Royalty in BukRoyalties", function () {
    it("Should set Hotel Royalty by admin", async function () {
      //Set Hotel Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setHotelRoyaltyInfo(bukTreasuryContract, 200),
      ).not.be.reverted;
      const hotelRoyaltyRes = (await royaltiesContract.hotelRoyalty())[1];
      expect(200).to.equal(hotelRoyaltyRes);
    });
    it("Should set Hotel Royalty and emit events", async function () {
      //Set Hotel Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setHotelRoyaltyInfo(bukTreasuryContract, 200),
      )
        .to.emit(royaltiesContract, "SetStableToken")
        .withArgs(await account1.getAddress());
    });
    it("Should not set Hotel Royalty if not admin", async function () {
      //Set Hotel Royalty
      await expect(
        royaltiesContract
          .connect(account1)
          .setHotelRoyaltyInfo(bukTreasuryContract, 200),
      ).to.be.reverted;
    });
    it("Should not set Hotel Royalty if royalty fee is more than 10000", async function () {
      //Set Hotel Royalty
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setHotelRoyaltyInfo(bukTreasuryContract, 20000),
      ).to.be.revertedWith("Royalty is more than 10000");
    });
  });

  describe("Set First Owner Royalty in BukRoyalties", function () {
    it("Should set First Owner Royalty by admin", async function () {
      //Set First Owner Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setFirstOwnerRoyaltyInfo(200),
      ).not.be.reverted;
      expect(200).to.equal(await royaltiesContract.firstOwnerFraction());
    });
    it("Should set First Owner Royalty and emit events", async function () {
      //Set First Owner Royalty
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setFirstOwnerRoyaltyInfo(200),
      )
        .to.emit(royaltiesContract, "SetStableToken")
        .withArgs(await account1.getAddress());
    });
    it("Should not set First Owner Royalty if not admin", async function () {
      //Set First Owner Royalty
      await expect(
        royaltiesContract.connect(account1).setFirstOwnerRoyaltyInfo(200),
      ).to.be.reverted;
    });
    it("Should not set First Owner Royalty if royalty fee is more than 10000", async function () {
      //Set First Owner Royalty
      await expect(
        royaltiesContract.connect(adminWallet).setFirstOwnerRoyaltyInfo(20000),
      ).to.be.revertedWith("Royalty is more than 10000");
    });
  });

  describe("Set other Royalties in BukRoyalties", function () {
    it("Should set other Royalty by admin", async function () {
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
        bukProtocolContract.mintBukNFTOwner(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
          owner.address,
        ),
      ).not.be.reverted;

      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).not.be.reverted;
      const royaltyInfo = await royaltiesContract.getRoyaltyInfo(1);
      const royaltyInfo2 = await bukProtocolContract.getRoyaltyInfo(1);
      const royalties: number[] = [];
      for (let i = 3; i < royaltyInfo.length; i++) {
        expect(royaltyFractions[i - 3]).to.equal(royaltyInfo[i][1]);
      }
    });
    it("Should set other Royalty and emit events", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      )
        .to.emit(royaltiesContract, "SetOtherRoyalties")
        .withArgs([], [2000, 3000]);
    });
    it("Should set and replace the existing other royalties by admin", async function () {
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
        bukProtocolContract.mintBukNFTOwner(
          [1],
          [
            "https://ipfs.io/ipfs/bafyreigi54yu7sosbn4b5kipwexktuh3wpescgc5niaejiftnuyflbe5z4/metadata.json",
          ],
          owner.address,
        ),
      ).not.be.reverted;

      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).not.be.reverted;
      const royaltyInfo = await royaltiesContract.getRoyaltyInfo(1);
      for (let i = 3; i < royaltyInfo.length; i++) {
        expect(royaltyFractions[i - 3]).to.equal(royaltyInfo[i][1]);
      }

      //Setting new royalties and check the update
      const newRoyaltyFractions = [4000, 1000];
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, newRoyaltyFractions),
      ).not.be.reverted;
      const newRoyaltyInfo = await royaltiesContract.getRoyaltyInfo(1);
      for (let i = 3; i < newRoyaltyInfo.length; i++) {
        expect(newRoyaltyFractions[i - 3]).to.equal(newRoyaltyInfo[i][1]);
      }
    });
    it("Should not set other Royalty if not admin", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000, 3000];
      await expect(
        royaltiesContract
          .connect(account1)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.reverted;
    });
    it("Should not set other Royalty if array size mismatch is there", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [2000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Arrays must have the same length");
    });
    it("Should not set other Royalty if total royalty fee is more than 10000", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [20000, 1000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Royalty is more than 10000");
    });
    it("Should not set other Royalty if royalty fee is more than 10000", async function () {
      //Set Other Royalty
      const recipients = [
        await account1.getAddress(),
        await account2.getAddress(),
      ];
      const royaltyFractions = [8000, 8000];
      await expect(
        royaltiesContract
          .connect(adminWallet)
          .setOtherRoyaltyInfo(recipients, royaltyFractions),
      ).to.be.revertedWith("Total cannot be more than 10000");
    });
  });
});
