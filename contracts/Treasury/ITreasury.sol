// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface ITreasury {
    function cancelUSDCRefund(uint256 _total, address _account)  external;
    function cancelRefund(uint256 _total, address _account, address _currency) external;
}
