// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import { IBukPOSNFTs } from "../BukPOSNFTs/IBukPOSNFTs.sol";
import { IBukNFTs } from "../BukNFTs/IBukNFTs.sol";
import { IBukTreasury } from "../BukTreasury/IBukTreasury.sol";
import { ISignatureVerifier } from "../SignatureVerifier/ISignatureVerifier.sol";
import { IBukRoyalties } from "../BukRoyalties/IBukRoyalties.sol";
import { IBukProtocol } from "../BukProtocol/IBukProtocol.sol";

/**
 * @title BUK Protocol Contract
 * @author BUK Technology Inc
 * @dev Contract to manage operations of the BUK protocol to manage BukNFTs tokens and underlying sub-contracts.
 */
contract BukProtocol is ReentrancyGuard, IBukProtocol, Pausable {
    /**
     * @dev address _bukWallet        Address of the Buk wallet.
     * @dev address _stableToken          Address of the stable token.
     * @dev address _bukTreasury          Address of the Buk treasury contract.
     * @dev address nftContract Address of the Buk NFT contract.
     * @dev address nftPOSContract  Address of the Buk NFT POS Contract.
     * @dev address royaltiesContract  Address of the Buk Royalties Contract.
     */
    address private _admin;
    address private _bukWallet;
    IERC20 private _stableToken;
    IBukTreasury private _bukTreasury;
    ISignatureVerifier private _signatureVerifier;
    IBukNFTs private _nftContract;
    IBukPOSNFTs private _nftPOSContract;
    IBukRoyalties private _royaltiesContract;

    /// @dev Commission charged on bookings.
    uint256 public commission = 5;

    /// @dev Counters.Counter bookingIds    Counter for booking IDs.
    uint256 private _bookingIds;

    /**
     * @dev mapping(uint256 => Booking) _bookingDetails   Mapping of booking IDs to booking details.
     */
    mapping(uint256 => Booking) private _bookingDetails; //bookingID -> Booking Details

    /**
     * @dev Modifier onlyAdmin
     * Ensures that the function can only be accessed by the admin.
     * Throws an exception with a custom error message if the calling address is not the admin.
     */
    modifier onlyAdmin() {
        require(
            (msg.sender == _admin),
            "Only admin has access to this function"
        );
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     * @param _bukTreasuryContract Address of the treasury.
     * @param _stableTokenAddr Address of the stable token.
     * @param _bukWalletAddr Address of the Buk wallet.
     * @param _signVerifierContract Address of the signature verifier contract.
     * @param _royaltiesContractAddr Address of the Buk royalties contract.
     */
    constructor(
        address _bukTreasuryContract,
        address _stableTokenAddr,
        address _bukWalletAddr,
        address _signVerifierContract,
        address _royaltiesContractAddr
    ) {
        _setRoyaltiesContract(_royaltiesContractAddr);
        _setAdmin(msg.sender);
        _setBukTreasury(_bukTreasuryContract);
        _setStableToken(_stableTokenAddr);
        _setBukWallet(_bukWalletAddr);
        _setSignatureVerifier(_signVerifierContract);
    }

    /// @dev See {IBukProtocol-setAdmin}.
    function setAdmin(address _adminAddr) external onlyAdmin {
        _setAdmin(_adminAddr);
    }

    /// @dev See {IBukProtocol-setSignatureVerifier}.
    function setSignatureVerifier(
        address __signatureVerifier
    ) external onlyAdmin {
        _setSignatureVerifier(__signatureVerifier);
    }

    /// @dev See {IBukProtocol-setBukTreasury}.
    function setBukTreasury(address _bukTreasuryContract) external onlyAdmin {
        _setBukTreasury(_bukTreasuryContract);
    }

    /// @dev See {IBukProtocol-setBukWallet}.
    function setBukWallet(address _bukWalletAddr) external onlyAdmin {
        _setBukWallet(_bukWalletAddr);
    }

    /// @dev See {IBukProtocol-setStableToken}.
    function setStableToken(address _stableTokenAddress) external onlyAdmin {
        _setStableToken(_stableTokenAddress);
    }

    /// @dev See {IBukProtocol-setBukNFTs}.
    function setBukNFTs(address _nftContractAddr) external onlyAdmin {
        _nftContract = IBukNFTs(_nftContractAddr);
        emit SetBukNFTs(_nftContractAddr);
    }

    /// @dev See {IBukProtocol-setBukPosNFTs}.
    function setBukPOSNFTs(address _nftPOSContractAddr) external onlyAdmin {
        _nftPOSContract = IBukPOSNFTs(_nftPOSContractAddr);
        emit SetBukPOSNFTs(_nftPOSContractAddr);
    }

    /// @dev See {IBukProtocol-setRoyalties}.
    function setRoyaltiesContract(
        address _royaltiesContractAddr
    ) external onlyAdmin {
        _setRoyaltiesContract(_royaltiesContractAddr);
    }

    /// @dev See {IBukProtocol-setCommission}.
    function setCommission(
        uint256 _newCommission
    ) external onlyAdmin whenNotPaused {
        require(_newCommission <= 100, "Commission is more than 100");
        commission = _newCommission;
        emit SetCommission(_newCommission);
    }

    /// @dev See {IBukProtocol-toggleTradeability}.
    function toggleTradeability(uint256 _tokenId) external onlyAdmin {
        require(
            _bookingDetails[_tokenId].status != BookingStatus.nil,
            "Check the Booking status"
        );
        _bookingDetails[_tokenId].tradeable = !_bookingDetails[_tokenId]
            .tradeable;
        emit ToggleTradeability(_tokenId, _bookingDetails[_tokenId].tradeable);
    }

    /// @dev See {IBukProtocol-pause}.
    function pause() external onlyAdmin {
        _pause();
    }

    /// @dev See {IBukProtocol-unpause}.
    function unpause() external onlyAdmin {
        _unpause();
    }

    /// @dev See {IBukProtocol-bookRooms}.
    function bookRooms(
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        uint256[] memory _adult,
        uint256[] memory _child,
        bytes32 _propertyId,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external nonReentrant whenNotPaused returns (bool) {
        require(
            ((_total.length == _baseRate.length) &&
                (_total.length == _minSalePrice.length) &&
                (_total.length > 0)),
            "Array sizes mismatch"
        );
        require(_total.length <= 11, "Exceeded max rooms per booking");
        require(
            (_checkin > block.timestamp),
            "Checkin date must be in the future"
        );
        require((_checkout > _checkin), "Checkout date must be after checkin");
        uint256 total;
        for (uint256 i = 0; i < _total.length; ++i) {
            total += _total[i];
        }
        require(
            (_stableToken.allowance(msg.sender, address(this)) >= total),
            "Check the allowance"
        );
        uint commissionTotal;
        for (uint256 i = 0; i < _total.length; ++i) {
            ++_bookingIds;
            require(
                _bookingDetails[_bookingIds].status == BookingStatus.nil &&
                    _bookingDetails[_bookingIds].tokenId == 0,
                "Booking ID already used"
            );
            _bookingDetails[_bookingIds] = Booking(
                _bookingIds,
                0,
                _propertyId,
                BookingStatus.booked,
                _adult[i],
                _child[i],
                msg.sender,
                _checkin,
                _checkout,
                _total[i],
                _baseRate[i],
                _minSalePrice[i],
                _tradeTimeLimit,
                _tradeable
            );
            commissionTotal += (_baseRate[i] * commission) / 100;
            emit BookRoom(
                _bookingIds,
                _propertyId,
                _checkin,
                _checkout,
                _adult[i],
                _child[i]
            );
        }
        return _bookingPayment(commissionTotal, total);
    }

    /// @dev See {IBukProtocol-bookingRefund}.
    function bookingRefund(
        uint256[] memory _ids,
        address _owner
    ) external whenNotPaused onlyAdmin {
        uint256 len = _ids.length;
        require((len > 0), "Array is empty");
        for (uint256 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].firstOwner == _owner,
                "Check the booking owner"
            );
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
        }
        uint total;
        for (uint256 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.cancelled;
            total +=
                _bookingDetails[_ids[i]].total +
                (_bookingDetails[_ids[i]].baseRate * commission) /
                100;
        }
        _bukTreasury.stableRefund(total, _owner);
        (total, _owner);
        emit BookingRefund(total, _owner);
    }

    /// @dev See {IBukProtocol-mintBukNFT}.
    function mintBukNFT(
        uint256[] memory _ids,
        string[] memory _uri
    ) external whenNotPaused nonReentrant {
        uint256 len = _ids.length;
        require((len == _uri.length), "Check Ids and URIs size");
        require(((len > 0) && (len < 11)), "Not in max - min booking limit");
        for (uint256 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
            require(
                _bookingDetails[_ids[i]].firstOwner == msg.sender,
                "Only booking owner can mint"
            );
        }
        for (uint256 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.confirmed;
            _nftContract.mint(
                _ids[i],
                _bookingDetails[_ids[i]].firstOwner,
                1,
                "",
                _uri[i]
            );
            _bookingDetails[_ids[i]].tokenId = _ids[i];
        }
        emit MintedBookingNFT(_ids, true);
    }

    /// @dev See {IBukProtocol-checkin}.
    function checkin(uint256[] memory _ids) external {
        uint256 len = _ids.length;
        for (uint256 i = 0; i < len; ++i) {
            require(
                (_admin == msg.sender) ||
                    (_nftContract.balanceOf(msg.sender, _ids[i]) > 0),
                "Admin or NFT owner can access booking"
            );
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.confirmed,
                "Check the Booking status"
            );
        }
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint256 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.checkedin;
            _bookingDetails[_ids[i]].tradeable = false;
        }
        emit CheckinRooms(_ids, true);
    }

    /// @dev See {IBukProtocol-checkout}.
    function checkout(uint256[] memory _ids) external onlyAdmin whenNotPaused {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint256 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.checkedin,
                "Check the Booking status"
            );
            require(
                (_bookingDetails[_ids[i]].checkout < block.timestamp),
                "Checkout date must be before today"
            );
        }
        for (uint256 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.checkedout;
            _bookingDetails[_ids[i]].tradeable = false;
            _nftContract.burn(
                _bookingDetails[_ids[i]].firstOwner,
                _ids[i],
                1,
                true
            );
        }
        emit CheckoutRooms(_ids, true);
    }

    /// @dev See {IBukProtocol-cancelRooms}.
    function cancelRooms(
        uint256[] memory _ids,
        uint256[] memory _penalties,
        uint256[] memory _refunds,
        uint256[] memory _charges,
        address _bookingOwner,
        bytes memory _signature
    ) external whenNotPaused onlyAdmin nonReentrant {
        uint256 len = _ids.length;
        require(
            (len == _penalties.length) && (len == _refunds.length),
            "Validate IDs and amounts"
        );
        uint totalPenalty;
        uint totalRefund;
        uint totalCharges;
        for (uint256 i = 0; i < len; ++i) {
            require(
                ((_bookingDetails[_ids[i]].status == BookingStatus.confirmed) ||
                    (_bookingDetails[_ids[i]].status ==
                        BookingStatus.checkedin)),
                "Not a confirmed or checkedin Booking"
            );
            require(
                (_bookingDetails[_ids[i]].checkin > block.timestamp),
                "Checkin date must be in the future"
            );
            require(
                _nftContract.balanceOf(_bookingOwner, _ids[i]) > 0,
                "Check the booking owner balance"
            );
            require(
                ((_penalties[i] + _refunds[i] + _charges[i]) <
                    (_bookingDetails[_ids[i]].total + 1)),
                "Transfer amount exceeds total"
            );
            totalPenalty += _penalties[i];
            totalRefund += _refunds[i];
            totalCharges += _charges[i];
        }
        // Verify the signature using the generateAndVerify function
        address signer = _signatureVerifier.generateAndVerify(
            totalPenalty,
            totalRefund,
            totalCharges,
            _signature
        );
        require(signer == _bookingOwner, "Invalid owner signature");
        for (uint256 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.cancelled;
            _nftContract.burn(_bookingOwner, _ids[i], 1, false);
        }
        if (totalPenalty > 0)
            _bukTreasury.stableRefund(totalPenalty, _bukWallet);
        if (totalRefund > 0)
            _bukTreasury.stableRefund(totalRefund, _bookingOwner);
        if (totalCharges > 0)
            _bukTreasury.stableRefund(totalCharges, _bukWallet);
        emit CancelRoom(_ids, totalRefund, true);
    }

    /// @dev See {IBukProtocol-emergencyCancellation}.
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external whenNotPaused onlyAdmin nonReentrant {
        require(
            ((_bookingDetails[_id].status == BookingStatus.confirmed) ||
                (_bookingDetails[_id].status == BookingStatus.checkedin)),
            "Not a confirmed or checkedin Booking"
        );
        require(
            (_bookingDetails[_id].checkin > block.timestamp),
            "Checkin date must be in the future"
        );
        require(
            _nftContract.balanceOf(_bookingOwner, _id) > 0,
            "Check the booking owner"
        );
        require(
            ((_refund + _charges) < (_bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        _bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.stableRefund(_refund, _bookingOwner);
        _bukTreasury.stableRefund(_charges, address(_bukTreasury));
        _nftContract.burn(_bookingOwner, _id, 1, false);
        emit EmergencyCancellation(_id, true);
    }

    /// @dev See {IBukProtocol-getBookingDetails}.
    function getBookingDetails(
        uint256 _tokenId
    ) external view returns (Booking memory) {
        return _bookingDetails[_tokenId];
    }

    /// @dev See {IBukProtocol-getRoyaltyInfo}.
    function getRoyaltyInfo(
        uint256 _tokenId
    ) external view returns (IBukRoyalties.Royalty[] memory) {
        IBukRoyalties.Royalty[] memory royalties = _royaltiesContract
            .getRoyaltyInfo(_tokenId);
        return royalties;
    }

    /// @dev See {IBukProtocol-getWallets}.
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
        )
    {
        return (
            address(_nftContract),
            address(_nftPOSContract),
            address(_royaltiesContract),
            address(_signatureVerifier),
            address(_bukTreasury),
            address(_stableToken),
            address(_bukWallet),
            address(_admin)
        );
    }

    /**
     * Private function to set the Admin Wallet address
     * @param _adminAddr The address of the Admin Wallet
     */
    function _setAdmin(address _adminAddr) private {
        require(_adminAddr != address(0), "Invalid address");
        _admin = _adminAddr;
        emit SetAdminWallet(_adminAddr);
    }

    /**
     * Private function to set the Signature Verifier contract address
     * @param _signatureVerifierContract The address of the Signature Verifier contract
     */
    function _setSignatureVerifier(address _signatureVerifierContract) private {
        _signatureVerifier = ISignatureVerifier(_signatureVerifierContract);
        emit SetSignerVerifier(_signatureVerifierContract);
    }

    /**
     * Private function to set the Royalty contract address
     * @param _royaltiesContractAddr The address of the Royalties contract
     */
    function _setRoyaltiesContract(address _royaltiesContractAddr) private {
        _royaltiesContract = IBukRoyalties(_royaltiesContractAddr);
        emit SetRoyaltiesContract(_royaltiesContractAddr);
    }

    /**
     * Private function to set the BukTreasury contract address
     * @param _bukTreasuryContract The address of the BukTreasury contract
     */
    function _setBukTreasury(address _bukTreasuryContract) private {
        require(_bukTreasuryContract != address(0), "Invalid address");
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(_bukTreasuryContract);
    }

    /**
     * Private function to set the BukWallet contract address
     * @param _bukWalletAddr The address of the BukWallet contract
     */
    function _setBukWallet(address _bukWalletAddr) private {
        require(_bukWalletAddr != address(0), "Invalid address");
        _bukWallet = _bukWalletAddr;
        emit SetBukWallet(_bukWalletAddr);
    }

    /**
     * Private function to set the stable token contract address
     * @param _stableTokenAddress The address of the stable token contract
     */
    function _setStableToken(address _stableTokenAddress) private {
        require(_stableTokenAddress != address(0), "Invalid address");
        _stableToken = IERC20(_stableTokenAddress);
        emit SetStableToken(_stableTokenAddress);
    }

    /**
     * @dev Function to do the booking payment.
     * @param _commission Total BUK commission.
     * @param _total Total Booking Charge Excluding BUK commission.
     */
    function _bookingPayment(
        uint256 _commission,
        uint256 _total
    ) private returns (bool) {
        require(
            _stableToken.balanceOf(msg.sender) >= _total + _commission,
            "Insufficient balance for booking"
        );
        require(
            _stableToken.transferFrom(msg.sender, _bukWallet, _commission),
            "Commission transfer failed"
        );
        require(
            _stableToken.transferFrom(
                msg.sender,
                address(_bukTreasury),
                _total
            ),
            "Booking payment failed"
        );
        return true;
    }
}
