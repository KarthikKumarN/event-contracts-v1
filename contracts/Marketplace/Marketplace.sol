// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { IMarketplace } from "contracts/Marketplace/IMarketplace.sol";
import { IBukProtocol } from "contracts/BukProtocol/IBukProtocol.sol";
import { IBukNFTs } from "contracts/BukNFTs/IBukNFTs.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

contract Marketplace is Context, IMarketplace, AccessControl {
    // Using safeERC20
    using SafeERC20 for IERC20;

    /**
     * @dev Constant for the role of the Admin
     */

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /**
     * @dev Constant for the role of the Buk Protocol contract
     */
    bytes32 public constant BUK_PROTOCOL_ROLE = keccak256("BUK_PROTOCOL_ROLE");

    /**
     * @dev Constant address Buk Protocol contract
     */
    IBukProtocol private _bukProtocalContract;

    /**
     * @dev Constant address Buk NFT contract
     */
    IBukNFTs private _bukNFTContract;

    // Address of owner who can perform administrator work
    address private _owner;

    /**
     * @dev Currency used for transaction
     */
    IERC20 private _stableToken;

    /**
     * @dev mapping(uint256 => ListingDetails) _listedNFT  Captures listed bookings for sale
     */
    mapping(uint256 => ListingDetails) private _listedNFT;

    /**
     * @dev Constructor to initialize the contract
     * @param _bukProtocalAddress address of Buk protocol
     * @param _bukNFTAddress address of Buk NFT
     * @param _tokenAddress address of the stable token
     */
    constructor(
        address _bukProtocalAddress,
        address _bukNFTAddress,
        address _tokenAddress
    ) {
        _setOwner(_msgSender());
        _setStableToken(_tokenAddress);
        _setBukProtocol(_bukProtocalAddress);
        _setBukNFT(_bukNFTAddress);

        // Updating permission
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev Refer {IMarketplace-createListing}.
     */
    function createListing(uint256 _tokenId, uint256 _price) external {
        require(!isBookingListed(_tokenId), "NFT already listed");
        IBukProtocol.Booking memory bookingDetails = _bukProtocalContract
            .getBookingDetails(_tokenId);
        require(
            _price >= bookingDetails.minSalePrice,
            "Sale price can't be less than minimum sale price"
        );
        require(
            bookingDetails.status == IBukProtocol.BookingStatus.confirmed &&
                bookingDetails.tradeable,
            "Only available booking can be tradable"
        );
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can list"
        );
        require(
            _bukNFTContract.isApprovedForAll(_msgSender(), address(this)),
            "Please approve marketplace to execute trade"
        );
        require(
            block.timestamp <
                (bookingDetails.checkin -
                    (bookingDetails.tradeTimeLimit * 3600)),
            "Trade limit time crossed"
        );
        _listedNFT[_tokenId] = ListingDetails(
            _price,
            _msgSender(),
            ListingStatus.active
        );

        emit ListingCreated(_msgSender(), _tokenId, _price);
    }

    /**
     * @dev Refer {IMarketplace-delist}.
     */
    function delist(uint256 _tokenId) external {
        require(isBookingListed(_tokenId), "NFT not listed");
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can delist"
        );

        _listedNFT[_tokenId].status = ListingStatus.inactive;
        emit Delisted(_tokenId);
    }

    /**
     * @dev Refer {IMarketplace-deleteListing}.
     */
    function deleteListing(uint256 _tokenId) external {
        require(isBookingListed(_tokenId), "NFT not listed");
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1 ||
                hasRole(BUK_PROTOCOL_ROLE, _msgSender()),
            "Only owner or Buk protocol can delete"
        );
        delete _listedNFT[_tokenId];
        emit DeletedListing(_tokenId);
    }

    /**
     * @dev Refer {IMarketplace-relist}.
     */
    function relist(uint256 _tokenId, uint256 _newPrice) external {
        require(isBookingListed(_tokenId), "NFT not listed");
        IBukProtocol.Booking memory bookingDetails = _bukProtocalContract
            .getBookingDetails(_tokenId);
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can relist"
        );
        require(
            bookingDetails.status == IBukProtocol.BookingStatus.confirmed,
            "Only available booking can be tradable"
        );
        require(
            _newPrice >= bookingDetails.minSalePrice,
            "Sale price cann't be lessthan minimum sale price"
        );
        uint256 oldPrice = _listedNFT[_tokenId].price;
        _listedNFT[_tokenId].status = ListingStatus.active;
        _listedNFT[_tokenId].price = _newPrice;
        emit Relisted(_tokenId, oldPrice, _newPrice);
    }

    /**
     * @dev Refer {IMarketplace-buyRoom}.
     */
    function buyRoom(uint256 _tokenId) external {
        require(
            _listedNFT[_tokenId].status == ListingStatus.active,
            "NFT not listed"
        );
        _buy(_tokenId);
    }

    /**
     * @dev Refer {IMarketplace-buyRoomBatch}.
     */
    function buyRoomBatch(uint256[] calldata _tokenIds) external {
        uint256 len = _tokenIds.length;
        for (uint256 i = 0; i < len; ) {
            require(
                _listedNFT[_tokenIds[i]].status == ListingStatus.active,
                "NFT not listed"
            );
            _buy(_tokenIds[i]);
            unchecked {
                i += 1;
            }
        }
    }

    /**
     * @dev Refer {IMarketplace-setBukProtocol}.
     */
    function setBukProtocol(
        address _bukProtocol
    ) external onlyRole(ADMIN_ROLE) {
        _setBukProtocol(_bukProtocol);
    }

    /**
     * @dev Refer {IMarketplace-setBukNFT}.
     */
    function setBukNFT(address _bukNFT) external onlyRole(ADMIN_ROLE) {
        _setBukNFT(_bukNFT);
    }

    /**
     * @dev Refer {IMarketplace-setAdmin}.
     */
    function setOwner(address _ownerAddress) external onlyRole(ADMIN_ROLE) {
        _setOwner(_ownerAddress);
    }

    /**
     * @dev Refer {IMarketplace-setStableToken}.
     */
    function setStableToken(
        address _tokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        _setStableToken(_tokenAddress);
    }

    /**
     * @dev Refer {IMarketplace-getStableToken}.
     */
    function getStableToken() external view returns (address) {
        return address(_stableToken);
    }

    /**
     * @dev Refer {IMarketplace-getBukProtocol}.
     */
    function getBukProtocol() external view returns (address) {
        return address(_bukProtocalContract);
    }

    /**
     * @dev Refer {IMarketplace-getBukNFT}.
     */
    function getBukNFT() external view returns (address) {
        return address(_bukNFTContract);
    }

    /**
     * @dev Refer {IMarketplace-getListingDetails}.
     */
    function getListingDetails(
        uint256 _tokenId
    ) external view returns (ListingDetails memory) {
        return _listedNFT[_tokenId];
    }

    /**
     * @dev Refer {IMarketplace-isBookingListed}.
     */
    function isBookingListed(uint256 _tokenId) public view returns (bool) {
        return _listedNFT[_tokenId].price > 0 ? true : false;
    }

    /**
     * @dev Function sets new Buk NFT address
     */
    function _setBukNFT(address _bukNFT) private {
        require(_bukNFT != address(0), "Invalid address");
        address oldAddress = address(_bukNFTContract);
        _bukNFTContract = IBukNFTs(_bukNFT);

        emit BukNFTSet(oldAddress, _bukNFT);
    }

    /**
     * @dev Function sets new Buk protocol address
     * @param _bukProtocol New Buk protocol address
     */
    function _setBukProtocol(address _bukProtocol) private {
        require(_bukProtocol != address(0), "Invalid address");
        address oldAddress = address(_bukProtocalContract);
        _bukProtocalContract = IBukProtocol(_bukProtocol);

        _grantRole(BUK_PROTOCOL_ROLE, address(_bukProtocol));
        _revokeRole(BUK_PROTOCOL_ROLE, address(oldAddress));

        emit BukProtocolSet(oldAddress, _bukProtocol);
    }

    /**
     *
     * @param _ownerAddress New owner address
     */
    function _setOwner(address _ownerAddress) private {
        require(_ownerAddress != address(0), "Invalid address");
        address oldAddress = address(_owner);
        _owner = address(_ownerAddress);
        _setupRole(ADMIN_ROLE, address(_ownerAddress));
        _revokeRole(ADMIN_ROLE, oldAddress);

        emit OwnerSet(oldAddress, _owner);
    }

    /**
     *
     * @param _tokenAddress New stable token address
     */
    function _setStableToken(address _tokenAddress) private {
        require(_tokenAddress != address(0), "Invalid address");
        address oldAddress = address(_stableToken);
        _stableToken = IERC20(_tokenAddress);

        emit BukNFTSet(oldAddress, _tokenAddress);
    }

    /**
     * @dev Safe transfer NFT/Booking to buyer and transfer the price to owner wallet and buk treasury
     * @dev Transfer sale price and royalties
     * @param _tokenId, NFT/Booking ID
     */
    function _buy(uint256 _tokenId) private {
        IBukProtocol.Booking memory bookingDetails = _bukProtocalContract
            .getBookingDetails(_tokenId);
        require(
            bookingDetails.status == IBukProtocol.BookingStatus.confirmed &&
                bookingDetails.tradeable,
            "Only available booking can be tradable"
        );
        require(
            block.timestamp <
                (bookingDetails.checkin -
                    (bookingDetails.tradeTimeLimit * 3600)),
            "Trade limit time crossed"
        );
        require(
            (_stableToken.allowance(_msgSender(), address(this)) >=
                _listedNFT[_tokenId].price),
            "Check the allowance of the spender"
        );
        address nftOwner = _listedNFT[_tokenId].owner;
        require(
            _bukNFTContract.balanceOf(nftOwner, _tokenId) == 1,
            "NFT owner mismatch"
        );
        (address royaltyAddress, uint256 royaltyAmount) = _bukNFTContract
            .royaltyInfo(_tokenId, _listedNFT[_tokenId].price);

        _stableToken.safeTransferFrom(
            _msgSender(),
            royaltyAddress,
            royaltyAmount
        );
        _stableToken.safeTransferFrom(
            _msgSender(),
            nftOwner,
            _listedNFT[_tokenId].price - royaltyAmount
        );
        _bukNFTContract.safeTransferFrom(
            address(nftOwner),
            _msgSender(),
            _tokenId,
            1,
            ""
        );
        emit RoomBought(
            _tokenId,
            nftOwner,
            _msgSender(),
            _listedNFT[_tokenId].price
        );
    }
}
