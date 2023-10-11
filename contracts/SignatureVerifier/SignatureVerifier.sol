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

    function generateAndVerify(
        uint256 _totalPenalty,
        uint256 _totalRefund,
        uint256 _totalCharges,
        bytes memory _signature
    ) external pure returns (address) {
        // Construct the message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "Cancellation Details:\nTotal Penalty: ",
                _uintToString(_totalPenalty),
                "\nTotal Refund: ",
                _uintToString(_totalRefund),
                "\nTotal Charges: ",
                _uintToString(_totalCharges)
            )
        );

        // Prefix the message hash (Ethereum Signed Message)
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(
            messageHash
        );

        // Recover the signer's address
        return ECDSA.recover(ethSignedMessageHash, _signature);
    }

    function _uintToString(uint256 _numVal) internal pure returns (string memory) {
        if (_numVal == 0) return "0";
        uint256 maxlength = 100;
        bytes memory reversed = new bytes(maxlength);
        uint256 i = 0;
        while (_numVal != 0) {
            uint256 remainder = _numVal % 10;
            _numVal = _numVal / 10;
            reversed[i++] = bytes1(uint8(48 + remainder));
        }
        bytes memory s = new bytes(i);
        for (uint256 j = 0; j < i; j++) {
            s[j] = reversed[i - 1 - j];
        }
        return string(s);
    }
}
