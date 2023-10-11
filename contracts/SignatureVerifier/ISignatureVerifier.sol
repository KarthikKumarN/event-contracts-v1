// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Interface to define the signature verifier contract
 * @author BUK Technology Inc
 * @notice Collection of all functions related to the signature verifier.
 */
interface ISignatureVerifier {
    /**
     * @dev Function verify
     * Verifies the signature of a hashed message using ECDSA.
     * @param _hash The original message hash that was signed.
     * @param _signature The signature of the message.
     * @return The address of the signer who generated the given signature.
     */
    function verify(
        bytes32 _hash,
        bytes memory _signature
    ) external view returns (address);

    /**
     * @dev Function generateAndVerify
     * Generates a hash from the given parameters and verifies the signature of the hash using ECDSA.
     * @param _totalPenalty The total penalty amount.
     * @param _totalRefund The total refund amount.
     * @param _totalCharges The total charges amount.
     * @param _signature The signature of the message.
     * @return The address of the signer who generated the given signature.
     */
    function generateAndVerify(
        uint256 _totalPenalty,
        uint256 _totalRefund,
        uint256 _totalCharges,
        bytes memory _signature
    ) external view returns (address);
}