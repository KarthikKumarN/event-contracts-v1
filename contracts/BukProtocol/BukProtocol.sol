// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
contract BukProtocol is ReentrancyGuard, IBukProtocol {
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
    IBukNFTs public nftContract;
    IBukPOSNFTs public nftPOSContract;
    IBukRoyalties public royaltiesContract;

    /**
     * @dev Commission charged on bookings.
     */
    uint8 public commission = 5;

    /**
     * @dev Counters.Counter bookingIds    Counter for booking IDs.
     */
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
     * @param _royaltiesContract Address of the Buk royalties contract.
     */
    constructor(
        address _bukTreasuryContract,
        address _stableTokenAddr,
        address _bukWalletAddr,
        address _signVerifierContract,
        address _royaltiesContract
    ) {
        _setRoyaltiesContract(_royaltiesContract);
        _setAdmin(msg.sender);
        _setBukTreasury(_bukTreasuryContract);
        _setStableToken(_stableTokenAddr);
        _setBukWallet(_bukWalletAddr);
        _setSignatureVerifier(_signVerifierContract);
    }

    /**
     * @dev See {IBukProtocol-setAdmin}.
     */
    function setAdmin(address _adminAddr) external onlyAdmin {
        _setAdmin(_adminAddr);
    }

    /**
     * @dev See {IBukProtocol-setSignatureVerifier}.
     */
    function setSignatureVerifier(
        address __signatureVerifier
    ) external onlyAdmin {
        _setSignatureVerifier(__signatureVerifier);
    }

    /**
     * @dev See {IBukProtocol-setBukTreasury}.
     */
    function setBukTreasury(address _bukTreasuryContract) external onlyAdmin {
        _setBukTreasury(_bukTreasuryContract);
    }

    /**
     * @dev See {IBukProtocol-setBukWallet}.
     */
    function setBukWallet(address _bukWalletAddr) external onlyAdmin {
        _setBukWallet(_bukWalletAddr);
    }

    /**
     * @dev See {IBukProtocol-setStableToken}.
     */
    function setStableToken(address _stableTokenAddress) external onlyAdmin {
        _setStableToken(_stableTokenAddress);
    }

    /**
     * @dev See {IBukProtocol-setBukNFTs}.
     */
    function setBukNFTs(address _nftContractAddr) external onlyAdmin {
        address oldNFTContractAddr_ = address(nftContract);
        nftContract = IBukNFTs(_nftContractAddr);
        emit SetBukNFTs(oldNFTContractAddr_, _nftContractAddr);
    }

    /**
     * @dev See {IBukProtocol-setBukPosNFTs}.
     */
    function setBukPOSNFTs(address _nftPOSContractAddr) external onlyAdmin {
        address oldNFTPOSContractAddr_ = address(nftPOSContract);
        nftPOSContract = IBukPOSNFTs(_nftPOSContractAddr);
        emit SetBukPOSNFTs(oldNFTPOSContractAddr_, _nftPOSContractAddr);
    }

    /**
     * @dev See {IBukProtocol-setRoyalties}.
     */
    function setRoyaltiesContract(
        address _royaltiesContract
    ) external onlyAdmin {
        _setRoyaltiesContract(_royaltiesContract);
    }

    /**
     * @dev See {IBukProtocol-setCommission}.
     */
    function setCommission(uint8 _newCommission) external onlyAdmin {
        require(_newCommission <= 100, "Commission is more than 100");
        uint oldCommission_ = commission;
        commission = _newCommission;
        emit SetCommission(oldCommission_, _newCommission);
    }

    /**
     * @dev See {IBukProtocol-toggleTradeability}.
     */
    function toggleTradeability(uint256 _tokenId) external onlyAdmin {
        require(
            _bookingDetails[_tokenId].status != BookingStatus.nil,
            "Check the Booking status"
        );
        _bookingDetails[_tokenId].tradeable = !_bookingDetails[_tokenId]
            .tradeable;
        emit ToggleTradeability(_tokenId, _bookingDetails[_tokenId].tradeable);
    }

    /**
     * @dev See {IBukProtocol-bookRoom}.
     */
    function bookRoom(
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        bytes32 _propertyId,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external nonReentrant returns (bool) {
        require(
            ((_total.length == _baseRate.length) &&
                (_total.length == _minSalePrice.length) &&
                (_total.length > 0)),
            "Array sizes mismatch"
        );
        require(
            (_checkin > block.timestamp),
            "Checkin date should be greater than current date"
        );
        require(
            (_checkout > _checkin),
            "Checkout date should be greater than checkin date"
        );
        uint256 total = 0;
        for (uint8 i = 0; i < _total.length; ++i) {
            total += _total[i];
        }
        require(
            (_stableToken.allowance(msg.sender, address(this)) >= total),
            "Check the allowance of the sender"
        );
        uint commissionTotal = 0;
        for (uint8 i = 0; i < _total.length; ++i) {
            ++_bookingIds;
            _bookingDetails[_bookingIds] = Booking(
                _bookingIds,
                0,
                _propertyId,
                BookingStatus.booked,
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
            emit BookRoom(_bookingIds, _propertyId, _checkin, _checkout, _total[i]);
        }
        return _bookingPayment(commissionTotal, total);
    }

    /**
     * @dev See {IBukProtocol-bookingRefund}.
     */
    function bookingRefund(
        uint256[] memory _ids,
        address _owner
    ) external onlyAdmin {
        uint256 len = _ids.length;
        require((len > 0), "Array is empty");
        for (uint8 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].firstOwner == _owner,
                "Check the booking owner"
            );
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
        }
        uint total = 0;
        for (uint8 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.cancelled;
            total +=
                _bookingDetails[_ids[i]].total +
                (_bookingDetails[_ids[i]].baseRate * commission) /
                100;
        }
        _bukTreasury.cancelUSDCRefund(total, _owner);
        emit BookingRefund(total, _owner);
    }

    /**
     * @dev See {IBukProtocol-mintBukNFT}.
     */
    function mintBukNFT(
        uint256[] memory _ids,
        string[] memory _uri
    ) external nonReentrant {
        uint256 len = _ids.length;
        require((len == _uri.length), "Check Ids and URIs size");
        require(((len > 0) && (len < 11)), "Not in max - min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
            require(
                _bookingDetails[_ids[i]].firstOwner == msg.sender,
                "Only booking owner can mint"
            );
        }
        for (uint8 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.confirmed;
            nftContract.mint(
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

    /**
     * @dev See {IBukProtocol-checkin}.
     */
    function checkin(uint256[] memory _ids) external {
        uint256 len = _ids.length;
        for (uint8 i = 0; i < len; ++i) {
            require(
                (_admin == msg.sender) ||
                    (nftContract.balanceOf(msg.sender, _ids[i]) > 0),
                "Only admin or owner of the NFT can access the booking"
            );
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.confirmed,
                "Check the Booking status"
            );
        }
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.checkedin;
            _bookingDetails[_ids[i]].tradeable = false;
        }
        emit CheckinRooms(_ids, true);
    }

    /**
     * @dev See {IBukProtocol-checkout}.
     */
    function checkout(uint256[] memory _ids) external onlyAdmin {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.checkedin,
                "Check the Booking status"
            );
            require(
                (_bookingDetails[_ids[i]].checkout < block.timestamp),
                "Checkout date should be less than current date"
            );
        }
        for (uint8 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.checkedout;
            _bookingDetails[_ids[i]].tradeable = false;
            nftContract.burn(
                _bookingDetails[_ids[i]].firstOwner,
                _ids[i],
                1,
                true
            );
        }
        emit CheckoutRooms(_ids, true);
    }

    /**
     * @dev See {IBukProtocol-cancelRoom}.
     */
    function cancelRoom(
        uint256 _id,
        uint256 _penalty,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner,
        bytes memory _signature
    ) external onlyAdmin {
        require(
            ((_bookingDetails[_id].status == BookingStatus.confirmed) ||
                (_bookingDetails[_id].status == BookingStatus.checkedin)),
            "Not a confirmed or checkedin Booking"
        );
        require(
            (_bookingDetails[_id].checkin > block.timestamp),
            "Checkin date should be greater than current date"
        );
        require(
            nftContract.balanceOf(_bookingOwner, _id) > 0,
            "Check the booking owner"
        );
        bytes32 hash = keccak256(
            abi.encodePacked(_id, _penalty, _refund, _charges)
        );
        address signer = _signatureVerifier.verify(hash, _signature);
        require(signer == _bookingOwner, "Invalid owner signature");
        require(
            ((_penalty + _refund + _charges) <
                (_bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        _bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.cancelUSDCRefund(_penalty, _bukWallet);
        _bukTreasury.cancelUSDCRefund(_refund, _bookingOwner);
        _bukTreasury.cancelUSDCRefund(_charges, _bukWallet);
        nftContract.burn(_bookingOwner, _id, 1, false);
        emit CancelRoom(_id, true);
    }

    /**
     * @dev See {IBukProtocol-emergencyCancellation}.
     */
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external onlyAdmin {
        require(
            ((_bookingDetails[_id].status == BookingStatus.confirmed) ||
                (_bookingDetails[_id].status == BookingStatus.checkedin)),
            "Not a confirmed or checkedin Booking"
        );
        require(
            (_bookingDetails[_id].checkin > block.timestamp),
            "Checkin date should be greater than current date"
        );
        require(
            nftContract.balanceOf(_bookingOwner, _id) > 0,
            "Check the booking owner"
        );
        require(
            ((_refund + _charges) < (_bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        _bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.cancelUSDCRefund(_refund, _bookingOwner);
        _bukTreasury.cancelUSDCRefund(_charges, address(_bukTreasury));
        nftContract.burn(_bookingOwner, _id, 1, false);
        emit EmergencyCancellation(_id, true);
    }

    /**
     * @dev See {IBukProtocol-getWallets}.
     */
    function getWallets()
        external
        view
        onlyAdmin
        returns (
            address bukTreasury,
            address bukWallet,
            address stableToken,
            address admin,
            address signatureVerifier
        )
    {
        return (
            address(_bukTreasury),
            address(_bukWallet),
            address(_stableToken),
            address(_admin),
            address(_signatureVerifier)
        );
    }

    /**
     * @dev See {IBukProtocol-getBookingDetails}.
     */
    function getBookingDetails(
        uint256 _tokenId
    ) external view returns (Booking memory) {
        return _bookingDetails[_tokenId];
    }

    /**
     * @dev See {IBukProtocol-getRoyaltyInfo}.
     */
    function getRoyaltyInfo(
        uint256 _tokenId
    ) external view returns (IBukRoyalties.Royalty[] memory) {
        IBukRoyalties.Royalty[] memory royalties = royaltiesContract
            .getRoyaltyInfo(_tokenId);
        return royalties;
    }

    /**
     * Private function to set the Admin Wallet address
     * @param _adminAddr The address of the Admin Wallet
     */
    function _setAdmin(address _adminAddr) private {
        address oldAdminWallet_ = _admin;
        _admin = _adminAddr;
        emit SetAdminWallet(oldAdminWallet_, _adminAddr);
    }

    /**
     * Private function to set the Signature Verifier contract address
     * @param _signatureVerifierContract The address of the Signature Verifier contract
     */
    function _setSignatureVerifier(address _signatureVerifierContract) private {
        address oldSignatureVerifierContract_ = address(_signatureVerifier);
        _signatureVerifier = ISignatureVerifier(_signatureVerifierContract);
        emit SetSignerVerifier(
            oldSignatureVerifierContract_,
            _signatureVerifierContract
        );
    }

    /**
     * Private function to set the Royalty contract address
     * @param _royaltiesContract The address of the Royalties contract
     */
    function _setRoyaltiesContract(address _royaltiesContract) private {
        address oldRoyaltiesContract_ = address(royaltiesContract);
        royaltiesContract = IBukRoyalties(_royaltiesContract);
        emit SetRoyaltiesContract(oldRoyaltiesContract_, _royaltiesContract);
    }

    /**
     * Private function to set the BukTreasury contract address
     * @param _bukTreasuryContract The address of the BukTreasury contract
     */
    function _setBukTreasury(address _bukTreasuryContract) private {
        address oldBukTreasuryContract_ = address(_bukTreasury);
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(oldBukTreasuryContract_, _bukTreasuryContract);
    }

    /**
     * Private function to set the BukWallet contract address
     * @param _bukWalletAddr The address of the BukWallet contract
     */
    function _setBukWallet(address _bukWalletAddr) private {
        address oldBukWallet_ = _bukWallet;
        _bukWallet = _bukWalletAddr;
        emit SetBukWallet(oldBukWallet_, _bukWalletAddr);
    }

    /**
     * Private function to set the stable token contract address
     * @param _stableTokenAddress The address of the stable token contract
     */
    function _setStableToken(address _stableTokenAddress) private {
        address oldStableToken_ = address(_stableToken);
        _stableToken = IERC20(_stableTokenAddress);
        emit SetStableToken(oldStableToken_, _stableTokenAddress);
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
