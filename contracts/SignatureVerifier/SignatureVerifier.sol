// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SignatureVerifier contract
 * @author BUK Technology Inc
 * @dev Contract to verify the signature
 */
contract SignatureVerifier {
    using Strings for uint256;

    /// @dev See {ISignatureVerifier-verify}.
    function verify(
        bytes32 _hash,
        bytes memory _signature
    ) external pure returns (address) {
        bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(_hash);
        return ECDSA.recover(ethSignedHash, _signature);
    }

    /// @dev See {ISignatureVerifier-generateAndVerify}.
    function generateAndVerify(
        uint256 _totalPenalty,
        uint256 _totalRefund,
        uint256 _totalCharges,
        bytes memory _signature
    ) external pure returns (address) {
        // Construct the message hash
        bytes memory message = 
            abi.encodePacked(
                "Cancellation Details:\nTotal Penalty: ",
                _totalPenalty.toString(),
                "\nTotal Refund: ",
                _totalRefund.toString(),
                "\nTotal Charges: ",
                _totalCharges.toString()
            );

        // Prefix the message hash (Ethereum Signed Message)
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(
            message
        );

        // Recover the signer's address
        return ECDSA.recover(ethSignedMessageHash, _signature);
    }
}
