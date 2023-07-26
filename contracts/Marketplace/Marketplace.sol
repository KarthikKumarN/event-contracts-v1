// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/Token//interface/IToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "contracts/Marketplace/Interface/IMarketplace.sol";
import "contracts/BukProtocol/ISupplierContract.sol";

contract Marketplace is Context, IMarketplace {
    using SafeERC20 for IToken;

    // Buk protocol address
    address public bukProtocalContract;
    address public bukNFTContract;

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
        bukProtocalContract = bukProtocalAddress_;
        bukNFTContract = bukNFTContract_;
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
        require(!_isTokenExists(tokenId), "NFT already listed");
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
        require(_isTokenExists(tokenId), "NFT not listed");
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
        require(_isTokenExists(tokenId), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        _listedNFT[tokenId_].status = ListingStatus.inactive;
        emit Delisted(tokenId_);
    }

    /**
     * @dev Function check is NFT/Booking exists/listed
     * @param tokenId_
     */
    function _isTokenExists(uint256 memory tokenId_) internal returns (bool) {
        return bytes(_listedNFT[tokenId_]).length > 0 ? true : false;
    }
}
