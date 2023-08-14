// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ISignatureVerifier {
  function verify(bytes32 hash, bytes memory signature) external view returns (address); 
}