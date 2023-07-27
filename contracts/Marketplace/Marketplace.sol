// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/Token//interface/IToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "contracts/Marketplace/Interface/IMarketplace.sol";

contract Marketplace is Context, IMarketplace {
    using SafeERC20 for IToken;

    // Buk protocol address
    address private _bukProtocalContract;
    address private _bukNFTContract;

    // Treasury address
    address private _treasury;
    address private _hotelWallet;

    // Address of owner who can perform adminitotor work
    address private _owner;

    // Royalty values
    uint8 private _bukRoyalty;
    uint8 private _hotelRoyalty;
    uint8 private _userRoyalty;

    // Currency used for transaction
    IToken private immutable _stableToken;

    // Captures listed bookings for sale
    mapping(uint256 => ListingDetails) private _listedNFT;

    constructor(
        address bukProtocalAddress_,
        address bukNFTContract_,
        address treasury_,
        address hotelWallet_,
        uint8 bukRoyalty_,
        uint8 hotelRoyalty_,
        uint8 userRoyalty_,
        address currency_
    ) {
        _bukProtocalContract = bukProtocalAddress_;
        _bukNFTContract = bukNFTContract_;
        _treasury = treasury_;
        _hotelWallet = hotelWallet_;

        // Set royalty
        _bukRoyalty = bukRoyalty_;
        _hotelRoyalty = hotelRoyalty_;
        _userRoyalty = userRoyalty_;
        _stableToken = IToken(currency_);
    }

    /**
     * @dev Refer IMarketplace
     * @param tokenId_ room/booking NFT id
     * @param price_  price of room/booking
     * @param tardeTimeLimt_ time till tradable
     * @dev While listing will approve marketplace to excecute transfer
     */
    function createListing(
        uint256 tokenId_,
        uint256 price_,
        uint256 tardeTimeLimt_
    ) external {
        require(tokenId_ >= 0, "Invalide NFT");
        require(!_isTokenExists(tokenId_), "NFT already listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, minSalePrice, status
        require(tardeTimeLimt_ > block.timestamp, "Trade limit time crossed");
        _listedNFT[tokenId_] = ListingDetails(
            price_,
            tardeTimeLimt_,
            ListingStatus.active
        );
        // TODO emit
        // emit ListingCreated(owner, tokenId_, price_);
    }

    /**
     * @dev Refer IMarketplace
     * @dev NFT owner can delist
     * @param tokenId_ NFT id
     */
    function deListing(uint256 tokenId_) external {
        require(tokenId_ >= 0, "Invalide NFT");
        require(_isTokenExists(tokenId_), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        _listedNFT[tokenId_].status = ListingStatus.inactive;
        emit Delisted(tokenId_);
    }

    /**
     * @dev Refer IMarketplace
     * @param tokenId_ NFT id
     */
    function deleteListing(uint256 tokenId_) external {
        require(tokenId_ >= 0, "Invalide NFT");
        require(_isTokenExists(tokenId_), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        delete _listedNFT[tokenId_];
        emit DeletedListing(tokenId_);
    }

    /**
     * @dev Refer IMarketplace
     * @dev Only NFT owner can update
     * @param tokenId_ NFT id
     */
    function reList(uint256 tokenId_, uint256 price_) external {
        require(tokenId_ >= 0, "Invalide NFT");
        require(_isTokenExists(tokenId_), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        _listedNFT[tokenId_].status = ListingStatus.active;
        _listedNFT[tokenId_].price = price_;
        emit Relisted(tokenId_, price_);
    }

    /**
     * @dev Refer IMarketplace
     * @param tokenId_ room/booking NFT id
     */
    function buyRoom(uint256 tokenId_) external {}

    /**
     * @dev Refer IMarketplace
     * @param bukProtocol_ address of new buk protocol
     */
    function setBukProtocol(address bukProtocol_) external {
        require(bukProtocol_ != address(0), "Invalid address");
        _bukProtocalContract = bukProtocol_;
    }

    /**
     * @dev Refer IMarketplace
     * @param bukNFT_ address of new buk protocol
     */
    function setBukNFT(address bukNFT_) external {}

    /**
     * @dev Refer IMarketplace
     * @dev Only admin access to set
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setBukRoyalty(uint8 royalty_) external {}

    /**
     * @dev Refer IMarketplace
     * @dev Only admin access to set
     * @dev Hotel royalty fee applies to the all listing
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setHotelRoyalty(uint8 royalty_) external {}

    /**
     * @dev Refer IMarketplace
     * @dev Only admin access to set
     * @dev User royalty applies to the all listing
     * @dev User royalty applies first time buyer of room
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setUserRoyalty(uint8 royalty_) external {}

    /**
     * @dev Refer IMarketplace
     * @dev Only admin access to set
     * @param newTreasuryWallet_, Address of the new treasury wallet
     */
    function setTreasuryWallet(address newTreasuryWallet_) external {}

    /**
     * @dev Refer IMarketplace
     * @dev Only admin access to set
     * @param newWallet_, Address of the new fee wallet
     */
    function setHotelWallet(address newWallet_) external {}

    /**
     * @dev Refer IMarketplace
     * @return address, Address of the stable token contract
     */
    function getStableToken() external view returns (address) {
        return address(_stableToken);
    }

    /**
     * @dev Refer IMarketplace
     * @return address, Address of the buk protocol contract
     */
    function getBukProtocol() external view returns (address) {
        return _bukProtocalContract;
    }

    /**
     * @dev Refer IMarketplace
     * @return address, Address of the buk NFT contract
     */
    function getBukNFT() external view returns (address) {
        return _bukNFTContract;
    }

    /**
     * @dev Refer IMarketplace
     * @return address, Address of the treasury wallet
     */
    function getTreasuryWallet() external view returns (address) {
        return _treasury;
    }

    /**
     * @dev Refer IMarketplace
     * @return address Address of the fee wallet
     */
    function getHotelWallet() external view returns (address) {
        return _hotelWallet;
    }

    /**
     * @dev Refer IMarketplace
     * @return uint8 Percent of BUK royalty
     */
    function getBukRoyalty() external view returns (uint8) {
        return _bukRoyalty;
    }

    /**
     * @dev Refer IMarketplace
     * @return uint8 Percent of hotel royalty
     */
    function getHotelRoyalty() external view returns (uint8) {
        return _hotelRoyalty;
    }

    /**
     * @dev Refer IMarketplace
     * @return uint8 Percent of user royalty
     */
    function getUserRoyalty() external view returns (uint8) {
        return _userRoyalty;
    }

    /**
     * @dev Function will provide Lisiting details of booking
     * @param tokenId_ room/booking NFT id
     */
    function getListingDetails(
        uint256 tokenId_
    ) external view returns (ListingDetails memory) {
        return _listedNFT[tokenId_];
    }

    /**
     * @dev Function check is NFT/Booking exists/listed
     * @param tokenId_ TOkenID of booking
     */
    function _isTokenExists(uint256 tokenId_) internal view returns (bool) {
        return _listedNFT[tokenId_].price > 0 ? true : false;
    }
}
