// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title Interface to define the BUK Event marketplace
 * @author BUK Technology Inc
 * @dev Collection of all procedures related to the marketplace
 */
interface IMarketplace {
    /**
     * @title Struct to define the booking/room listing details
     * @param eventAddress Contract address of the Event/NFT.
     * @param price, Salling price of booking
     * @param owner, Owner of booking
     * @param status, status of listing
     */
    struct ListingDetails {
        address eventAddress;
        uint256 price;
        address owner;
        uint256 index;
        ListingStatus status;
    }

    /**
     * @dev Enum for listing statuses.
     * @var ListingStatus.inactive   Listing has been inactive
     * @var ListingStatus.active     Listing has been active.
     */
    enum ListingStatus {
        inactive,
        active
    }

    /**
     * @dev Emitted when booking NFT bought
     * @param eventAddress Contract address of the Event/NFT.
     * @param tokenId, TokenId of the bought booking
     * @param previousOwner, Address of the previous owner
     * @param newOwner, Address of the new owner
     * @param price, Price of the bought booking
     */
    event ListingBought(
        address eventAddress,
        uint256 indexed tokenId,
        address previousOwner,
        address newOwner,
        uint256 price
    );

    /**
     * @dev Emitted when a booking NFT is listed for sale
     * @param eventAddress Contract address of the Event/NFT.
     * @param tokenId, tokenId is the unique identifier of booking NFT
     * @param owner, Address of the initial owner
     * @param price, Sale price of booking
     */
    event ListingCreated(
        address eventAddress,
        uint256 indexed tokenId,
        address owner,
        uint256 price
    );

    /**
     * @dev Emitted when a booking NFT is relisted
     * @param eventAddress Contract address of the Event/NFT.
     * @param tokenId, unique ID of the booking NFT
     * @param newPrice, new price of the booking
     */
    event Relisted(
        address eventAddress,
        uint256 indexed tokenId,
        uint256 newPrice
    );

    /**
     * @dev Emitted when a booking is deleted from list
     * @param eventAddress Contract address of the Event/NFT.
     * @param tokenId, unique ID of the booking NFT
     */
    event DeletedListing(address eventAddress, uint256 indexed tokenId);

    /**
     * @dev Emitted when new BukEventProtocol address has been updated
     * @param newAddress, Address of the new bukProtocol
     */
    event BukEventProtocolSet(address newAddress);

    /**
     * @dev Emitted when new Stable token address has been updated
     * @param newAddress, Address of the new address
     */
    event StableTokenSet(address newAddress);

    /**
     * @dev Function to pause the contract.
     * @notice This function can only be called by admin
     */
    function pause() external;

    /**
     * @dev Function to unpause the contract.
     * @notice This function can only be called by admin
     */
    function unpause() external;

    /**
     * @dev Function will create a listing of Booking NFT
     * @dev Seller has to approve marketplace to execute transfer before listing
     * @notice Only NFT owner can list
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId booking NFT id
     * @param _price  Sale price of booking
     * @notice Will validate with booking has not been checkedin and tradable shuld be true
     * @notice Price shouldn't be lessthan minimum sale price
     * @notice Trade time limit hours not crossed. Ex:Only able to trade before 12 hours of checkin
     */
    function createListing(
        address _eventAddress,
        uint256 _tokenId,
        uint256 _price
    ) external;

    /**
     * @dev Function will delete listing
     * @dev NFT owner or BukEventProtocol can delete lisitng
     * @notice When user checkin, Buk protocol can call this function
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId Unique ID
     */
    function deleteListing(address _eventAddress, uint256 _tokenId) external;

    /**
     * @dev Function will update price and status for listed NFT
     * @dev Only NFT owner can update
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId Unique ID
     * @param _newPrice New price for NFT
     */
    function relist(
        address _eventAddress,
        uint256 _tokenId,
        uint256 _newPrice
    ) external;

    /**
     * @dev Function will enable user to buy this booking NFT
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId booking NFT id
     * @dev Gets royalty details from BUK NFT and transfer the royalties
     * @dev NFT Owner should give approve marketplace to transfer booking
     * @dev Buyer should have approve marketplace to transfer its ERC20 tokens to pay price and royalties
     * @dev Only Marketplace contract can excecute transfer
     * @notice Buy will excecute only if, tradeLimitTime is not crossed and in active status and not checkedin bookings
     * @notice Will delete a entry once bought
     */
    function buy(address _eventAddress, uint256 _tokenId) external;

    /**
     * @dev Function will enable user to buy multiple booking NFT
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId Array of booking NFT id's
     * @dev Bulk buy only for one event
     * @dev Gets royalty details from BUK NFT and transfer the royalties
     * @dev NFT Owner should give approve marketplace to transfer booking
     * @dev Buyer should have approve marketplace to transfer its ERC20 tokens to pay price and royalties
     * @dev Only Marketplace contract can excecute transfer
     * @notice Buy will excecute only if, tradeLimitTime is not crossed and in active status and not checkedin bookings
     * @notice Will delete a entry once bought
     */
    function buyBatch(
        address _eventAddress,
        uint256[] calldata _tokenId
    ) external;

    /**
     * @dev Function will set new BUK protocol address
     * @param _bukProtocol address of new BUK protocol
     */
    function setBukEventProtocol(address _bukProtocol) external;

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
    function getBukEventProtocol() external view returns (address);

    /**
     * @dev Function will provide Lisiting details of booking
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId room/booking NFT id
     */
    function getListingDetails(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (ListingDetails calldata);

    /**
     * @dev Function check is NFT/Booking listed
     * @param _eventAddress Contract address of the Event/NFT.
     * @param _tokenId TokenID of booking
     */
    function isBookingListed(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (bool);
}
