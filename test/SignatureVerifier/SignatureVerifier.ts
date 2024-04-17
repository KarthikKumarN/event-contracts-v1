import { expect } from "chai";
import { ethers } from "hardhat";
import { keccak256, toUtf8Bytes, toBeArray } from "ethers";

describe("SignatureVerifier", function () {
  let SignatureVerifier;
  let verifier;
  let owner;
  let signer;

  beforeEach(async function () {
    SignatureVerifier = await ethers.getContractFactory("SignatureVerifier");
    verifier = await SignatureVerifier.deploy();
    [owner, signer] = await ethers.getSigners();
  });

  it("should verify the signature correctly", async function () {
    const totalPenalty = 100;
    const totalRefund = 50;
    const totalCharges = 25;

    // Construct the message
    const message = `Cancellation Details:\nTotal Penalty: ${totalPenalty}\nTotal Refund: ${totalRefund}\nTotal Charges: ${totalCharges}`;

    // Sign the message
    const signature = await signer.signMessage(message);

    // Call the generateAndVerify function
    const recoveredAddress = await verifier.generateAndVerify(
      totalPenalty,
      totalRefund,
      totalCharges,
      signature,
    );

    // Check if the recovered address matches the signer's address
    expect(recoveredAddress).to.equal(signer.address);
  });

  it("should verify the signature using the verify function", async function () {
    // Construct a message
    const message = "This is a test message for verification.";
    const messageHash = keccak256(toUtf8Bytes(message));

    // Create a new buffer object from the sliced version of the messageHash string
    // The first two characters are removed before converting to byte representation
    const byteArray = Buffer.from(messageHash.slice(2), "hex");

    // Sign the message
    const signature = await signer.signMessage(byteArray);

    // Call the verify function
    const recoveredAddress = await verifier.verify(messageHash, signature);

    // Check if the recovered address matches the signer's address
    expect(recoveredAddress).to.equal(signer.address);
  });
});
