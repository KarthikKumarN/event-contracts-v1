// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title IBukTreasury
 * @dev Interface for the BukTreasury contract.
 */
interface IBukTreasury {
    /// @dev Emitted when the stable token address is set.
    event SetStableToken(address indexed oldToken, address indexed newToken);

    /// @dev Emitted when the Buk Protocol address is set.
    event BukProtocolSet(
        address indexed oldBukProtocol,
        address indexed newBukProtocol
    );

    /// @dev Emitted when the amount withdrawn.
    event WithdrawnToken(
        address indexed _account,
        uint256 indexed _amout,
        address _token
    );

    /// @dev Emitted when the amount Refunds.
    event Refund(
        address indexed _account,
        uint256 indexed _amount,
        address _token
    );

    /**
     * Transfer stable tokens to the specified account.
     * @param _amount - Total funds to transfer
     * @param _account -A ddress of the account to which funds will be transferred
     * @dev - To transfer the cancellation charges in USDC to the specified account.
     * @notice This function can only be called by Buk Protocol contract
     */
    function stableRefund(uint256 _amount, address _account) external;

    /**
     * Transfer other tokens
     * @param _amount - Total funds to transfer
     * @param _account - Address of the account to which funds will be transferred
     * @dev To transfer the cancellation charges in specified currency to the specified account.
     * @notice This function can only be called by the Buk Protocol contract
     */
    function otherRefund(
        uint256 _amount,
        address _account,
        address _token
    ) external;
}
