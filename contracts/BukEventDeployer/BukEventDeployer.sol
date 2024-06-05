// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { BukNFTs } from "../BukNFTs/BukNFTs.sol";
import { IBukEventDeployer } from "../BukEventDeployer/IBukEventDeployer.sol";

contract BukEventDeployer is IBukEventDeployer, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    bytes32 public constant BUK_EVENT_PROTOCOL_ROLE =
        0xa2aa529b1ac745f732589985ad0e0a21e77f45806945225b02a7ecc719ad2cab;

    /// @dev Constant address Buk Protocol contract
    address private _bukEventProtocolContract;

    /// @dev Constant address Buk Marketplace contract
    /// @dev Default buk aggregated marketplace contract
    address private _bukMarketplaceContract;

    /**
     * @dev Constructor to initialize the contract
     * @param _bukEventProtocolAddress address of Buk protocol
     * @param _bukMarketplaceAddress address of Buk Marketplace
     */
    constructor(
        address _bukEventProtocolAddress,
        address _bukMarketplaceAddress
    ) {
        _setBukEventProtocol(_bukEventProtocolAddress);
        _setBukMarketplace(_bukMarketplaceAddress);
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
        BukNFTs eventNFT = new BukNFTs(
            _name,
            _bukEventProtocol,
            _bukTreasury,
            _bukMarketplaceContract
        );
        emit DeployedEventNFT(_name);
        return address(eventNFT);
    }

    /// @dev Refer {IBukEventDeployer-setBukEventProtocol}.
    function setBukEventProtocol(
        address _bukEventProtocol
    ) external onlyRole(ADMIN_ROLE) {
        _setBukEventProtocol(_bukEventProtocol);
    }

    /// @dev Refer {IBukEventDeployer-setBukMarketplace}.
    function setBukMarketplace(
        address _bukMarketplace
    ) external onlyRole(ADMIN_ROLE) {
        _setBukMarketplace(_bukMarketplace);
    }

    /// @dev Refer {IBukEventDeployer-setNFTMarketplaceRole}.
    function setNFTMarketplaceRole(
        address _eventNFTAddress,
        address _marketplaceAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(_eventNFTAddress != address(0), "Invalid address");
        require(_marketplaceAddress != address(0), "Invalid address");

        BukNFTs eventNFT = BukNFTs(_eventNFTAddress);
        eventNFT.setMarketplaceRole(_marketplaceAddress);
    }

    /// @dev Refer {IBukEventDeployer-revokeNFTMarketplaceRole}.
    function revokeNFTMarketplaceRole(
        address _eventNFTAddress,
        address _marketplaceAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(_eventNFTAddress != address(0), "Invalid address");
        require(_marketplaceAddress != address(0), "Invalid address");

        BukNFTs eventNFT = BukNFTs(_eventNFTAddress);
        eventNFT.revokeMarketplaceRole(_marketplaceAddress);
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

        emit SetBukEventProtocol(oldAddress, _bukEventProtocol);
    }

    /**
     * @dev Function sets new Buk marketplace address
     * @param _bukMarketplace New Buk marketplace address
     */
    function _setBukMarketplace(address _bukMarketplace) private {
        require(_bukMarketplace != address(0), "Invalid address");
        address oldAddress = address(_bukMarketplaceContract);
        _bukMarketplaceContract = address(_bukMarketplace);

        emit SetBukMarketplace(oldAddress, _bukMarketplace);
    }
}
