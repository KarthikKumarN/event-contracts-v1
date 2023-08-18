// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SignatureVerifier contract
 * @author BUK Technology Inc
 * @dev Contract to verify the signature
 */
contract SignatureVerifier {
    /**
     * @dev See {ISignatureVerifier-verify}.
     */
    function verify(
        bytes32 _hash,
        bytes memory _signature
    ) external pure returns (address) {
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(_hash);
        return ECDSA.recover(ethSignedHash, _signature);
    }
}
