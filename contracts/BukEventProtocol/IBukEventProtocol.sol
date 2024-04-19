// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import { IBukRoyalties } from "../BukRoyalties/IBukRoyalties.sol";

/**
 * @title Interface to define the BUK protocol
 * @author BUK Technology Inc
 * @dev Collection of all procedures related to the BUK protocol
 * @dev This interface is used by the other child contract to interact with the BukEventProtocol contract.
 */
interface IBukEventProtocol {
    /**
     * @dev Enum for Event type.
     * @var EventType.free         Event type free.
     * @var EventType.paid      Event type paid.
     */
    enum EventType {
        free,
        paid
    }

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
     * @dev Struct for Event details.
     * @param bytes32 referenceId       Event Reference ID.
     * @param EventType eventType       Event type.
     * @param uint256 start             Event start date and time.
     * @param uint256 end               Event end date and time.
     * @param uint256 noOfTickets       Total no tickets can be booked.
     * @param uint256 rate              Ticket rate.
     // TODO * @param uint256 commission        Buk commission.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the Event Tradeable.
     * @param address owner             Address of the event owner.
     * @param address nftAddress        Address of the event NFT.
     */
    struct Event {
        bytes32 referenceId;
        EventType eventType;
        uint256 start;
        uint256 end;
        uint256 noOfTickets;
        uint256 rate;
        uint256 commission;
        uint256 tradeTimeLimit;
        bool tradeable;
        address owner;
        address nftAddress;
    }

    /**
     * @dev Struct for booking details.
     * @param uint256 id                Booking ID.
     * @param uint256 tokenId           Token ID.
     * @param bytes32 eventId           Event ID.
     * @param BookingStatus status      Booking status.
     * @param address owner             Address of the booking owner.
     * @param uint256 start             Event start date.
     * @param uint256 end          Event end date.
     * @param uint256 total             Total price.
     * @param uint256 baseRate          Base rate.
     * @param uint256 commission        Buk commission.
     * @param uint256 minSalePrice      Min Sale Price.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the NFT Tradeable.
     */
    struct Booking {
        uint256 id;
        uint256 tokenId;
        bytes32 eventId;
        BookingStatus status;
        address firstOwner;
        uint256 start;
        uint256 end;
        uint256 total;
        uint256 baseRate;
        uint256 commission;
        uint256 minSalePrice;
        uint256 tradeTimeLimit;
        bool tradeable;
    }

    /**
     * @dev Struct for booking details.
     * @param uint256 total             Total price.
     * @param uint256 baseRate          Base rate.
     * @param uint256 minSalePrice      Min Sale Price.
     * @param bytes32 eventId           Event ID.
     * @param uint256 start             Event Start date.
     * @param uint256 end               Event End date.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the NFT Tradeable.
     * @param address user             Address of the booking owner.
     */
    struct BookingList {
        uint256[] total;
        uint256[] baseRate;
        uint256[] minSalePrice;
        bytes32 eventId;
        uint256 start;
        uint256 end;
        uint256 tradeTimeLimit;
        bool tradeable;
        address user;
    }

    /// @dev Emitted when the admin wallet is set.
    event SetAdminWallet(address newAdminWallet);

    /// @dev Emitted when the commission is set.
    event SetCommission(uint256 newCommission);

    /// @dev Emitted when BukNFTs contract address is updated.
    event SetBukNFTs(address newNFTContract);

    /// @dev Emitted when BukPOSNFTs contract address is updated.
    event SetBukPOSNFTs(address newNFTPOSContract);

    /// @dev Emitted when BukRoyalties contract address is updated.
    event SetRoyaltiesContract(address newRoyaltiesContract);

    /// @dev Emitted when signer verifier is updated.
    event SetSignerVerifier(address newSignerVerifier);

    /// @dev Emitted when Buk treasury is updated.
    event SetBukTreasury(address newTreasuryContract);

    /// @dev Emitted when Buk Wallet is updated.
    event SetBukWallet(address newBukWalletContract);

    /// @dev Emitted when stable token is updated.
    event SetStableToken(address newStableToken);

    /**
     * @dev Emitted when the tradeability of a Buk NFT is toggled.
     * @param tokenId Token Id whose tradeability is being toggled.
     * @param tradeable Is the NFT tradeable.
     */
    event ToggleTradeability(uint256 indexed tokenId, bool indexed tradeable);

    /// @dev Emitted when single room is booked.
    event BookRoom(
        uint256 indexed booking,
        bytes32 indexed referenceId,
        uint256 checkin,
        uint256 checkout
    );

    /// @dev Emitted when booking refund is done.
    event BookingRefund(uint256 total, address owner);

    /// @dev Emitted when room bookings are confirmed.
    event MintedBookingNFT(uint256[] bookings, bool status);

    /// @dev Emitted when room bookings are checked in.
    event CheckinRooms(uint256[] bookings, bool status);

    /// @dev Emitted when room bookings are checked out.
    event CheckoutRooms(uint256[] bookings, bool status);

    /// @dev Emitted when room bookings are cancelled.
    event CancelRoom(
        uint256[] bookingIds,
        uint256 indexed total,
        bool indexed status
    );

    /// @dev Emitted when room bookings are cancelled.
    event EmergencyCancellation(uint256 indexed bookingId, bool indexed status);

    /**
     * @dev Sets the admin wallet address.
     * @param _adminAddr The new admin wallet address to be set.
     * @notice This function can only be called by admin
     */
    function setAdmin(address _adminAddr) external;

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
     * @param _nftPOSContractAddr Address of the BukPOSNFTs contract.
     * @notice This function can only be called by admin
     */
    function setBukPOSNFTs(address _nftPOSContractAddr) external;

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
    function setCommission(uint256 _commission) external;

    /**
     * @dev Function to toggle the tradeability of an asset.
     * @param _tokenId Token Id whose tradeability is being toggled.
     * @notice This function can only be called by admin
     */
    function toggleTradeability(uint256 _tokenId) external;

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
     * @dev Function to book rooms.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _minSalePrice Minimum sale price for the booking.
     * @param _referenceId Reference  ID.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @param _tradeTimeLimit Trade Limit of NFT based on Checkin time.
     * @param _tradeable Is the booking NFT tradeable.
     * @return ids IDs of the bookings.
     */
    function bookRooms(
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        bytes32 _referenceId,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external returns (bool);

    /**
     * @dev Function to book rooms.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _minSalePrice Minimum sale price for the booking.
     * @param _referenceId Reference  ID.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @param _tradeTimeLimit Trade Limit of NFT based on Checkin time.
     * @param _tradeable Is the booking NFT tradeable.
     * @param _user Address of user which we are booking.
     * @return ids IDs of the bookings.
     * @notice This function can only be called by admin
     * @notice This function is used to book rooms on behalf of the user.
     */
    function bookRoomsOwner(
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        bytes32 _referenceId,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable,
        address _user
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
     * @param _user Address of user which we are minting.
     * @notice Only the owner of the booking can book the NFTs and confirm the rooms.
     * @notice The number of bookings and URIs should be same.
     * @notice The booking status should be booked to confirm it.
     * @notice The NFTs are minted to the owner of the booking.
     * @notice This function can only be called by admin
     */
    function mintBukNFTOwner(
        uint256[] memory _ids,
        string[] memory _uri,
        address _user
    ) external;

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
     * @param _recipients Owner address of tokens of the bookings.
     * @notice Only the admin can checkout the rooms.
     * @notice The booking status should be checkedin to checkout it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice The Utility NFTs are minted to the owner of the booking.
     * @notice This function can only be called by admin
     * @notice POSR NFT will be minted to recipients address.
     */
    function checkout(
        uint256[] memory _ids,
        address[] memory _recipients
    ) external;

    /**
     * @dev Function to cancel the room bookings.
     * @param _ids Array of booking.
     * @param _penalties Array of penalty amount to be refunded.
     * @param _refunds Array of refund amount to be refunded.
     * @param _charges Array of charges amount to be deducted.
     * @param _bookingOwner Owner of the booking.
     * @notice Only the admin can cancel the rooms.
     * @notice The booking status should be confirmed to cancel it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice Buk commission is non-refundable.
     * @notice This function can only be called by admin
     */
    function cancelRooms(
        uint256[] memory _ids,
        uint256[] memory _penalties,
        uint256[] memory _refunds,
        uint256[] memory _charges,
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
     * @notice Total refund amount and charges should be less than or equal to the total amount (Total = total booking amount + buk commission).
     */
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external;

    /**
     * Function to get wallet addresses
     * @return nftContract The address of the nft contract
     * @return nftPOSContract The address of the nftPOS contract
     * @return royaltiesContract The address of the royalties contract
     * @return signatureVerifier The address of the signature verifier contract
     * @return bukTreasury The address of the bukTreasury contract
     * @return stableToken The address of the stable token contract
     * @return bukWallet The address of the bukWallet contract
     * @return admin The address of the stable token contract
     */
    function getWallets()
        external
        view
        returns (
            address nftContract,
            address nftPOSContract,
            address royaltiesContract,
            address signatureVerifier,
            address bukTreasury,
            address stableToken,
            address bukWallet,
            address admin
        );

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
