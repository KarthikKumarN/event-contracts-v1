// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title IBukTreasury
 * @dev Interface for the BukTreasury contract.
 */
interface IBukTreasury {
    /**
     * @dev Emitted when new Stable token address has been updated
     * @param oldAddress, Address of the old address
     * @param newAddress, Address of the new address
     */
    event SetStableToken(
        address indexed oldAddress,
        address indexed newAddress
    );

    /**
     * @dev Emitted when new Buk Protocol address has been updated
     * @param oldAddress, Address of the old address
     * @param newAddress, Address of the new address
     */
    event BukProtocolSet(
        address indexed oldAddress,
        address indexed newAddress
    );

    /**
     * @dev Emitted when amount is withdrawn
     * @param account, Address of the amount sent
     * @param amount, Total amount withdrawn
     * @param token, Address of the token
     */
    event WithdrawnToken(
        address indexed account,
        uint256 indexed amount,
        address token
    );

    /**
     * @dev Emitted when the amount Refunds.
     * @param account, Address of the amount sent
     * @param amount, Total amount withdrawn
     * @param token, Address of the token
     */
    event Refund(
        address indexed account,
        uint256 indexed amount,
        address token
    );

    /**
     * Transfer stable tokens to the specified account.
     * @param _amount, Total funds to transfer
     * @param _account, Address of the account, funds transferred
     * @dev To transfer the amount in stable to the account.
     * @notice This function can only be called by Buk Protocol contract
     */
    function stableRefund(uint256 _amount, address _account) external;

    /**
     * Transfer other tokens
     * @param _amount, Total funds to transfer
     * @param _account, Address of the account, funds transferred
     * @dev To transfer the amount in specified currency to the account.
     * @notice This function can only be called by the Buk Protocol contract
     */
    function otherRefund(
        uint256 _amount,
        address _account,
        address _token
    ) external;

    /**
     * @dev Gets stable token address
     * @return address, Address of the stable token contract
     */
    function getStableToken() external view returns (address);
}
