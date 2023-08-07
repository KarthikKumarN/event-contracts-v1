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
    IToken private _stableToken;

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
     * @param _tokenId room/booking NFT id
     * @param _price  Sale price of room/booking
     * @dev While listing will approve marketplace to excecute transfer
     */
    function createListing(uint256 _tokenId, uint256 _price) external {
        require(!isBookingListed(_tokenId), "NFT already listed");
        require(
            _price >= _bukProtocalContract.getBookingDetails(_tokenId).baseRate,
            "Sale price cann't be lessthan base price"
        );
        require(
            _bukProtocalContract.getBookingDetails(_tokenId).status ==
                IBukProtocol.BookingStatus.confirmed,
            "Only confirmed can be tradable"
        );
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can list"
        );
        require(
            block.timestamp <
                (_bukProtocalContract.getBookingDetails(_tokenId).checkin -
                    (_bukProtocalContract
                        .getBookingDetails(_tokenId)
                        .tradeTimeLimit * 3600)),
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
     * @dev Only NFT owner can delist
     * @param _tokenId NFT id
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
     * @param _tokenId NFT id
     */
    function deleteListing(uint256 _tokenId) external {
        require(isBookingListed(_tokenId), "NFT not listed");
        require(
            _bukNFTContract.balanceOf(_msgSender(), _tokenId) == 1,
            "Only owner can delist"
        );
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        delete _listedNFT[_tokenId];
        emit DeletedListing(_tokenId);
    }

    /**
     * @dev Refer {IMarketplace-relist}.
     * @dev Only NFT owner can update
     * @param _tokenId NFT id
     */
    function relist(uint256 _tokenId, uint256 _newPrice) external {
        require(isBookingListed(_tokenId), "NFT not listed");
        // TODO
        // Get booking details form bukprotocol
        // Validate owner, status
        uint256 oldPrice = _listedNFT[_tokenId].price;
        _listedNFT[_tokenId].status = ListingStatus.active;
        _listedNFT[_tokenId].price = _newPrice;
        emit Relisted(_tokenId, oldPrice, _newPrice);
    }

    /**
     * @dev Refer {IMarketplace-buyRoom}.
     * @param _tokenId room/booking NFT id
     */
    function buyRoom(uint256 _tokenId) external {
        require(
            _listedNFT[_tokenId].status == ListingStatus.active,
            "NFT not listed"
        );
        require(
            _bukProtocalContract.getBookingDetails(_tokenId).status ==
                IBukProtocol.BookingStatus.confirmed,
            "Only availble booking can be tradable"
        );
        require(
            block.timestamp <
                (_bukProtocalContract.getBookingDetails(_tokenId).checkin -
                    (_bukProtocalContract
                        .getBookingDetails(_tokenId)
                        .tradeTimeLimit * 3600)),
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
        (address royaltyAddress, uint256 amount) = _bukNFTContract.royaltyInfo(
            _tokenId,
            _listedNFT[_tokenId].price
        );

        _stableToken.safeTransferFrom(_msgSender(), royaltyAddress, amount);
        _stableToken.safeTransferFrom(_msgSender(), nftOwner, amount);
        _bukNFTContract.safeTransferFrom(
            address(nftOwner),
            _msgSender(),
            _tokenId,
            1,
            ""
        );
    }

    /**
     * @dev Refer {IMarketplace-setBukProtocol}.
     * @param _bukProtocol address of new buk protocol
     */
    function setBukProtocol(
        address _bukProtocol
    ) external onlyRole(ADMIN_ROLE) {
        require(_bukProtocol != address(0), "Invalid address");
        address oldAddress = address(_bukProtocalContract);
        _bukProtocalContract = IBukProtocol(_bukProtocol);

        emit BukProtocolSet(oldAddress, _bukProtocol);
    }

    /**
     * @dev Refer {IMarketplace-setBukNFT}.
     * @param _bukNFT address of new buk protocol
     */
    function setBukNFT(address _bukNFT) external onlyRole(ADMIN_ROLE) {
        require(_bukNFT != address(0), "Invalid address");
        address oldAddress = address(_bukNFTContract);
        _bukNFTContract = IBukNFTs(_bukNFT);

        emit BukNFTSet(oldAddress, _bukNFT);
    }

    /**
     * @dev Refer {IMarketplace-setStableToken}.
     * @param _tokenAddress address of new token
     */
    function setStableToken(
        address _tokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        require(_tokenAddress != address(0), "Invalid address");
        address oldAddress = address(_stableToken);
        _stableToken = IToken(_tokenAddress);

        emit BukNFTSet(oldAddress, _tokenAddress);
    }

    /**
     * @dev Refer {IMarketplace-getStableToken}.
     * @return address, Address of the stable token contract
     */
    function getStableToken() external view returns (address) {
        return address(_stableToken);
    }

    /**
     * @dev Refer {IMarketplace-getBukProtocol}.
     * @return address, Address of the buk protocol contract
     */
    function getBukProtocol() external view returns (address) {
        return address(_bukProtocalContract);
    }

    /**
     * @dev Refer {IMarketplace-getBukNFT}.
     * @return address, Address of the buk NFT contract
     */
    function getBukNFT() external view returns (address) {
        return address(_bukNFTContract);
    }

    /**
     * @dev Refer {IMarketplace-getListingDetails}.
     * @dev Function will provide Lisiting details of booking
     * @param _tokenId room/booking NFT id
     */
    function getListingDetails(
        uint256 _tokenId
    ) external view returns (ListingDetails memory) {
        return _listedNFT[_tokenId];
    }

    /**
     * @dev Refer {IMarketplace-isBookingListed}.
     * @dev Function check is NFT/Booking exists/listed
     * @param _tokenId TokenID of booking
     */
    function isBookingListed(uint256 _tokenId) public view returns (bool) {
        return _listedNFT[_tokenId].price > 0 ? true : false;
    }
}
