// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;
import {IBukRoyalties} from "../BukRoyalties/IBukRoyalties.sol";

/**
 * @title Interface to define the BUK protocol
 * @author BUK Technology Inc
 * @dev Collection of all procedures related to the BUK protocol
 * @dev This interface is used by the other child contract to interact with the BukProtocol contract.
 */
interface IBukProtocol {
    /**
     * @dev Enum for booking statuses.
     * @var BookingStatus.nil         Booking has not yet been initiated.
     * @var BookingStatus.booked      Booking has been initiated but not yet confirmed.
     * @var BookingStatus.confirmed   Booking has been confirmed.
     * @var BookingStatus.cancelled   Booking has been cancelled.
     * @var BookingStatus.checkedin   Booking has been checked-in.
     * @var BookingStatus.checkedout  Booking has been checked-out.
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
     * @param uint256 id                Booking ID.
     * @param BookingStatus status      Booking status.
     * @param uint256 tokenId           Token ID.
     * @param address owner             Address of the booking owner.
     * @param uint256 checkin           Check-in date.
     * @param uint256 checkout          Check-out date.
     * @param uint256 total             Total price.
     * @param uint256 baseRate          Base rate.
     * @param uint256 minSalePrice      Min Sale Price.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the NFT Tradeable.
     */
    struct Booking {
        uint256 id;
        BookingStatus status;
        uint256 tokenId;
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
     * @dev Emitted when the admin wallet is set.
     */
    event SetAdminWallet(address indexed oldCAdminWallet, address indexed newAdminWallet);

    /**
     * @dev Emitted when the commission is set.
     */
    event SetCommission(uint256 indexed oldCommission, uint256 indexed newCommission);

    /**
     * @dev Emitted when BukNFTs contract address is updated.
     */
    event SetBukNFTs(address indexed oldNftContract, address indexed newNftContract);

    /**
     * @dev Emitted when BukPOSNFTs contract address is updated.
     */
    event SetBukPoSNFTs(address indexed oldNftPoSContract, address indexed newNftPoSContract);

    /**
     * @dev Emitted when BukRoyalties contract address is updated.
     */
    event SetRoyaltiesContract(address indexed oldRoyaltiesContract, address indexed newRoyaltiesContract);
    
    /**
     * @dev Emitted when signer verifier is updated.
     */
    event SetSignerVerifier(address indexed oldSignerVerifier, address indexed newSignerVerifier);

    /**
     * @dev Emitted when Buk treasury is updated.
     */
    event SetBukTreasury(address indexed oldTreasuryContract, address indexed newTreasuryContract);

    /**
     * @dev Emitted when Buk Wallet is updated.
     */
    event SetBukWallet(address indexed oldBukWalletContract, address indexed newBukWalletContract);

    /**
     * @dev Emitted when stable token is updated.
     */
    event SetStableToken(address indexed oldStableToken, address indexed newStableToken);

    /**
     * @dev Emitted when the tradeability of a Buk NFT is toggled.
     * @param tokenId Token Id whose tradeability is being toggled.
     * @param tradeable Is the NFT tradeable.
     */
    event ToggleTradeability(uint256 indexed tokenId, bool tradeable);

    /**
     * @dev Emitted when single room is booked.
     */
    event BookRoom(uint256 indexed booking, uint256 checkin, uint256 checkout, uint256 total);

    /**
     * @dev Emitted when booking refund is done.
     */
    event BookingRefund(uint256 indexed total, address indexed owner);

    /**
     * @dev Emitted when room bookings are confirmed.
     */
    event MintedBookingNFT(uint256[] indexed bookings, bool indexed status);

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
    event CancelRoom(uint256 indexed bookingId, bool indexed status);

    /**
     * @dev Emitted when room bookings are cancelled.
     */
    event EmergencyCancellation(uint256 indexed bookingId, bool indexed status);

    /**
     * @dev Sets the admin wallet address.
     * @param _adminAddr The new admin wallet address to be set.
     * @notice This function can only be called by admin
     */
    function setAdmin(
        address _adminAddr
    ) external;

    /**
     * @dev This function is used to set the address of the signature verifier contract.
     * @param _signatureVerifier The address of the signature verifier contract.
     * @notice This function can only be called by admin
     */
    function setSignatureVerifier(address _signatureVerifier) external;

    /**
     * @dev Function to update the treasury address.
     * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by admin
     */
    function setBukTreasury(address _bukTreasuryContract) external;

    /**
     * @dev Function to update the Buk Wallet address to collect commission.
     * @param _bukWalletContract Address of the Buk Wallet.
     * @notice This function can only be called by admin
     */
    function setBukWallet(address _bukWalletContract) external;

    /**
     * @dev Function to update the stable token address.
     * @param _stableToken Address of the stable token contract.
     * @notice This function can only be called by admin
     */
    function setStableToken(address _stableToken) external;

    /**
     * @dev Function to update the BukNFTs contract address.
     * @param _nftContractAddr Address of the BukNFTs contract.
     * @notice This function can only be called by admin
     */
    function setBukNFTs(address _nftContractAddr) external;

    /**
     * @dev Function to update the BukPOSNFTs contract address.
     * @param _nftPoSContractAddr Address of the BukPOSNFTs contract.
     * @notice This function can only be called by admin
     */
    function setBukPoSNFTs(address _nftPoSContractAddr) external;

    /**
     * @dev Sets the Buk royalties contract address.
     * Can only be called by accounts with the ADMIN_ROLE.
     * @param _royaltiesContract The new royaltiesContract address to set.
     * @notice This function updates the royaltiesContract address and emits an event.
     * @dev If {_royaltiesContract} is the zero address, the function will revert.
     * @dev Emits a {SetRoyaltiesContract} event with the previous royaltiesContract address and the new address.
     */
    function setRoyaltiesContract(address _royaltiesContract) external;

    /**
     * @dev Function to set the Buk commission percentage.
     * @param _commission Commission percentage.
     * @notice This function can only be called by admin
     */
    function setCommission(uint8 _commission) external;

    /**
     * @dev Function to toggle the tradeability of an asset.
     * @param _tokenId Token Id whose tradeability is being toggled.
     * @notice This function can only be called by admin
     */
    function toggleTradeability(uint256 _tokenId) external;

    /**
     * @dev Function to book rooms.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _minSalePrice Minimum sale price for the booking.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @param _tradeTimeLimit Trade Limit of NFT based on Checkin time.
     * @param _tradeable Is the booking NFT tradeable.
     * @return ids IDs of the bookings.
     */
    function bookRoom(
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external returns (bool);

    /**
     * @dev Allows the admin to refund a booking by canceling it and transferring the amount to the owner.
     * @param _ids An array of booking IDs that need to be refunded.
     * @param _owner The address of the owner of the bookings.
     * @notice This function is usually executed when the booking is unsuccessful from the hotel's end.
     * @notice This function can only be called by admin
     */
    function bookingRefund(uint256[] memory _ids, address _owner) external;

    /**
     * @dev Function to mint new BukNFT tokens based on the provided booking IDs and URIs.
     * @param _ids An array of booking IDs representing the unique identifier for each BukNFT token.
     * @param _uri An array of URIs corresponding to each booking ID, which will be associated with the Buk NFTs.
     * @notice Only the owner of the booking can book the NFTs and confirm the rooms.
     * @notice The number of bookings and URIs should be same.
     * @notice The booking status should be booked to confirm it.
     * @notice The NFTs are minted to the owner of the booking.
     */
    function mintBukNFT(uint256[] memory _ids, string[] memory _uri) external;

    /**
     * @dev Function to checkin the rooms.
     * @param _ids An array of booking IDs representing the unique identifier for each BukNFT token.
     * @notice The booking status should be confirmed to checkin it.
     * @notice Once checkedin the NFT becomes non-tradeable.
     * @notice This function can only be called by admin or the owner of the booking NFT
     */
    function checkin(uint256[] memory _ids) external;

    /**
     * @dev Function to checkout the rooms.
     * @param _ids IDs of the bookings.
     * @notice Only the admin can checkout the rooms.
     * @notice The booking status should be checkedin to checkout it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice The Utility NFTs are minted to the owner of the booking.
     * @notice This function can only be called by admin
     */
    function checkout(uint256[] memory _ids) external;

    /**
     * @dev Function to cancel the room bookings.
     * @param _id ID of the booking.
     * @param _penalty Penalty amount to be refunded.
     * @param _refund Refund amount to be refunded.
     * @param _charges Charges amount to be refunded.
     * @param _bookingOwner Owner of the booking.
     * @notice Only the admin can cancel the rooms.
     * @notice The booking status should be confirmed to cancel it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice This function can only be called by admin
     */
    function cancelRoom(
        uint256 _id,
        uint256 _penalty,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner,
        bytes memory _signature
    ) external;

    /**
     * @dev Function to perform an emergency cancellation of a booking.
     * @param _id The ID of the booking to be cancelled.
     * @param _refund The amount to be refunded to the booking owner.
     * @param _charges The charges associated with the cancellation(if any).
     * @param _bookingOwner The address of the booking owner.
     * @notice This function can only be called by admin
     */
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external;

    /**
     * Function to get wallet addresses
     * @return bukTreasury The address of the bukTreasury contract
     * @return bukWallet The address of the bukWallet contract
     * @return stableToken The address of the stable token contract
     */
    function getWallets()
        external
        view
        returns (address bukTreasury, address bukWallet, address stableToken);

    /**
     * @dev To get the booking details
     * @param _tokenId ID of the booking.
     */
    function getBookingDetails(
        uint256 _tokenId
    ) external view returns (Booking memory);

    /**
     * @dev Function to retrieve royalty information.
     * @param _tokenId ID of the token
     * @notice Token ID and Booking ID are same.
     */
    function getRoyaltyInfo(
        uint256 _tokenId
    ) external view returns (IBukRoyalties.Royalty[] memory);
}
