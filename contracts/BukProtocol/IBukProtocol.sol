// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukProtocol {
    /**
     * @dev Enum for booking statuses.
     * @var BookingStatus.nil         Booking has not yet been initiated.
     * @var BookingStatus.booked      Booking has been initiated but not yet confirmed.
     * @var BookingStatus.confirmed   Booking has been confirmed.
     * @var BookingStatus.cancelled   Booking has been cancelled.
     * @var BookingStatus.expired     Booking has expired.
     */
    enum BookingStatus {
        nil,
        booked,
        confirmed,
        cancelled,
        checkedin,
        checkedout
    }

    /**
     * @dev Struct for booking details.
     * @var uint256 id                Booking ID.
     * @var BookingStatus status      Booking status.
     * @var uint256 tokenID           Token ID.
     * @var address owner             Address of the booking owner.
     * @var uint256 checkin           Check-in date.
     * @var uint256 checkout          Check-out date.
     * @var uint256 total             Total price.
     * @var uint256 baseRate          Base rate.
     * @var uint256 minSalePrice      Min Sale Price.
     * @var uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @var uint256 tradeable         Is the NFT .
     */
    struct Booking {
        uint256 id;
        BookingStatus status;
        uint256 tokenID;
        address firstOwner;
        uint256 checkin;
        uint256 checkout;
        uint256 total;
        uint256 baseRate;
        uint256 minSalePrice;
        uint256 tradeTimeLimit;
        bool tradeable;
    }

    /**
     * @dev Struct named Royalty to store royalty information.
     * @var address receiver           The address of the receiver who will receive the royalty
     * @var uint96 royaltyFraction     The fraction of the royalty to be paid, expressed as an unsigned 96-bit integer
     */
    struct Royalty {
        address receiver;
        uint96 royaltyFraction;
    }

    /**
     * @dev Emitted when the commission is set.
     */

    event SetCommission(uint256 indexed commission);
    /**
     * @dev Emitted when Buk Protocol role access is granted for NFT and PoS contracts
     */

    event GrantBukProtocolRole(
        address indexed oldAddress,
        address indexed newAddress
    );

    /**
     * @dev Emitted when token uri is set.
     */
    event SetTokenURI(uint256 indexed nftId, string indexed uri);

    /**
     * @dev Emitted when currency is updated.
     */
    event SetCurrency(address indexed _currencyContract);

    /**
     * @dev Emitted when BukNFTs contract address is updated.
     */
    event SetBukNFTs(address indexed _nftContractAddr);

    /**
     * @dev Emitted when BukPOSNFTs contract address is updated.
     */
    event SetBukPoSNFTs(address indexed _nftPoSContractAddr);

    /**
     * @dev Emitted when treasury is updated.
     */
    event SetTreasury(address indexed treasuryContract);

    /**
     * @dev Emitted when new Buk royalty has been updated
     * @param oldRoyalty, old buk royalty
     * @param newRoyalty, new buk royalty
     */
    event SetBukRoyalty(uint8 oldRoyalty, uint8 newRoyalty);

    /**
     * @dev Emitted when new hotel royalty has been updated
     * @param oldRoyalty, old hotel royalty
     * @param newRoyalty, new hotel royalty
     */
    event SetHotelRoyalty(uint8 oldRoyalty, uint8 newRoyalty);

    /**
     * @dev Emitted when single room is booked.
     */
    event BookRoom(uint256 indexed booking);

    /**
     * @dev Emitted when multiple rooms are booked together.
     */
    event BookRooms(
        uint256[] indexed bookings,
        uint256 indexed total,
        uint256 indexed commission
    );

    /**
     * @dev Emitted when booking refund is done.
     */
    event BookingRefund(uint256 indexed total, address indexed owner);

    /**
     * @dev Emitted when room bookings are confirmed.
     */
    event MintBookingNFT(uint256[] indexed bookings, bool indexed status);

    /**
     * @dev Emitted when room bookings are checked in.
     */
    event CheckinRooms(uint256[] indexed bookings, bool indexed status);

    /**
     * @dev Emitted when room bookings are checked out.
     */
    event CheckoutRooms(uint256[] indexed bookings, bool indexed status);
    /**
     * @dev Emitted when room bookings are cancelled.
     */
    event CancelRoom(uint256 indexed booking, bool indexed status);

    /**
     * @dev Event to update the contract name
     */
    event UpdateContractName(string indexed contractName);

    /**
    * @dev Function to update the treasury address.
    * @param _bukTreasuryContract Address of the treasury.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setTreasury(address _bukTreasuryContract) external;

    /**
    * @dev Function to update the currency address.
    * @param _currencyContract Address of the currency contract.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setCurrency(address _currencyContract) external;

    /**
    * @dev Function to update the BukNFTs contract address.
    * @param _nftContractAddr Address of the BukNFTs contract.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setBukNFTs(address _nftContractAddr) external;

    /**
    * @dev Function to update the BukPOSNFTs contract address.
    * @param _nftPoSContractAddr Address of the BukPOSNFTs contract.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setBukPoSNFTs(address _nftPoSContractAddr) external;

    /**
    * @dev Function to update the token uri.
    * @param _tokenId Token Id.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setTokenUri(uint _tokenId, string memory _newUri) external;

    /**
    * @dev Function to define the royalties.
    * @param _recipients Array of recipients of royalties
    * @param _royaltyFractions Array of percentages for each recipients in the _recipients[] order.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setOtherRoyaltyInfo(
        address[] memory _recipients,
        uint96[] memory _royaltyFractions
    ) external;

    /**
    * @dev Function to define the royalty Fraction for Buk.
    * @param _royaltyFraction Royalty Fraction.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setBukRoyaltyInfo(uint96 _royaltyFraction) external;

    /**
    * @dev Function to define the royalty Fraction for Hotel.
    * @param _royaltyFraction Royalty Fraction.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setHotelRoyaltyInfo(uint96 _royaltyFraction) external;

    /**
    * @dev Function to define the royalty Fraction for the First Owners.
    * @param _royaltyFraction Royalty Fraction.
    * @notice This function can only be called by `ADMIN_ROLE`
    */
    function setFirstOwnerRoyaltyInfo(uint96 _royaltyFraction) external;

    /**
     * @dev Update the name of the contract.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
     */
    function updateNFTName(string memory _contractName) external;

    /**
     * @dev Function to set the Buk commission percentage.
     * @param _commission Commission percentage.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setCommission(uint8 _commission) external;

    /**
     * @dev Function to book rooms.
     * @param _count Number of rooms to be booked.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @param _tradeTimeLimit Trade Limit of NFT based on Checkin time.
     * @param _tradeable Is the booking NFT tradeable.
     * @return ids IDs of the bookings.
     */
    function bookRoom(
        uint256 _count,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external returns (bool);

    /**
     * @dev Function to refund the amount for the failure scenarios.
     * @param _ids IDs of the bookings.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function bookingRefund(uint256[] memory _ids, address _owner) external;

    /**
     * @dev Function to confirm the room bookings and mint NFT.
     * @param _ids IDs of the bookings.
     * @param _uri URIs of the NFTs.
     * @notice Only the owner of the booking can confirm the rooms.
     * @notice The number of bookings and URIs should be same.
     * @notice The booking status should be booked to confirm it.
     * @notice The NFTs are minted to the owner of the booking.
     */
    function mintBukNFT(
        uint256[] memory _ids,
        string[] memory _uri
    ) external;

    /**
     * @dev Function to checkin the rooms.
     * @param _ids IDs of the bookings.
     * @notice The booking status should be confirmed to checkin it.
     * @notice Once checkedin the NFT becomes non-tradeable.
     * @notice This function can only be called by `ADMIN_ROLE` or the owner of the booking NFT
     */
    function checkin(uint256[] memory _ids) external;

    /**
     * @dev Function to checkout the rooms.
     * @param _ids IDs of the bookings.
     * @notice Only the admin can checkout the rooms.
     * @notice The booking status should be checkedin to checkout it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice The Utility NFTs are minted to the owner of the booking.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function checkout(uint256[] memory _ids) external;

    /**
     * @dev Function to cancel the room bookings.
     * @param _id ID of the booking.
     * @param _penalty Penalty amount to be refunded.
     * @param _refund Refund amount to be refunded.
     * @param _charges Charges amount to be refunded.
     * @notice Only the admin can cancel the rooms.
     * @notice The booking status should be confirmed to cancel it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function cancelRoom(
        uint256 _id,
        uint256 _penalty,
        uint256 _refund,
        uint256 _charges
    ) external;

    /**
     * @dev To get the booking details
     * @param _tokenId ID of the booking.
     */
    function getBookingDetails(uint256 _tokenId) external view returns (Booking memory);

    /**
     * @dev Function to retrieve royalty information.
     * @param _tokenId ID of the token
     * @notice Token ID and Booking ID are same.
     */
    function getRoyaltyInfo(uint256 _tokenId) external view returns (Royalty[] memory);
}
