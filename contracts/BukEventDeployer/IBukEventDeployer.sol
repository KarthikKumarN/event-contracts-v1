// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukEventDeployer {
    /// @dev Emitted when new event NFT is deployed
    event DeployedEventNFT(string name);

    /// @dev Emitted when new BukEventProtocol address has been updated
    event SetBukEventProtocol(address oldAddress, address newAddress);

    /// @dev Emitted when new BukMarketplace address has been updated
    event SetBukMarketplace(address oldAddress, address newAddress);

    /**
     * @dev Function will set new BUK protocol address
     * @param _bukProtocol address of new BUK protocol
     * @notice Only admin can set new BUK protocol address
     */
    function setBukEventProtocol(address _bukProtocol) external;

    /**
     * @dev Function will set new BUK Marketplace address
     * @param _bukMarketplace address of new BUK marketplace
     * @notice Only admin can set new BUK marketplace address
     * @notice Buk Marketplace address is default Buk agrregated contract
     */
    function setBukMarketplace(address _bukMarketplace) external;

    /**
     * @dev Function will set Marketplace role to Event NFT
     * @param _eventNFTAddress address of Event NFT contract
     * @param _marketplaceAddress address of marketplace to whitelist
     * @notice Only admin can set new marketplace address
     * @notice Marketplace role is to enable tranding permission
     */
    function setNFTMarketplaceRole(
        address _eventNFTAddress,
        address _marketplaceAddress
    ) external;

    /**
     * @dev Function will revoke Marketplace role to Event NFT
     * @param _eventNFTAddress address of Event NFT contract
     * @param _marketplaceAddress address of marketplace to whitelist
     * @notice Only admin can set new marketplace address
     * @notice Marketplace role is to enable tranding permission
     */
    function revokeNFTMarketplaceRole(
        address _eventNFTAddress,
        address _marketplaceAddress
    ) external;

    /**
     * @dev Function will deploy new event NFT
     * @param _name Name of the event NFT
     * @param _bukEventProtocol Address of the buk protocol contract
     * @param _bukTreasury Address of the Buk treasury contract.
     * @notice Only BUK protocol can deploy event NFT
     */
    function deployEventNFT(
        string calldata _name,
        address _bukEventProtocol,
        address _bukTreasury
    ) external returns (address);
}
