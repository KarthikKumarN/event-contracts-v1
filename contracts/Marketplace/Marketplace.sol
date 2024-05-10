// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { IMarketplace } from "contracts/Marketplace/IMarketplace.sol";
import { IBukEventProtocol } from "contracts/BukEventProtocol/IBukEventProtocol.sol";
import { IBukNFTs } from "contracts/BukNFTs/IBukNFTs.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";

contract Marketplace is Context, IMarketplace, AccessControl, Pausable {
    // Using safeERC20
    using SafeERC20 for IERC20;

    /**
     * @dev Constant for the role of the admin
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

    /// @dev Constant address Buk Event Protocol contract
    IBukEventProtocol private _bukEventProtocolContract;

    /// @dev Constant address Buk NFT contract
    IBukNFTs private _bukNFTContract;

    /// @dev Currency used for transaction
    IERC20 private _stableToken;

    /**
     * @dev mapping(uint256 => ListingDetails) _listedNFT  Captures listed bookings for sale
     */
    // FIXME - Update capture each contract listing
    mapping(uint256 => ListingDetails) private _listedNFT;

    /**
     * @dev Constructor to initialize the contract
     * @param _bukProtocolAddress address of Buk protocol
     * @param _bukNFTAddress address of Buk NFT
     * @param _tokenAddress address of the stable token
     */
    constructor(
        address _bukProtocolAddress,
        address _bukNFTAddress,
        address _tokenAddress
    ) {
        _setStableToken(_tokenAddress);
        _setBukEventProtocol(_bukProtocolAddress);
        _setBukNFT(_bukNFTAddress);

        // Updating permission
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /// @dev See {IMarketplace-pause}.
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /// @dev See {IMarketplace-unpause}.
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /// @dev Refer {IMarketplace-createListing}.
    function createListing(
        address _eventAddress,
        uint256 _tokenId,
        uint256 _price
    ) external whenNotPaused {
        // FIXME - Update this later
        require(
            !isBookingListed(_eventAddress, _tokenId),
            "NFT already listed"
        );
        IBukEventProtocol.Booking
            memory bookingDetails = _bukEventProtocolContract
                .getEventBookingDetails(_eventAddress, _tokenId);
        require(
            bookingDetails.status ==
                IBukEventProtocol.BookingStatus.confirmed &&
                bookingDetails.tradeable,
            "Only tradable if available"
        );
        // FIXME - Validate NFT owner or Buk protocol
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can list"
        );
        // FIXME - Validate NFT owner or Buk protocol
        require(
            _bukNFTContract.isApprovedForAll(_msgSender(), address(this)),
            "Approve marketplace for trade"
        );
        bool isTradeable = _bukEventProtocolContract.isBookingTradeable(
            _eventAddress,
            _tokenId
        );
        require(isTradeable, "Trade limit time crossed");
        // FIXME - Update this later
        _listedNFT[_tokenId] = ListingDetails(
            _eventAddress,
            _price,
            _msgSender(),
            _listedNFT[_tokenId].index + 1,
            ListingStatus.active
        );

        emit ListingCreated(_eventAddress, _msgSender(), _tokenId, _price);
    }

    /// @dev Refer {IMarketplace-deleteListing}.
    function deleteListing(
        address _eventAddress,
        uint256 _tokenId
    ) external whenNotPaused {
        // FIXME - Update this later
        require(isBookingListed(_eventAddress, _tokenId), "NFT not listed");

        // FIXME - Validate NFT owner or Buk protocol
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1 ||
                hasRole(BUK_PROTOCOL_ROLE, _msgSender()),
            "Owner or Buk protocol can delete"
        );
        uint256 listingIndex = _listedNFT[_tokenId].index;
        delete _listedNFT[_tokenId];
        _listedNFT[_tokenId].index = listingIndex + 1;
        emit DeletedListing(_eventAddress, _tokenId);
    }

    /// @dev Refer {IMarketplace-relist}.
    function relist(
        address _eventAddress,
        uint256 _tokenId,
        uint256 _newPrice
    ) external whenNotPaused {
        // FIXME - Update this later
        require(isBookingListed(_eventAddress, _tokenId), "NFT not listed");
        IBukEventProtocol.Booking
            memory bookingDetails = _bukEventProtocolContract
                .getEventBookingDetails(_eventAddress, _tokenId);
        // FIXME - Validate NFT owner or Buk protocol
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can relist"
        );
        require(
            bookingDetails.status == IBukEventProtocol.BookingStatus.confirmed,
            "Tradeable if available"
        );
        uint256 oldPrice = _listedNFT[_tokenId].price;
        _listedNFT[_tokenId].status = ListingStatus.active;
        _listedNFT[_tokenId].price = _newPrice;
        _listedNFT[_tokenId].index = _listedNFT[_tokenId].index + 1;
        emit Relisted(_eventAddress, _tokenId, oldPrice, _newPrice);
    }

    /// @dev Refer {IMarketplace-buy}.
    function buy(
        address _eventAddress,
        uint256 _tokenId
    ) external whenNotPaused {
        require(
            _listedNFT[_tokenId].status == ListingStatus.active,
            "NFT not listed"
        );
        _buy(_eventAddress, _tokenId);
    }

    /// @dev Refer {IMarketplace-buyBatch}.
    function buyBatch(
        address _eventAddress,
        uint256[] calldata _tokenIds
    ) external whenNotPaused {
        uint256 len = _tokenIds.length;
        for (uint256 i = 0; i < len; ) {
            require(
                _listedNFT[_tokenIds[i]].status == ListingStatus.active,
                "NFT not listed"
            );
            _buy(_eventAddress, _tokenIds[i]);
            unchecked {
                i += 1;
            }
        }
    }

    /// @dev Refer {IMarketplace-setBukEventProtocol}.
    function setBukEventProtocol(
        address _bukProtocol
    ) external onlyRole(ADMIN_ROLE) {
        _setBukEventProtocol(_bukProtocol);
    }

    /// @dev Refer {IMarketplace-setBukNFT}.
    function setBukNFT(address _bukNFT) external onlyRole(ADMIN_ROLE) {
        _setBukNFT(_bukNFT);
    }

    /// @dev Refer {IMarketplace-setStableToken}.
    function setStableToken(
        address _tokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        _setStableToken(_tokenAddress);
    }

    /// @dev Refer {IMarketplace-getStableToken}.
    function getStableToken() external view returns (address) {
        return address(_stableToken);
    }

    /// @dev Refer {IMarketplace-getBukEventProtocol}.
    function getBukEventProtocol() external view returns (address) {
        return address(_bukEventProtocolContract);
    }

    /// @dev Refer {IMarketplace-getBukNFT}.
    function getBukNFT() external view returns (address) {
        return address(_bukNFTContract);
    }

    /// @dev Refer {IMarketplace-getListingDetails}.
    function getListingDetails(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (ListingDetails memory) {
        return _listedNFT[_tokenId];
    }

    /// @dev Refer {IMarketplace-isBookingListed}.
    function isBookingListed(
        address _eventAddress,
        uint256 _tokenId
    ) public view returns (bool) {
        return _listedNFT[_tokenId].price > 0 ? true : false;
    }

    /// @dev Function sets new Buk NFT address
    function _setBukNFT(address _bukNFT) private {
        require(_bukNFT != address(0), "Invalid address");
        _bukNFTContract = IBukNFTs(_bukNFT);

        emit BukNFTSet(_bukNFT);
    }

    /**
     * @dev Function sets new Buk protocol address
     * @param _bukProtocol New Buk protocol address
     */
    function _setBukEventProtocol(address _bukProtocol) private {
        require(_bukProtocol != address(0), "Invalid address");
        address oldAddress = address(_bukEventProtocolContract);
        _bukEventProtocolContract = IBukEventProtocol(_bukProtocol);

        _grantRole(BUK_PROTOCOL_ROLE, address(_bukProtocol));
        _revokeRole(BUK_PROTOCOL_ROLE, address(oldAddress));

        emit BukEventProtocolSet(_bukProtocol);
    }

    /// @param _tokenAddress New stable token address
    function _setStableToken(address _tokenAddress) private {
        require(_tokenAddress != address(0), "Invalid address");
        _stableToken = IERC20(_tokenAddress);

        emit StableTokenSet(_tokenAddress);
    }

    /**
     * @dev Safe transfer NFT/Booking to buyer and transfer the price to owner wallet and buk treasury
     * @dev Transfer sale price and royalties
     * @param _tokenId, NFT/Booking ID
     */
    function _buy(address _eventAddress, uint256 _tokenId) private {
        // FIXME - Update this later
        // IBukEventProtocol.Booking memory bookingDetails = _bukEventProtocolContract
        //     .getEventBookingDetails(_tokenId);
        // require(
        //     bookingDetails.status ==
        //         IBukEventProtocol.BookingStatus.confirmed &&
        //         bookingDetails.tradeable,
        //     "Tradeable if available"
        // );
        // require(
        //     block.timestamp <
        //         (bookingDetails.start - (bookingDetails.tradeTimeLimit * 3600)),
        //     "Trade limit time crossed"
        // );
        require(
            (_stableToken.allowance(_msgSender(), address(this)) >=
                _listedNFT[_tokenId].price),
            "Check the allowance"
        );
        address nftOwner = _listedNFT[_tokenId].owner;
        uint256 totalPrice = _listedNFT[_tokenId].price;
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
        uint256 listingIndex = _listedNFT[_tokenId].index;
        delete _listedNFT[_tokenId];
        _listedNFT[_tokenId].index = listingIndex + 1;
        emit ListingBought(
            _eventAddress,
            _tokenId,
            nftOwner,
            _msgSender(),
            totalPrice
        );
    }
}
