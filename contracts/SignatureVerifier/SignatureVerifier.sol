// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract SignatureVerifier {

  function verify(
    bytes32 hash,
    bytes memory signature
  ) external pure returns (address) {

    bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(hash); 
    return ECDSA.recover(ethSignedHash, signature);
  }

}