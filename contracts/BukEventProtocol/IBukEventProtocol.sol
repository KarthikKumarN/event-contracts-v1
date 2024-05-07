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
     * @param uint256 eventId           Unique Event ID .
     * @param string name               Event name .
     * @param uint256 referenceId       Event Reference ID.
     * @param EventType eventType       Event type.
     * @param uint256 start             Event start date and time.
     * @param uint256 end               Event end date and time.
     * @param uint256 noOfTickets       Total no tickets can be booked.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the Event Tradeable.
     * @param address owner             Address of the event owner.
     * @param address eventAddress        Address of the event NFT.
     */
    struct Event {
        uint256 eventId;
        string name;
        uint256 referenceId;
        EventType eventType;
        uint256 start;
        uint256 end;
        uint256 noOfTickets;
        uint256 tradeTimeLimit;
        bool tradeable; // FIXME remove on event level
        address owner;
        address eventAddress;
    }

    /**
     * @dev Struct for booking details.
     * @param uint256 id                Booking ID.
     * @param uint256 tokenId           Token ID.
     * @param uint256 eventId           Event ID.
     * @param uint256 referenceId       Event reference ID.
     * @param uint256 total             Total Ticket rate.
     * @param uint256 baseRate          Ticket base rate.
     * @param uint256 commission        Ticket commission.
     * @param uint256 start             Event start date and time.
     * @param uint256 end               Event end date and time.
     * @param BookingStatus status      Booking status.
     * @param address firstOwner        Address of the booking owner.
     * @param bool tradeable            Is the NFT Tradeable.
     */
    struct Booking {
        uint256 id;
        uint256 tokenId;
        uint256 eventId;
        uint256 referenceId;
        uint256 total;
        uint256 baseRate;
        uint256 commission;
        uint256 start;
        uint256 end;
        BookingStatus status;
        address firstOwner;
        bool tradeable;
    }

    /**
     * @dev Struct for booking details.
     * @param uint256 eventId           Event ID.
     * @param uint256 referenceId       Event reference ID.
     * @param uint256 total             Total price.
     * @param uint256 baseRate          Base rate.
     * @param uint256 start             Event Start date.
     * @param uint256 end               Event End date.
     * @param bool tradeable            Is the NFT Tradeable.
     * @param address user             Address of the booking owner.
     */
    struct BookingList {
        uint256 eventId;
        uint256[] referenceId;
        uint256[] total;
        uint256[] baseRate;
        uint256[] start;
        uint256[] end;
        bool[] tradeable;
        address[] user;
    }

    /// @dev Emitted when event created.
    event CreateEvent(
        string name,
        EventType eventType,
        uint256 start,
        uint256 end,
        uint256 noOfTickets,
        bool tradeable,
        address eventAddress
    );

    /// @dev Emitted when the admin wallet is set.
    event SetAdminWallet(address newAdminWallet);

    /// @dev Emitted when the commission is set.
    event SetCommission(uint256 newCommission);

    /// @dev Emitted when BukNFTs contract address is updated.
    event SetBukNFTs(address newNFTContract);

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

    /// @dev Emitted when single event is booked.
    event EventBooked(
        uint256 indexed eventId,
        uint256 indexed bookingId,
        address indexed userAddress,
        uint256 referenceId,
        uint256 start,
        uint256 end
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

    /// @dev Emitted when the Event deployer contract is set.
    event SetEventDeployerContract(address newEventDeployer);

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
     * @dev Sets the Buk royalties contract address.
     * Can only be called by accounts with the ADMIN_ROLE.
     * @param _royaltiesContract The new royaltiesContract address to set.
     * @notice This function updates the royaltiesContract address and emits an event.
     * @dev If {_royaltiesContract} is the zero address, the function will revert.
     * @dev Emits a {SetRoyaltiesContract} event with the previous royaltiesContract address and the new address.
     */
    function setRoyaltiesContract(address _royaltiesContract) external;

    /**
     * @dev Function to set the Event Deployer contract address.
     * @param _eventDeployer Address of the Event Deployer contract.
     * @notice This function can only be called by admin
     */
    function setEventDeployerContract(address _eventDeployer) external;

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
     * @dev Function for Create Event.
     * @param  _name            Event Name.
     * @param  _referenceId     Event Reference ID.
     * @param  _eventType       Event type.
     * @param  _start           Event start date and time.
     * @param  _end             Event end date and time.
     * @param  _noOfTickets     Total no tickets can be booked.
     * @param  _tradeTimeLimit  Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param  _tradeable       Is the Event Tradeable.
     * @param  _owner           Address of the event owner.
     */
    function createEvent(
        string calldata _name,
        uint256 _referenceId,
        EventType _eventType,
        uint256 _start,
        uint256 _end,
        uint256 _noOfTickets,
        uint256 _tradeTimeLimit,
        bool _tradeable,
        address _owner
    ) external returns (uint256);

    /**
     * @dev Function to book event.
     * @param _eventId        Event ID.
     * @param _referenceId    Event booking reference ID.
     * @param _total          Total price of the ticket.
     * @param _baseRate       Base rate of the ticket.
     * @param _start          Start date.
     * @param _end            End date.
     * @param _tradeable Is the booking NFT tradeable.
     * @return ids IDs of the bookings.
     */
    function bookEvent(
        uint256 _eventId,
        uint256[] memory _referenceId,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _start,
        uint256[] memory _end,
        bool[] memory _tradeable
    ) external returns (bool);

    /**
     * @dev Function to book event.
     * @param _eventId        Event ID.
     * @param _referenceId    Event booking reference ID.
     * @param _total          Total price of the ticket.
     * @param _baseRate       Base rate of the ticket.
     * @param _start          Start date.
     * @param _end            End date.
     * @param _tradeable Is the booking NFT tradeable.
     * @param _user Address of user which we are booking.
     * @return ids IDs of the bookings.
     * @notice This function can only be called by admin
     * @notice This function is used to book event on behalf of the user.
     */
    function bookEventOwner(
        uint256 _eventId,
        uint256[] memory _referenceId,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _start,
        uint256[] memory _end,
        bool[] memory _tradeable,
        address[] memory _user
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
     * @notice Total refund amount and charges should be <= the total amount (total booking amount + buk commission).
     */
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external;

    /**
     * @dev Function to get the event details.
     * @param _eventId ID of the event.
     * @return Event details.
     */
    function getEventDetails(
        uint256 _eventId
    ) external view returns (Event memory);

    /**
     * Function to get wallet addresses
     * @return nftContract The address of the nft contract
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
