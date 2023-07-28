// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../BukNFTs/IBukNFTs.sol";
import "../Treasury/ITreasury.sol";

/**
* @title BUK Protocol Contract
* @author BUK Technology Inc
* @dev Genesis contract for managing all operations of the BUK protocol including ERC1155 token management for room-night NFTs and underlying sub-contracts such as Buk NFTs, Buk PoS NFTs, Treasury, and Marketplace.
*/
contract BukProtocol is AccessControl, ReentrancyGuard {

    /**
    * @dev Enum for booking statuses.
    * @var BookingStatus.nil         Booking has not yet been initiated.
    * @var BookingStatus.booked      Booking has been initiated but not yet confirmed.
    * @var BookingStatus.confirmed   Booking has been confirmed.
    * @var BookingStatus.cancelled   Booking has been cancelled.
    * @var BookingStatus.expired     Booking has expired.
    */
    enum BookingStatus {nil, booked, confirmed, cancelled, expired}

    /**
    * @dev address bukWallet        Address of the Buk wallet.
    * @dev address currency          Address of the currency.
    * @dev address treasury          Address of the treasury.
    * @dev address nftContract Address of the Buk NFT contract.
    * @dev address nftPoSContract  Address of the Buk NFT PoS Contract.
    */
    address private bukWallet;
    address private currency;
    address private treasury;
    address public nftContract;
    address public nftPoSContract;
    /**
    * @dev Commission charged on bookings.
    */
    uint8 public commission = 5;

    /**
    * @dev Counters.Counter bookingIds    Counter for booking IDs.
    */
    uint256 private bookingIds;

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
    * @dev Constant for the role of admin
    */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

    /**
    * @dev mapping(uint256 => Booking) bookingDetails   Mapping of booking IDs to booking details.
    */
    mapping(uint256 => Booking) public bookingDetails; //bookingID -> Booking Details
    /**
    * @dev Emitted when the commission is set.
    */
    event SetCommission(uint256 indexed commission);
    /**
    * @dev Emitted when Buk Protocol role access is granted for NFT and PoS contracts
    */
    event GrantBukProtocolRole(address indexed oldAddress, address indexed newAddress);
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
    event BookRooms(uint256[] indexed bookings, uint256 indexed total, uint256 indexed commission);
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
    * @dev Modifier to check the access to toggle NFTs.
    */
    modifier onlyAdminOwner(uint256 _bookingId) {
        require(((hasRole(ADMIN_ROLE, _msgSender())) || (_msgSender()==bookingDetails[_bookingId].owner)), "Caller does not have access");
        _;
    }

    /**
    * @dev Constructor to initialize the contract
    * @param _treasury Address of the treasury.
    * @param _currency Address of the currency.
    * @param _bukWallet Address of the Buk wallet.
    */
    constructor (address _treasury, address _currency, address _bukWallet) {
        currency = _currency;
        treasury = _treasury;
        bukWallet = _bukWallet;
        _setupRole(ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
    * @dev Function to update the treasury address.
    * @param _treasury Address of the treasury.
    */
    function setTreasury(address _treasury) external onlyRole(ADMIN_ROLE) {
        treasury = _treasury;
        emit SetTreasury(_treasury);
    }

    /**
    * @dev Function to update the token uri.
    * @param _tokenId Token Id.
    */
    function setTokenUri( uint _tokenId, string memory _newUri) external onlyRole(ADMIN_ROLE) {
        IBukNFTs(nftContract).setURI(_tokenId, _newUri);
        emit SetTokenURI(_tokenId,_newUri);
    }

    /**
    * @dev Update the name of the contract.
    * @notice This function can only be called by addresses with `UPDATE_CONTRACT_ROLE`
    */
    function updateNFTName(string memory _contractName) external onlyRole(ADMIN_ROLE) {
        IBukNFTs(nftContract).updateName(_contractName);
        emit UpdateContractName(_contractName);
    }

    /**
    * @dev Function to grant the BUK Protocol role access to NFT and PoS contracts
    * @param _newBukProtocol address: New Buk Protocol contract of the Buk NFTs
    * @notice This function can only be called by a contract with `ADMIN_ROLE`
    */
    function grantBukProtocolRole(address _newBukProtocol) external onlyRole(ADMIN_ROLE)  {
        IBukNFTs(nftContract).grantBukProtocolRole(_newBukProtocol);
        emit GrantBukProtocolRole(address(this), _newBukProtocol);
    }

    /**
    * @dev Function to set the Buk commission percentage.
    * @param _commission Commission percentage.
    */
    function setCommission(uint8 _commission) external onlyRole(ADMIN_ROLE) {
        commission = _commission;
        emit SetCommission(_commission);
    }

    /** 
    * @dev Function to book rooms.
    * @param _count Number of rooms to be booked.
    * @param _total Total amount to be paid.
    * @param _baseRate Base rate of the room.
    * @param _checkin Checkin date.
    * @param _checkout Checkout date.
    * @return ids IDs of the bookings.
    */
    function bookRoom(uint256 _count, uint256[] memory _total, uint256[] memory _baseRate, uint256 _checkin, uint256 _checkout) external nonReentrant() returns (bool) {
        require(((_total.length == _baseRate.length) && (_total.length == _count) && (_count>0)), "Array sizes mismatch");
        uint256[] memory bookings = new uint256[](_count);
        uint total = 0;
        uint commissionTotal = 0;
        for(uint8 i=0; i<_count;++i) {
            ++bookingIds;
            bookingDetails[bookingIds] = Booking(bookingIds, BookingStatus.booked, 0, _msgSender(), _checkin, _checkout, _total[i], _baseRate[i]);
            bookings[i] = bookingIds;
            total+=_total[i];
            commissionTotal+= _baseRate[i]*commission/100;
            emit BookRoom(bookingIds);
        }
        return _bookingPayment(commissionTotal, total);
    }

    /** 
    * @dev Function to refund the amount for the failure scenarios.
    * @param _ids IDs of the bookings.
    */
    function bookingRefund(uint256[] memory _ids, address _owner) external onlyRole(ADMIN_ROLE) {
        uint256 len = _ids.length;
        require((len>0), "Array is empty");
        for(uint8 i=0; i<len; ++i) {
            require(bookingDetails[_ids[i]].owner == _owner, "Check the booking owner");
            require(bookingDetails[_ids[i]].status == BookingStatus.booked, "Check the Booking status");
        }
        uint total = 0;
        for(uint8 i=0; i<len;++i) {
            bookingDetails[_ids[i]].status = BookingStatus.cancelled;
            total+= bookingDetails[_ids[i]].total + bookingDetails[_ids[i]].baseRate*commission/100;
        }
        ITreasury(treasury).cancelUSDCRefund(total, _owner);
        emit BookingRefund(total, _owner);
    }
    
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
    function confirmRoom(uint256[] memory _ids, string[] memory _uri, bool _status) external nonReentrant() {
        uint256 len = _ids.length;
        for(uint8 i=0; i<len; ++i) {
            require(bookingDetails[_ids[i]].status == BookingStatus.booked, "Check the Booking status");
            require(bookingDetails[_ids[i]].owner == _msgSender(), "Only booking owner has access");
        }
        require((len == _uri.length), "Check Ids and URIs size");
        require(((len > 0) && (len < 11)), "Not in max - min booking limit");
        IBukNFTs bukNftsContract = IBukNFTs(nftContract);
        for(uint8 i=0; i<len; ++i) {
            bookingDetails[_ids[i]].status = BookingStatus.confirmed;
            bukNftsContract.mint(_ids[i], bookingDetails[_ids[i]].owner, 1, "", _uri[i], _status);
            bookingDetails[_ids[i]].tokenID = _ids[i];
        }
        emit MintBookingNFT(_ids, true);
    }

    /**
    * @dev Function to checkout the rooms.
    * @param _ids IDs of the bookings.
    * @notice Only the admin can checkout the rooms.
    * @notice The booking status should be confirmed to checkout it.
    * @notice The Active Booking NFTs are burnt from the owner's account.
    * @notice The Utility NFTs are minted to the owner of the booking.
    */
    function checkout(uint256[] memory _ids ) external onlyRole(ADMIN_ROLE)  {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for(uint8 i=0; i<len; ++i) {
            require(bookingDetails[_ids[i]].status == BookingStatus.confirmed, "Check the Booking status");
        }
        for(uint8 i=0; i<len;++i) {
            bookingDetails[_ids[i]].status = BookingStatus.expired;
            IBukNFTs(nftContract).burn(bookingDetails[_ids[i]].owner, _ids[i], 1, true);
        }
        emit CheckoutRooms(_ids, true);
    }

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
    function cancelRoom(uint256 _id, uint256 _penalty, uint256 _refund, uint256 _charges) external onlyRole(ADMIN_ROLE) {
        require((bookingDetails[_id].status == BookingStatus.confirmed), "Not a confirmed Booking");
        require(((_penalty+_refund+_charges)<(bookingDetails[_id].total+1)), "Transfer amount exceeds total");
        IBukNFTs bukNftsContract = IBukNFTs(nftContract);
        bookingDetails[_id].status = BookingStatus.cancelled;
        ITreasury(treasury).cancelUSDCRefund(_penalty, bukWallet);
        ITreasury(treasury).cancelUSDCRefund(_refund, bookingDetails[_id].owner);
        ITreasury(treasury).cancelUSDCRefund(_charges, bukWallet);
        bukNftsContract.burn(bookingDetails[_id].owner, _id, 1, false);
        emit CancelRoom(_id, true);
    }

    /** 
    * @dev Function to do the booking payment.
    * @param _commission Total BUK commission.
    * @param _total Total Booking Charge Excluding BUK commission.
    */
    function _bookingPayment(uint256 _commission, uint256 _total) internal returns(bool){
        IERC20(currency).transferFrom(_msgSender(), bukWallet, _commission);
        IERC20(currency).transferFrom(_msgSender(), treasury, _total);
        return true;
    }
}
