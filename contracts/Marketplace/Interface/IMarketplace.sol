// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title Interface to define the buk marketplace
 * @author Buk.technology
 * @dev Collection of all procedures related to the marketplace
 */
interface IMarketplace {
    /**
     * @title Struct to define the booking/room listing details
     * @param price, price of room/booking
     * @param status, status of listing
     */
    struct ListingDetails {
        uint256 price;
        address owner;
        ListingStatus status;
    }

    /**
     * @dev Enum for listing statuses.
     * @var ListingStatus.active      Listing has been active.
     * @var ListingStatus.inactive   Listing has been inactive
     * @var ListingStatus.sold   Listing has been sold
     */
    enum ListingStatus {
        active,
        inactive,
        sold
    }

    /**
     * @dev Emitted when room/booking NFT bought
     * @param previousOwner, Address of the previous owner
     * @param newOwner, Address of the new owner
     * @param tokenId, TokenId of the bought booking
     * @param price, Price of the bought booking
     */
    event RoomBought(
        address indexed previousOwner,
        address indexed newOwner,
        uint256 tokenId,
        uint256 price
    );

    /**
     * @dev Emitted when a room/booking NFT is listed
     * @param owner, Address of the initial owner
     * @param tokenId, tokenId is the unique identifier of booking NFT
     * @param price, Price of room/booking
     */
    event ListingCreated(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 price
    );

    /**
     * @dev Emitted when an booking/room NFT is relisted
     * @param tokenId, unique number of the booking NFT
     * @param oldPrice, old price of the room/booking
     * @param newPrice, new price of the room/booking
     */
    event Relisted(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Emitted when an booking/room is delisted
     * @dev Updates status to ListingStatus.inactive
     * @param tokenId, unique number of the booking NFT
     */
    event Delisted(uint256 indexed tokenId);

    /**
     * @dev Emitted when an booking/room is deleted from list
     * @param tokenId, unique number of the booking NFT
     */
    event DeletedListing(uint256 indexed tokenId);

    /**
     * @dev Emitted when new BukProtocol address has been updated
     * @param oldAddress, Address of the old bukProtocol
     * @param newAddress, Address of the new bukProtocol
     */
    event BukProtocolSet(address oldAddress, address newAddress);

    /**
     * @dev Emitted when new BukNFT address has been updated
     * @param oldAddress, Address of the old bukNFT
     * @param newAddress, Address of the new bukNFT
     */
    event BukNFTSet(address oldAddress, address newAddress);

    /**
     * @dev Function will create a listing of Booking/Room NFT
     * @notice Only NFT owner can list
     * @param _tokenId room/booking NFT id
     * @param _price  Sale price of room/booking
     * @notice While listing will approve marketplace to excecute transfer
     */
    function createListing(uint256 _tokenId, uint256 _price) external;

    /**
     * @dev Function will delist of NFT
     * @dev NFT owner can delist
     * @param _tokenId NFT id
     */
    function delist(uint256 _tokenId) external;

    /**
     * @dev Function will delete listing
     * @dev NFT owner or BukProtocol can delete lisitng
     * @notice When user checkin, Buk protocol can call this function
     * @param _tokenId NFT id
     */
    function deleteListing(uint256 _tokenId) external;

    /**
     * @dev Function will set price and status for listed of NFT
     * @dev Only NFT owner can update
     * @param _tokenId NFT id
     * @param _newPrice New price for NFT/Room
     */
    function relist(uint256 _tokenId, uint256 _newPrice) external;

    /**
     * @dev Function will enble user to buy this room/booking NFT
     * @param _tokenId room/booking NFT id
     * @dev Gets royalty details from BUK NFT and transfer the royalties
     * @dev Owner should have approved marketplace to transfer its booking
     * @dev Buyer should have approved marketplace to transfer its ERC20 tokens to pay price and fees
     * @dev Only Marketplace contract can excecute transfer
     * @dev Buy will excecute only if, tradeLimitTime is not crossed and in active status and not checkedin bookings
     * @dev Will delete a entry once bought
     */
    function buyRoom(uint256 _tokenId) external;

    /**
     * @dev Function will set new buk protocol address
     * @param _bukProtocol address of new buk protocol
     */
    function setBukProtocol(address _bukProtocol) external;

    /**
     * @dev Function will set new buk NFT address
     * @param _bukNFT address of new buk protocol
     */
    function setBukNFT(address _bukNFT) external;

    /**
     * @dev Function will set new stable token address
     * @param _tokenAddress address of new token address
     * @notice This token is used for transaction to make payments
     */
    function setStableToken(address _tokenAddress) external;

    /**
     * @dev Gets stable token address
     * @return address, Address of the stable token contract
     */
    function getStableToken() external view returns (address);

    /**
     * @dev Gets current buk protocol address
     * @return address, Address of the buk protocol contract
     */
    function getBukProtocol() external view returns (address);

    /**
     * @dev Gets current buk NFT address
     * @return address, Address of the buk NFT contract
     */
    function getBukNFT() external view returns (address);

    /**
     * @dev Function will provide Lisiting details of booking
     * @param _tokenId room/booking NFT id
     */
    function getListingDetails(
        uint256 _tokenId
    ) external view returns (ListingDetails calldata);

    /**
     * @dev Function check is NFT/Booking listed
     * @param _tokenId TokenID of booking
     */
    function isBookingListed(uint256 _tokenId) external view returns (bool);
}
