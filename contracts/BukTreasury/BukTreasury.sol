// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IBukTreasury } from "contracts/BukTreasury/IBukTreasury.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BUK Treasury Contract
 * @author BUK Technology Inc
 */
contract BukTreasury is AccessControl, IBukTreasury, Pausable {
    /// @dev Token used for transaction
    IERC20 private _stableToken;

    /// @dev address bukProtocol       Address of the Buk Protocol contract.
    address public bukProtocolContract;

    /**
     * @dev - Constant variable representing the role of the administrator
     * @notice its a hash of keccak256("ADMIN_ROLE")
     */
    bytes32 public constant ADMIN_ROLE =
        0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775;

    /**
     * @dev Constant for the role of the Buk Protocol contract
     * @notice its a hash of keccak256("BUK_PROTOCOL_ROLE")
     */
    bytes32 public constant BUK_PROTOCOL_ROLE =
        0xc90056e279113999fe5438fedaf4c98ded59812067ad79dd0c968b1a84dc7c97;

    /**
     * @dev Constructor to initialize the contract
     * @notice - This constructor function sets the token and the administrator of the contract.
     * @param _tokenAddress - Address of the ERC20 token contract
     */
    constructor(address _tokenAddress) {
        _setStableToken(_tokenAddress);

        // Updating permissions
        _setupRole(ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Pauses the Buk protocol.
     * Only the admin role can call this function.
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the Buk protocol.
     * Only the admin role can call this function.
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice - Set the ERC20 token contract address
     * @param _tokenAddress - Address of the ERC20 token contract
     * @dev - This function sets the currency for the Treasury contract. It can be executed only by the administrator.
     */
    function setStableToken(
        address _tokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        _setStableToken(_tokenAddress);
    }

    /**
     * @notice - Set the Buk Protocol contract address
     * @param _bukProtocol - Address of the Buk Protocol contract
     * @dev - This function sets the address of the Buk Protocol contract. It can be executed only by the administrator.
     */
    function setBukProtocol(
        address _bukProtocol
    ) external onlyRole(ADMIN_ROLE) {
        require(_bukProtocol != address(0), "Invalid address");
        address oldAddress = address(bukProtocolContract);
        bukProtocolContract = _bukProtocol;

        _grantRole(BUK_PROTOCOL_ROLE, address(_bukProtocol));
        _revokeRole(BUK_PROTOCOL_ROLE, address(oldAddress));

        emit BukProtocolSet(oldAddress, _bukProtocol);
    }

    /**
     * Withdraw the USDC funds
     * @param _amount - Total funds to withdraw
     * @param _account - Address of the account to which funds will be transferred
     * @dev - This function allows the administrator to withdraw funds in stable token to the specified account.
     * @notice This function can only be called by an address with `ADMIN_ROLE`
     */
    function withdrawStableToken(
        uint256 _amount,
        address _account
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_account != address(0), "Invalid address");

        _stableToken.transfer(_account, _amount);
        emit WithdrawnToken(_account, _amount, address(_stableToken));
    }

    /**
     * Withdraw funds in the specified token
     * @param _amount - Total funds to withdraw
     * @param _token - Address of the ERC20 token contract
     * @param _account - Address of the account to which funds will be transferred
     * @dev - To withdraw funds in the specified currency to the specified account.
     * @notice This function can only be called by an address with `ADMIN_ROLE`
     */
    function withdrawOtherToken(
        uint256 _amount,
        address _account,
        address _token
    ) external onlyRole(ADMIN_ROLE) whenNotPaused {
        require(_token != address(0), "Invalid token address");
        require(_account != address(0), "Invalid address");

        IERC20(_token).transfer(_account, _amount);
        emit WithdrawnToken(_account, _amount, _token);
    }

    /// @dev Refer {IBukTreasury-stableRefund}.
    function stableRefund(
        uint256 _amount,
        address _account
    ) external onlyRole(BUK_PROTOCOL_ROLE) whenNotPaused {
        require(_account != address(0), "Invalid address");

        _stableToken.transfer(_account, _amount);
        emit Refund(_account, _amount, address(_stableToken));
    }

    /// @dev Refer {IBukTreasury-otherRefund}.
    function otherRefund(
        uint256 _amount,
        address _account,
        address _token
    ) external onlyRole(BUK_PROTOCOL_ROLE) whenNotPaused {
        require(_token != address(0), "Invalid token address");
        require(_account != address(0), "Invalid address");

        IERC20(_token).transfer(_account, _amount);
        emit Refund(_account, _amount, _token);
    }

    /// @param _tokenAddress New stable token address
    function _setStableToken(address _tokenAddress) private {
        require(_tokenAddress != address(0), "Invalid address");
        address oldAddress = address(_stableToken);
        _stableToken = IERC20(_tokenAddress);

        emit SetStableToken(oldAddress, _tokenAddress);
    }
}
