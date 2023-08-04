// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "contracts/Token//interface/IToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "contracts/Marketplace/Interface/IMarketplace.sol";
import "contracts/BukProtocol/IBukProtocol.sol";
import "contracts/BukNFTs/IBukNFTs.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract Marketplace is Context, IMarketplace, AccessControl {
    using SafeERC20 for IToken;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BUK_PROTOCOL_ROLE = keccak256("BUK_PROTOCOL_ROLE");

    // Buk protocol address
    IBukProtocol private _bukProtocalContract;
    IBukNFTs private _bukNFTContract;

    // Address of owner who can perform adminitotor work
    address private _owner;

    // Currency used for transaction
    IToken private immutable _stableToken;

    // Captures listed bookings for sale
    mapping(uint256 => ListingDetails) private _listedNFT;

    constructor(
        address bukProtocalAddress_,
        address bukNFTContract_,
        address currency_
    ) {
        _bukProtocalContract = IBukProtocol(bukProtocalAddress_);
        _bukNFTContract = IBukNFTs(bukNFTContract_);
        _stableToken = IToken(currency_);

        // Updating permission
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_ROLE, address(bukProtocalAddress_));
    }

    /**
     * @dev Refer {IMarketplace-createListing}.
     * @param tokenId_ room/booking NFT id
     * @param price_  Sale price of room/booking
     * @dev While listing will approve marketplace to excecute transfer
     */
    function createListing(uint256 tokenId_, uint256 price_) external {
        require(!isListed(tokenId_), "NFT already listed");
        require(
            price_ >= _bukProtocalContract.getBookingDetails(tokenId_).baseRate,
            "Sale price cann't be lessthan base price"
        );
        require(
            _bukProtocalContract.getBookingDetails(tokenId_).status ==
                IBukProtocol.BookingStatus.confirmed,
            "Only confirmed can be tradable"
        );
        require(
            _bukNFTContract.balanceOf(_msgSender(), tokenId_) == 1,
            "Only owner can list"
        );
        // TODO tradetimelimit
        // console.log(
        //     _bukProtocalContract.getBookingDetails(tokenId_).checkin,
        //     " Checkin"
        // );
        // console.log(
        //     _bukProtocalContract.getBookingDetails(tokenId_).tradeTimeLimit,
        //     " tradelimit"
        // );
        // console.log(
        //     _bukProtocalContract.getBookingDetails(tokenId_).checkin -
        //         _bukProtocalContract
        //             .getBookingDetails(tokenId_)
        //             .tradeTimeLimit *
        //         3600,
        //     " Difference"
        // );
        // console.log(block.timestamp, " block.timestamp");
        require(
            block.timestamp <
                (_bukProtocalContract.getBookingDetails(tokenId_).checkin -
                    (_bukProtocalContract
                        .getBookingDetails(tokenId_)
                        .tradeTimeLimit * 3600)),
            "Trade limit time crossed"
        );
        _listedNFT[tokenId_] = ListingDetails(price_, ListingStatus.active);
        emit ListingCreated(_msgSender(), tokenId_, price_);
    }

    /**
     * @dev Refer IMarketplace
     * @dev NFT owner can delist
     * @param tokenId_ NFT id
     */
    function delist(uint256 tokenId_) external {
        require(isListed(tokenId_), "NFT not listed");
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
        require(isListed(tokenId_), "NFT not listed");
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
    function relist(uint256 tokenId_, uint256 newPrice_) external {
        require(isListed(tokenId_), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        uint256 oldPrice_ = _listedNFT[tokenId_].price;
        _listedNFT[tokenId_].status = ListingStatus.active;
        _listedNFT[tokenId_].price = newPrice_;
        emit Relisted(tokenId_, oldPrice_, newPrice_);
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
    function setBukProtocol(
        address bukProtocol_
    ) external onlyRole(ADMIN_ROLE) {
        require(bukProtocol_ != address(0), "Invalid address");
        address oldAddress = address(_bukProtocalContract);
        _bukProtocalContract = IBukProtocol(bukProtocol_);

        emit BukProtocolSet(oldAddress, bukProtocol_);
    }

    /**
     * @dev Refer IMarketplace
     * @param bukNFT_ address of new buk protocol
     */
    function setBukNFT(address bukNFT_) external onlyRole(ADMIN_ROLE) {
        require(bukNFT_ != address(0), "Invalid address");
        address oldAddress = address(_bukNFTContract);
        _bukNFTContract = IBukNFTs(bukNFT_);

        emit BukNFTSet(oldAddress, bukNFT_);
    }

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
        return address(_bukProtocalContract);
    }

    /**
     * @dev Refer IMarketplace
     * @return address, Address of the buk NFT contract
     */
    function getBukNFT() external view returns (address) {
        return address(_bukNFTContract);
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
     * @param tokenId_ TokenID of booking
     */
    function isListed(uint256 tokenId_) public view returns (bool) {
        return _listedNFT[tokenId_].price > 0 ? true : false;
    }
}
