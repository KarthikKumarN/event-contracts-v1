// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/** 
* @title BUK Treasury Contract 
* @author BUK Technology Inc
*/
contract Treasury is AccessControl {
    /**
    * @dev address currency          Address of the default currency.
    */
    address public currency;
    /**
    * @dev address factoryContract          Address of the factory contract.
    */
    address public factoryContract;

    /** 
    * @notice - This constructor function sets the currency and the administrator of the contract.
    * @param _currency-Address of the ERC20 token contract 
    */
    constructor ( address _currency ) {
        currency = _currency;
        _grantRole(ADMIN_ROLE, _msgSender());
    }


    /**
    * @dev Emitted when the currency address is set.
    */
    event SetCurrency(address indexed currency);
    /**
    * @dev Emitted when the factory address is set.
    */
    event SetFactory(address indexed factory);
    /**
    * @dev Emitted when the deployers are set.
    */
    event WithdrawFund(address indexed _account, uint256 indexed _total);
    /**
    * @dev Emitted when the deployers are set.
    */
    event CancelFund(address indexed _account, uint256 indexed _total);
    

    /** 
    * @dev - Constant variable representing the role of the administrator
    */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");


    /** 
    * @notice - Modifier that allows only the factory contract to execute the function
    */
    modifier onlyFactory(address addr) {
        require(addr == factoryContract, "Only Factory contract has Access");
        _;
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
    * @notice - Set the factory contract address
    * @param _factory-Address of the factory contract
    * @dev - This function sets the address of the factory contract. It can be executed only by the administrator.
    */
    function setFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        factoryContract = _factory;
        emit SetCurrency(_factory);
    }

    /** 
    * @notice - Withdraw the USDC funds
    * @param _total-Total funds to withdraw
    * @param _account-Address of the account to which funds will be transferred
    * @dev - This function allows the administrator to withdraw funds in USDC token to the specified account.
    * @notice This function can only be called by an address with `ADMIN_ROLE`
    */
    function withdrawUSDCFund(uint256 _total, address _account) external onlyRole(ADMIN_ROLE) {
        IERC20(currency).transfer(_account, _total);
        emit WithdrawFund(_account, _total);
    }


    /** 
    * @notice - Withdraw funds in the specified currency
    * @param _total-Total funds to withdraw
    * @param _currency-Address of the ERC20 token contract
    * @param _account-Address of the account to which funds will be transferred
    * @dev - This function allows the administrator to withdraw funds in the specified currency to the specified account.
    * @notice This function can only be called by an address with `ADMIN_ROLE`
    */
    function withdrawFund(uint256 _total, address _account, address _currency) external onlyRole(ADMIN_ROLE) {
        IERC20(_currency).transfer(_account, _total);
        emit WithdrawFund(_account, _total);
    }

    /** 
    * @notice - Cancel Booking refund in USDC
    * @param _total-Total funds to transfer
    * @param _account-Address of the account to which funds will be transferred
    * @dev - This function allows the factory contract to transfer the cancellation charges in USDC to the specified account.
    * @notice This function can only be called by factory contract
    */
    function cancelUSDCRefund(uint256 _total, address _account) external onlyFactory(_msgSender()) {
        IERC20(currency).transfer(_account, _total);
        emit CancelFund(_account, _total);
    }

    /** 
    * @notice - Cancel Booking refund in specified currency
    * @param _total-Total funds to transfer
    * @param _account-Address of the account to which funds will be transferred
    * @dev - This function allows the factory contract to transfer the cancellation charges in specified currency to the specified account.
    * @notice This function can only be called by factory contract
    */
    function cancelRefund(uint256 _total, address _account, address _currency) external onlyFactory(_msgSender()) {
        IERC20(_currency).transfer(_account, _total);
        emit CancelFund(_account, _total);
    }
}
