// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title Interface to define the BUK marketplace
 * @author Buk.technology
 * @dev Collection of all procedures related to the marketplace
 */
interface IMarketplace {
    /**
     * @title Struct to define the booking/room listing details
     * @param price, price of room/booking
     * @param owner, Owner of room/booking
     * @param status, status of listing
     */
    struct ListingDetails {
        uint256 price;
        address owner;
        ListingStatus status;
    }

    /**
     * @dev Enum for listing statuses.
     * @var ListingStatus.active     Listing has been active.
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
     * @param tokenId, TokenId of the bought booking
     * @param previousOwner, Address of the previous owner
     * @param newOwner, Address of the new owner
     * @param price, Price of the bought booking
     */
    event RoomBought(
        uint256 tokenId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 price
    );

    /**
     * @dev Emitted when a room/booking NFT is listed for sale
     * @param owner, Address of the initial owner
     * @param tokenId, tokenId is the unique identifier of booking NFT
     * @param price, Sale price of room/booking
     */
    event ListingCreated(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 price
    );

    /**
     * @dev Emitted when an booking/room NFT is relisted
     * @param tokenId, unique ID of the booking NFT
     * @param oldPrice, old price of the room/booking
     * @param newPrice, new price of the room/booking
     */
    event Relisted(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Emitted when an booking/room is delisted
     * @dev Updates status to ListingStatus.inactive
     * @param tokenId, unique ID of the booking NFT
     */
    event Delisted(uint256 indexed tokenId);

    /**
     * @dev Emitted when an booking/room is deleted from list
     * @param tokenId, unique ID of the booking NFT
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
     * @dev Emitted when new Stable token address has been updated
     * @param oldAddress, Address of the old address
     * @param newAddress, Address of the new address
     */
    event StableTokenSet(address oldAddress, address newAddress);

    /**
     * @dev Function will create a listing of Booking/Room NFT
     * @notice Only NFT owner can list
     * @param _tokenId room/booking NFT id
     * @param _price  Sale price of room/booking
     * @notice Will validate with room has not been checkedin and tradable shuld be true
     * @notice Price shouldn't be lessthan minimum sale price
     * @notice Trade time limit hours not crossed. Ex:Only able to trade before 12 hours of checkin
     */
    function createListing(uint256 _tokenId, uint256 _price) external;

    /**
     * @dev Function will delist of NFT
     * @dev NFT owner can delist
     * @param _tokenId Unique ID
     */
    function delist(uint256 _tokenId) external;

    /**
     * @dev Function will delete listing
     * @dev NFT owner or BukProtocol can delete lisitng
     * @notice When user checkin, Buk protocol can call this function
     * @param _tokenId Unique ID
     */
    function deleteListing(uint256 _tokenId) external;

    /**
     * @dev Function will update price and status for listed NFT
     * @dev Only NFT owner can update
     * @param _tokenId Unique ID
     * @param _newPrice New price for NFT/Room
     */
    function relist(uint256 _tokenId, uint256 _newPrice) external;

    /**
     * @dev Function will enable user to buy this room/booking NFT
     * @param _tokenId room/booking NFT id
     * @dev Gets royalty details from BUK NFT and transfer the royalties
     * @dev NFT Owner should give approve marketplace to transfer booking
     * @dev Buyer should have approve marketplace to transfer its ERC20 tokens to pay price and royalties
     * @dev Only Marketplace contract can excecute transfer
     * @notice Buy will excecute only if, tradeLimitTime is not crossed and in active status and not checkedin bookings
     * @dev Will delete a entry once bought
     */
    function buyRoom(uint256 _tokenId) external;

    /**
     * @dev Function will set new BUK protocol address
     * @param _bukProtocol address of new BUK protocol
     */
    function setBukProtocol(address _bukProtocol) external;

    /**
     * @dev Function will set new BUK NFT address
     * @param _bukNFT address of new BUK protocol
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
     * @dev Gets current BUK protocol address
     * @return address, Address of the BUK protocol contract
     */
    function getBukProtocol() external view returns (address);

    /**
     * @dev Gets current BUK NFT address
     * @return address, Address of the BUK NFT contract
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
