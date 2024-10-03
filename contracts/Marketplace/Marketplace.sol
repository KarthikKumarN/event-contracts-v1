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

    /// @dev Constant address Buk Event Protocol contract
    IBukEventProtocol private _bukEventProtocolContract;

    /// @dev Currency used for transaction
    IERC20 private _stableToken;

    /**
     * @dev Mapping of event contract address to Listing.
     * @dev Each event address maps to another mapping, which maps token ID to listing.
     * @dev mapping(uint256 => ListingDetails) _listedNFT  Captures listed bookings for sale for each event contracts
     */
    mapping(address => mapping(uint256 => ListingDetails)) private _listedNFT; // eventAddress -> (tokenID -> ListingDetails)

    /**
     * @dev Constructor to initialize the contract
     * @param _bukEventProtocolAddress address of Buk protocol
     * @param _tokenAddress address of the stable token
     */
    constructor(address _bukEventProtocolAddress, address _tokenAddress) {
        _setStableToken(_tokenAddress);
        _setBukEventProtocol(_bukEventProtocolAddress);

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
        require(address(_eventAddress) != address(0), "Invalid event address");
        require(
            !isBookingListed(_eventAddress, _tokenId),
            "NFT already listed"
        );
        IBukNFTs nftContract = IBukNFTs(_eventAddress);
        require(
            nftContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can list"
        );
        require(
            nftContract.isApprovedForAll(_msgSender(), address(this)),
            "Approve marketplace for trade"
        );
        bool isTradeable = _bukEventProtocolContract.isBookingTradeable(
            _eventAddress,
            _tokenId
        );
        require(isTradeable, "Non tradeable NFT");
        _listedNFT[_eventAddress][_tokenId] = ListingDetails(
            _eventAddress,
            _price,
            _msgSender(),
            _listedNFT[_eventAddress][_tokenId].index + 1,
            ListingStatus.active
        );

        emit ListingCreated(_eventAddress, _tokenId, _msgSender(), _price);
    }

    /// @dev Refer {IMarketplace-deleteListing}.
    function deleteListing(
        address _eventAddress,
        uint256 _tokenId
    ) external whenNotPaused {
        require(isBookingListed(_eventAddress, _tokenId), "NFT not listed");

        IBukNFTs nftContract = IBukNFTs(_eventAddress);
        require(
            nftContract.balanceOf(_msgSender(), _tokenId) == 1 ||
                hasRole(ADMIN_ROLE, _msgSender()),
            "Owner or Admin can delete"
        );
        uint256 listingIndex = _listedNFT[_eventAddress][_tokenId].index;
        delete _listedNFT[_eventAddress][_tokenId];
        _listedNFT[_eventAddress][_tokenId].index = listingIndex + 1;
        emit DeletedListing(_eventAddress, _tokenId);
    }

    /// @dev Refer {IMarketplace-relist}.
    function relist(
        address _eventAddress,
        uint256 _tokenId,
        uint256 _newPrice
    ) external whenNotPaused {
        require(isBookingListed(_eventAddress, _tokenId), "NFT not listed");
        IBukNFTs nftContract = IBukNFTs(_eventAddress);
        require(
            nftContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can relist"
        );
        bool isTradeable = _bukEventProtocolContract.isBookingTradeable(
            _eventAddress,
            _tokenId
        );
        require(isTradeable, "Non tradeable NFT");
        _listedNFT[_eventAddress][_tokenId].status = ListingStatus.active;
        _listedNFT[_eventAddress][_tokenId].price = _newPrice;
        _listedNFT[_eventAddress][_tokenId].index =
            _listedNFT[_eventAddress][_tokenId].index +
            1;
        emit Relisted(_eventAddress, _tokenId, _newPrice);
    }

    /// @dev Refer {IMarketplace-buy}.
    function buy(
        address _eventAddress,
        uint256 _tokenId
    ) external whenNotPaused {
        require(
            _listedNFT[_eventAddress][_tokenId].status == ListingStatus.active,
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
                _listedNFT[_eventAddress][_tokenIds[i]].status ==
                    ListingStatus.active,
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

    /// @dev Refer {IMarketplace-getListingDetails}.
    function getListingDetails(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (ListingDetails memory) {
        return _listedNFT[_eventAddress][_tokenId];
    }

    /// @dev Refer {IMarketplace-isBookingListed}.
    function isBookingListed(
        address _eventAddress,
        uint256 _tokenId
    ) public view returns (bool) {
        return _listedNFT[_eventAddress][_tokenId].price > 0 ? true : false;
    }

    /**
     * @dev Function sets new Buk protocol address
     * @param _bukProtocol New Buk protocol address
     */
    function _setBukEventProtocol(address _bukProtocol) private {
        require(_bukProtocol != address(0), "Invalid address");
        _bukEventProtocolContract = IBukEventProtocol(_bukProtocol);

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
        IBukNFTs nftContract = IBukNFTs(_eventAddress);
        bool isTradeable = _bukEventProtocolContract.isBookingTradeable(
            _eventAddress,
            _tokenId
        );
        require(isTradeable, "Non tradeable NFT");

        require(
            (_stableToken.allowance(_msgSender(), address(this)) >=
                _listedNFT[_eventAddress][_tokenId].price),
            "Check the allowance"
        );

        address nftOwner = _listedNFT[_eventAddress][_tokenId].owner;
        uint256 totalPrice = _listedNFT[_eventAddress][_tokenId].price;
        require(
            nftContract.balanceOf(nftOwner, _tokenId) == 1,
            "NFT owner mismatch"
        );
        // FIXME - Verify this details
        (address royaltyAddress, uint256 royaltyAmount) = nftContract
            .royaltyInfo(_tokenId, _listedNFT[_eventAddress][_tokenId].price);

        _stableToken.safeTransferFrom(
            _msgSender(),
            royaltyAddress,
            royaltyAmount
        );
        _stableToken.safeTransferFrom(
            _msgSender(),
            nftOwner,
            _listedNFT[_eventAddress][_tokenId].price - royaltyAmount
        );
        nftContract.safeTransferFrom(
            address(nftOwner),
            _msgSender(),
            _tokenId,
            1,
            ""
        );
        uint256 listingIndex = _listedNFT[_eventAddress][_tokenId].index;
        delete _listedNFT[_eventAddress][_tokenId];
        _listedNFT[_eventAddress][_tokenId].index = listingIndex + 1;
        emit ListingBought(_eventAddress, _tokenId, _msgSender(), totalPrice);
    }
}
