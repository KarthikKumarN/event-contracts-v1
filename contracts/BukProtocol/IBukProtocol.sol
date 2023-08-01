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
        expired
    }

    /**
     * @dev Struct for booking details.
     * @var uint256 id                Booking ID.
     * @var BookingStatus status      Booking status.
     * @var uint256 tokenID           Token ID.
     * @var address owner             Address of the booking owner.
     * @var uint256 checkin          Check-in date.
     * @var uint256 checkout          Check-out date.
     * @var uint256 total             Total price.
     * @var uint256 baseRate          Base rate.
     */
    struct Booking {
        uint256 id;
        BookingStatus status;
        uint256 tokenID;
        address owner;
        uint256 checkin;
        uint256 checkout;
        uint256 total;
        uint256 baseRate;
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
     * @dev Emitted when treasury is updated.
     */
    event SetTreasury(address indexed treasuryContract);

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
    * @param bukTreasury Address of the treasury.
    */
    function setTreasury(address bukTreasury) external;

    /**
    * @dev Function to update the token uri.
    * @param _tokenId Token Id.
    */
    function setTokenUri(uint _tokenId, string memory _newUri) external;

    /**
    * @dev Function to define the royalties.
    * @param _recipients Array of recipients of royalties
    * @param _percentages Array of percentages for each recipients in the _recipients[] order.
    */
    function setRoyaltyInfo(
        address[] memory _recipients,
        uint96[] memory _percentages
    ) external;

    /**
     * @dev Update the name of the contract.
     * @notice This function can only be called by addresses with `UPDATE_CONTRACT_ROLE`
     */
    function updateNFTName(string memory _contractName) external;

    /**
     * @dev Function to grant the BUK Protocol role access to NFT and PoS contracts
     * @param _newBukProtocol address: New Buk Protocol contract of the Buk NFTs
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function grantBukProtocolRole(address _newBukProtocol) external;

    /**
     * @dev Function to set the Buk commission percentage.
     * @param _commission Commission percentage.
     */
    function setCommission(uint8 _commission) external;

    /**
     * @dev Function to book rooms.
     * @param _count Number of rooms to be booked.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @return ids IDs of the bookings.
     */
    function bookRoom(
        uint256 _count,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256 _checkin,
        uint256 _checkout
    ) external returns (bool);

    /**
     * @dev Function to refund the amount for the failure scenarios.
     * @param _ids IDs of the bookings.
     */
    function bookingRefund(uint256[] memory _ids, address _owner) external;

    /**
     * @dev Function to confirm the room bookings.
     * @param _ids IDs of the bookings.
     * @param _uri URIs of the NFTs.
     * @param _status Status of the NFT.
     * @notice Only the owner of the booking can confirm the rooms.
     * @notice The number of bookings and URIs should be same.
     * @notice The booking status should be booked to confirm it.
     * @notice The NFTs are minted to the owner of the booking.
     */
    function confirmRoom(
        uint256[] memory _ids,
        string[] memory _uri,
        bool _status
    ) external;

    /**
     * @dev Function to checkout the rooms.
     * @param _ids IDs of the bookings.
     * @notice Only the admin can checkout the rooms.
     * @notice The booking status should be confirmed to checkout it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice The Utility NFTs are minted to the owner of the booking.
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
     */
    function cancelRoom(
        uint256 _id,
        uint256 _penalty,
        uint256 _refund,
        uint256 _charges
    ) external;

    /**
     * @dev Function to retrieve royalty information.
     */
    function getRoyaltyInfo() external view returns (Royalty[] memory);
}
