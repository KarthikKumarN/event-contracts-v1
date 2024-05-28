// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { BukNFTs } from "../BukNFTs/BukNFTs.sol";
import { IBukEventDeployer } from "../BukEventDeployer/IBukEventDeployer.sol";

contract BukEventDeployer is IBukEventDeployer, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BUK_EVENT_PROTOCOL_ROLE =
        keccak256("BUK_EVENT_PROTOCOL_ROLE");

    /// @dev Constant address Buk Protocol contract
    address private _bukEventProtocolContract;

    /**
     * @dev Constructor to initialize the contract
     * @param _bukEventProtocolAddress address of Buk protocol
     */
    constructor(address _bukEventProtocolAddress) {
        _setBukEventProtocol(_bukEventProtocolAddress);
        // Updating permission
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /// @dev Refer {IBukEventDeployer-deployEventNFT}.
    function deployEventNFT(
        string calldata _name,
        address _bukEventProtocol,
        address _bukTreasury
    ) external onlyRole(BUK_EVENT_PROTOCOL_ROLE) returns (address) {
        BukNFTs eventNFT = new BukNFTs(_name, _bukEventProtocol, _bukTreasury);
        emit DeployedEventNFT(_name);
        return address(eventNFT);
    }

    /// @dev Refer {IBukEventDeployer-setBukEventProtocol}.
    function setBukEventProtocol(
        address _bukEventProtocol
    ) external onlyRole(ADMIN_ROLE) {
        _setBukEventProtocol(_bukEventProtocol);
    }

    /**
     * @dev Function sets new Buk protocol address
     * @param _bukEventProtocol New Buk protocol address
     */
    function _setBukEventProtocol(address _bukEventProtocol) private {
        require(_bukEventProtocol != address(0), "Invalid address");
        address oldAddress = address(_bukEventProtocolContract);
        _bukEventProtocolContract = address(_bukEventProtocol);

        _grantRole(BUK_EVENT_PROTOCOL_ROLE, address(_bukEventProtocol));
        _revokeRole(BUK_EVENT_PROTOCOL_ROLE, address(oldAddress));

        emit SetBukEventProtocol(address(_bukEventProtocol));
    }
}
