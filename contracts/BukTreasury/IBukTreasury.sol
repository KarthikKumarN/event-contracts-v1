// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title IBukTreasury
 * @dev Interface for the BukTreasury contract.
 */
interface IBukTreasury {
    /**
     * @dev Cancels USDC refund for a specific account.
     * @param _total The total amount to cancel.
     * @param _account The address of the account.
     */
    function cancelUSDCRefund(uint256 _total, address _account) external;

    /**
     * @dev Cancels refund for a specific account and currency.
     * @param _total The total amount to cancel.
     * @param _account The address of the account.
     * @param _currency The address of the currency.
     */
    function cancelRefund(
        uint256 _total,
        address _account,
        address _currency
    ) external;
}
