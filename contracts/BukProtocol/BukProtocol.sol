// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../BukPOSNFTs/IBukPOSNFTs.sol";
import "../BukNFTs/IBukNFTs.sol";
import "../BukTreasury/IBukTreasury.sol";
import "./IBukProtocol.sol";

/**
 * @title BUK Protocol Contract
 * @author BUK Technology Inc
 * @dev Contract to manage operations of the BUK protocol to manage BukNFTs tokens and underlying sub-contracts.
 */
contract BukProtocol is AccessControl, ReentrancyGuard, IBukProtocol {
    /**
     * @dev address _bukWallet        Address of the Buk wallet.
     * @dev address _currency          Address of the currency.
     * @dev address _bukTreasury          Address of the Buk treasury contract.
     * @dev address nftContract Address of the Buk NFT contract.
     * @dev address nftPoSContract  Address of the Buk NFT PoS Contract.
     */
    address private _bukWallet;
    IERC20 private _currency;
    IBukTreasury private _bukTreasury;
    IBukNFTs public nftContract;
    IBukPOSNFTs public nftPoSContract;

    //Buk and Hotel Royalties
    uint96 public bukRoyalty;
    uint96 public hotelRoyalty;
    uint96 public firstOwnerRoyalty;

    /**
     * @dev Commission charged on bookings.
     */
    uint8 public commission = 5;

    /**
     * @dev Minimum sale percentage.
     */
    uint8 public MIN_SALE_PERCENTAGE = 80;

    /**
     * @dev Counters.Counter bookingIds    Counter for booking IDs.
     */
    uint256 private _bookingIds;

    //COMMENT Need to add comment to this
    Royalty[] private _otherRoyalties;

    /**
     * @dev Constant for the role of admin
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");

    /**
     * @dev mapping(uint256 => Booking) bookingDetails   Mapping of booking IDs to booking details.
     */
    mapping(uint256 => Booking) public bookingDetails; //bookingID -> Booking Details

    //Modifier to check if the sender is either admin or an owner of the booking
    modifier onlyAdminOwner(uint256[] memory _ids) {
        uint256 len = _ids.length;
        for (uint8 i = 0; i < len; ++i) {
            if (bookingDetails[_ids[i]].status == BookingStatus.checkedout) {
                require(
                    hasRole(ADMIN_ROLE, _msgSender()) ||
                        (nftPoSContract.balanceOf(_msgSender(), _ids[i]) > 0)
                );
            } else {
                require(
                    hasRole(ADMIN_ROLE, _msgSender()) ||
                        (nftContract.balanceOf(_msgSender(), _ids[i]) > 0)
                );
            }
        }
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     * @param _bukTreasuryContract Address of the treasury.
     * @param _currencyContract Address of the currency.
     * @param _bukWalletContract Address of the Buk wallet.
     */
    constructor(
        address _bukTreasuryContract,
        address _currencyContract,
        address _bukWalletContract
    ) {
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        _currency = IERC20(_currencyContract);
        _bukWallet = _bukWalletContract;
        _setupRole(ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev See {IBukProtocol-setTreasury}.
     */
    function setTreasury(
        address _bukTreasuryContract
    ) external onlyRole(ADMIN_ROLE) {
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetTreasury(_bukTreasuryContract);
    }

    /**
     * @dev See {IBukProtocol-setCurrency}.
     */
    function setCurrency(
        address _currencyContract
    ) external onlyRole(ADMIN_ROLE) {
        _currency = IERC20(_currencyContract);
        emit SetCurrency(_currencyContract);
    }

    /**
     * @dev See {IBukProtocol-setBukNFTs}.
     */
    function setBukNFTs(
        address _nftContractAddr
    ) external onlyRole(ADMIN_ROLE) {
        nftContract = IBukNFTs(_nftContractAddr);
        emit SetBukNFTs(_nftContractAddr);
    }

    /**
     * @dev See {IBukProtocol-setBukPosNFTs}.
     */
    function setBukPoSNFTs(
        address _nftPoSContractAddr
    ) external onlyRole(ADMIN_ROLE) {
        nftPoSContract = IBukPOSNFTs(_nftPoSContractAddr);
        emit SetBukPoSNFTs(_nftPoSContractAddr);
    }

    /**
     * @dev See {IBukProtocol-setTokenUri}.
     */
    function setTokenUri(
        uint _tokenId,
        string memory _newUri
    ) external onlyRole(ADMIN_ROLE) {
        IBukNFTs(nftContract).setURI(_tokenId, _newUri);
        emit SetTokenURI(_tokenId, _newUri);
    }

    /**
     * @dev See {IBukProtocol-setRoyaltyInfo}.
     */
    function setOtherRoyaltyInfo(
        address[] memory _recipients,
        uint96[] memory _royaltyFractions
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _recipients.length == _royaltyFractions.length,
            "Input arrays must have the same length"
        );
        delete _otherRoyalties;
        for (uint i = 0; i < _recipients.length; i++) {
            require(_royaltyFractions[i] <= 100, "Percentage is more than 100");
            Royalty memory newRoyalty = Royalty(
                _recipients[i],
                _royaltyFractions[i]
            );
            _otherRoyalties.push(newRoyalty);
        }
    }

    /**
     * @dev See {IBukProtocol-setBukRoyaltyInfo}.
     */
    function setBukRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        bukRoyalty = _royaltyFraction;
    }

    /**
     * @dev See {IBukProtocol-setHotelRoyaltyInfo}.
     */
    function setHotelRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        hotelRoyalty = _royaltyFraction;
    }

    /**
     * @dev See {IBukProtocol-setFirstOwnerRoyaltyInfo}.
     */
    function setFirstOwnerRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        firstOwnerRoyalty = _royaltyFraction;
    }

    /**
     * @dev See {IBukProtocol-updateNFTName}.
     */
    function updateNFTName(
        string memory _contractName
    ) external onlyRole(ADMIN_ROLE) {
        IBukNFTs(nftContract).updateName(_contractName);
        emit UpdateContractName(_contractName);
    }

    /**
     * @dev See {IBukProtocol-setCommission}.
     */
    function setCommission(uint8 _commission) external onlyRole(ADMIN_ROLE) {
        commission = _commission;
        emit SetCommission(_commission);
    }

    /**
     * @dev See {IBukProtocol-bookRoom}.
     */
    function bookRoom(
        uint256 _count,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external nonReentrant returns (bool) {
        require(
            ((_total.length == _baseRate.length) &&
                (_total.length == _count) &&
                (_count > 0)),
            "Array sizes mismatch"
        );
        uint256[] memory bookings = new uint256[](_count);
        uint total = 0;
        uint commissionTotal = 0;
        for (uint8 i = 0; i < _count; ++i) {
            ++_bookingIds;
            uint256 minSalePrice_ = (_total[i] * MIN_SALE_PERCENTAGE) / 100;
            bookingDetails[_bookingIds] = Booking(
                _bookingIds,
                BookingStatus.booked,
                0,
                _msgSender(),
                _checkin,
                _checkout,
                _total[i],
                _baseRate[i],
                minSalePrice_,
                _tradeTimeLimit,
                _tradeable
            );
            bookings[i] = _bookingIds;
            total += _total[i];
            commissionTotal += (_baseRate[i] * commission) / 100;
            emit BookRoom(_bookingIds);
        }
        return _bookingPayment(commissionTotal, total);
    }

    /**
     * @dev See {IBukProtocol-bookingRefund}.
     */
    function bookingRefund(
        uint256[] memory _ids,
        address _owner
    ) external onlyRole(ADMIN_ROLE) {
        uint256 len = _ids.length;
        require((len > 0), "Array is empty");
        for (uint8 i = 0; i < len; ++i) {
            require(
                bookingDetails[_ids[i]].firstOwner == _owner,
                "Check the booking owner"
            );
            require(
                bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
        }
        uint total = 0;
        for (uint8 i = 0; i < len; ++i) {
            bookingDetails[_ids[i]].status = BookingStatus.cancelled;
            total +=
                bookingDetails[_ids[i]].total +
                (bookingDetails[_ids[i]].baseRate * commission) /
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
                bookingDetails[_ids[i]].status == BookingStatus.booked,
                "Check the Booking status"
            );
            require(
                bookingDetails[_ids[i]].firstOwner == _msgSender(),
                "Only booking owner has access"
            );
        }
        IBukNFTs bukNftsContract = IBukNFTs(nftContract);
        for (uint8 i = 0; i < len; ++i) {
            bookingDetails[_ids[i]].status = BookingStatus.confirmed;
            bukNftsContract.mint(
                _ids[i],
                bookingDetails[_ids[i]].firstOwner,
                1,
                "",
                _uri[i]
            );
            bookingDetails[_ids[i]].tokenID = _ids[i];
        }
        emit MintBookingNFT(_ids, true);
    }

    /**
     * @dev See {IBukProtocol-checkin}.
     */
    function checkin(uint256[] memory _ids) external onlyAdminOwner(_ids) {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            require(
                bookingDetails[_ids[i]].status == BookingStatus.confirmed,
                "Check the Booking status"
            );
        }
        for (uint8 i = 0; i < len; ++i) {
            bookingDetails[_ids[i]].status = BookingStatus.checkedin;
            bookingDetails[_ids[i]].tradeable = false;
        }
        emit CheckinRooms(_ids, true);
    }

    /**
     * @dev See {IBukProtocol-checkout}.
     */
    function checkout(uint256[] memory _ids) external onlyRole(ADMIN_ROLE) {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            require(
                bookingDetails[_ids[i]].status == BookingStatus.checkedin,
                "Check the Booking status"
            );
        }
        for (uint8 i = 0; i < len; ++i) {
            bookingDetails[_ids[i]].status = BookingStatus.checkedout;
            IBukNFTs(nftContract).burn(
                bookingDetails[_ids[i]].firstOwner,
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
        uint256 _charges
    ) external onlyRole(ADMIN_ROLE) {
        require(
            (bookingDetails[_id].status == BookingStatus.confirmed),
            "Not a confirmed Booking"
        );
        require(
            ((_penalty + _refund + _charges) < (bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        IBukNFTs bukNftsContract = IBukNFTs(nftContract);
        bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.cancelUSDCRefund(_penalty, _bukWallet);
        _bukTreasury.cancelUSDCRefund(_refund, bookingDetails[_id].firstOwner);
        _bukTreasury.cancelUSDCRefund(_charges, _bukWallet);
        bukNftsContract.burn(bookingDetails[_id].firstOwner, _id, 1, false);
        emit CancelRoom(_id, true);
    }

    /**
     * @dev See {IBukProtocol-getBookingDetails}.
     */
    function getBookingDetails(
        uint256 _tokenId
    ) external view returns (Booking memory) {
        return bookingDetails[_tokenId];
    }

    /**
     * @dev See {IBukProtocol-getRoyaltyInfo}.
     */
    function getRoyaltyInfo(
        uint256 _tokenId
    ) external view returns (Royalty[] memory) {
        Royalty[] memory royalties = new Royalty[](_otherRoyalties.length + 3);
        royalties[0] = Royalty(address(_bukTreasury), bukRoyalty);
        royalties[1] = Royalty(address(_bukTreasury), hotelRoyalty);
        royalties[2] = Royalty(
            bookingDetails[_tokenId].firstOwner,
            firstOwnerRoyalty
        );
        for (uint i = 0; i < _otherRoyalties.length; i++) {
            royalties[i + 3] = _otherRoyalties[i];
        }
        return royalties;
    }

    /**
     * @dev Function to do the booking payment.
     * @param _commission Total BUK commission.
     * @param _total Total Booking Charge Excluding BUK commission.
     */

    function _bookingPayment(
        uint256 _commission,
        uint256 _total
    ) internal returns (bool) {
        require(
            _currency.balanceOf(_msgSender()) >= _total + _commission,
            "Insufficient balance for booking"
        );

        require(
            _currency.transferFrom(_msgSender(), _bukWallet, _commission),
            "Commission transfer failed"
        );

        require(
            _currency.transferFrom(_msgSender(), address(_bukTreasury), _total),
            "Booking payment failed"
        );

        return true;
    }
}
