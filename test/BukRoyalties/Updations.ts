import { expect } from "chai";
import { ethers } from "hardhat";

//  FIXME : Update this test cases to event test cases. This is old test cases
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
  let bukEventProtocolContract;
  let signatureVerifierContract;
  let royaltiesContract;
  let owner;
  let account1;
  let account2;
  let adminWallet;
  let bukWallet;
  let bukTreasuryContract;
  let sellerWallet;
  let buyerWallet;
  let eventDetails;
  let eventAddress;
  let eventNFTContract;

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
    const SignatureVerifier =
      await ethers.getContractFactory("SignatureVerifier");
    signatureVerifierContract = await SignatureVerifier.deploy();

    //Deploy BukRoyalties contract
    const BukRoyalties = await ethers.getContractFactory("BukRoyalties");
    royaltiesContract = await BukRoyalties.deploy();

    //BukEventProtocol
    const BukEventProtocol =
      await ethers.getContractFactory("BukEventProtocol");
    bukEventProtocolContract = await BukEventProtocol.deploy(
      bukTreasuryContract.getAddress(),
      stableTokenContract.getAddress(),
      bukWallet.getAddress(),
      signatureVerifierContract.getAddress(),
      royaltiesContract.getAddress(),
    );

    //Set Buk Protocol in Treasury
    const setBukEventProtocol = await bukTreasuryContract.setBukEventProtocol(
      bukEventProtocolContract.getAddress(),
    );

    //Set Buk Protocol in BukRoyalties
    const setBukEventProtocolRoyalties =
      await royaltiesContract.setBukEventProtocolContract(
        bukEventProtocolContract.getAddress(),
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
        .bukEventProtocolContract();
      expect(addr).to.equal(await account1.getAddress());
    });
    it("Should set buk protocol and emit events", async function () {
      //Set buk protocol
      let currentBukEventContract =
        await royaltiesContract.bukEventProtocolContract();
      expect(
        await royaltiesContract
          .connect(adminWallet)
          .setBukEventProtocolContract(account1),
      )
        .to.emit(royaltiesContract, "SetBukEventProtocol")
        .withArgs(currentBukEventContract, await account1.getAddress());
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
        .to.emit(royaltiesContract, "SetBukRoyalty")
        .withArgs(0, 200);
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
        .to.emit(royaltiesContract, "SetHotelRoyalty")
        .withArgs(0, 200);
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
        .to.emit(royaltiesContract, "SetFirstOwnerRoyalty")
        .withArgs(0, 200);
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
});
