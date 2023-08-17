// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title BUK Treasury Contract
 * @author BUK Technology Inc
 */
contract BukTreasury is AccessControl {
    /**
     * @dev address currency          Address of the default currency.
     */
    address public currency;
    /**
     * @dev address bukProtocol       Address of the Buk Protocol contract.
     */
    address public bukProtocol;

    /**
     * @dev - Constant variable representing the role of the administrator
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

    /**
     * @dev Emitted when the currency address is set.
     */
    event SetCurrency(address indexed currency);

    /**
     * @dev Emitted when the Buk Protocol address is set.
     */
    event SetBukProtocol(address indexed bukProtocol);

    /**
     * @dev Emitted when the deployers are set.
     */
    event WithdrawFund(address indexed _account, uint256 indexed _total);

    /**
     * @dev Emitted when the deployers are set.
     */
    event CancelFund(address indexed _account, uint256 indexed _total);

    /**
     * @notice - Modifier that allows only the Buk Protocol contract to execute the function
     */
    modifier onlyBukProtocol(address addr) {
        require(addr == bukProtocol, "Only Buk Protocol has Access");
        _;
    }

    /**
     * @notice - This constructor function sets the currency and the administrator of the contract.
     * @param _currency-Address of the ERC20 token contract
     */
    constructor(address _currency) {
        currency = _currency;
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @notice - Set the ERC20 token contract address
     * @param _currency-Address of the ERC20 token contract
     * @dev - This function sets the currency for the Treasury contract. It can be executed only by the administrator.
     */
    function setCurrency(address _currency) external onlyRole(ADMIN_ROLE) {
        currency = _currency;
        emit SetCurrency(_currency);
    }

    /**
     * @notice - Set the Buk Protocol contract address
     * @param _bukProtocol - Address of the Buk Protocol contract
     * @dev - This function sets the address of the Buk Protocol contract. It can be executed only by the administrator.
     */
    function setBukProtocol(address _bukProtocol) external onlyRole(ADMIN_ROLE) {
        bukProtocol = _bukProtocol;
        emit SetBukProtocol(_bukProtocol);
    }

    /**
     * Withdraw the USDC funds
     * @param _total-Total funds to withdraw
     * @param _account-Address of the account to which funds will be transferred
     * @dev - This function allows the administrator to withdraw funds in USDC token to the specified account.
     * @notice This function can only be called by an address with `ADMIN_ROLE`
     */
    function withdrawUSDCFund(
        uint256 _total,
        address _account
    ) external onlyRole(ADMIN_ROLE) {
        IERC20(currency).transfer(_account, _total);
        emit WithdrawFund(_account, _total);
    }

    /**
     * Withdraw funds in the specified currency
     * @param _total-Total funds to withdraw
     * @param _currency-Address of the ERC20 token contract
     * @param _account-Address of the account to which funds will be transferred
     * @dev - To withdraw funds in the specified currency to the specified account.
     * @notice This function can only be called by an address with `ADMIN_ROLE`
     */
    function withdrawFund(
        uint256 _total,
        address _account,
        address _currency
    ) external onlyRole(ADMIN_ROLE) {
        IERC20(_currency).transfer(_account, _total);
        emit WithdrawFund(_account, _total);
    }

    /**
     * Transfer cancellation charges in  USDC
     * @param _total-Total funds to transfer
     * @param _account-Address of the account to which funds will be transferred
     * @dev - To transfer the cancellation charges in USDC to the specified account.
     * @notice This function can only be called by Buk Protocol contract
     */
    function cancelUSDCRefund(
        uint256 _total,
        address _account
    ) external onlyBukProtocol(_msgSender()) {
        IERC20(currency).transfer(_account, _total);
        emit CancelFund(_account, _total);
    }

    /**
     * Transfer cancellation charges in specified currency.
     * @param _total - Total funds to transfer
     * @param _account - Address of the account to which funds will be transferred
     * @dev To transfer the cancellation charges in specified currency to the specified account.
     * @notice This function can only be called by the Buk Protocol contract
     */

    function cancelRefund(
        uint256 _total,
        address _account,
        address _currency
    ) external onlyBukProtocol(_msgSender()) {
        IERC20(_currency).transfer(_account, _total);
        emit CancelFund(_account, _total);
    }
}
