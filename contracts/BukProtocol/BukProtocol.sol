// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../BukPOSNFTs/IBukPOSNFTs.sol";
import "../BukNFTs/IBukNFTs.sol";
import "../BukTreasury/IBukTreasury.sol";
import "../SignatureVerifier/ISignatureVerifier.sol";
import "./IBukProtocol.sol";

/**
 * @title BUK Protocol Contract
 * @author BUK Technology Inc
 * @dev Contract to manage operations of the BUK protocol to manage BukNFTs tokens and underlying sub-contracts.
 */
contract BukProtocol is AccessControl, ReentrancyGuard, IBukProtocol {
    using SafeERC20 for IERC20;

    /**
     * @dev address _bukWallet        Address of the Buk wallet.
     * @dev address _stableToken          Address of the stable token.
     * @dev address _bukTreasury          Address of the Buk treasury contract.
     * @dev address nftContract Address of the Buk NFT contract.
     * @dev address nftPoSContract  Address of the Buk NFT PoS Contract.
     */
    address private _bukWallet;
    IERC20 private _stableToken;
    IBukTreasury private _bukTreasury;
    ISignatureVerifier private _signatureVerifier;
    IBukNFTs public nftContract;
    IBukPOSNFTs public nftPoSContract;

    //Buk, Hotel, First Owner and other Royalties
    uint96 public bukRoyalty;
    uint96 public hotelRoyalty;
    uint96 public firstOwnerRoyalty;
    Royalty[] public otherRoyalties;

    /**
     * @dev Commission charged on bookings.
     */
    uint8 public commission = 5;

    /**
     * @dev Counters.Counter bookingIds    Counter for booking IDs.
     */
    uint256 private _bookingIds;

    //COMMENT Need to add comment to this

    /**
     * @dev Constant for the role of admin
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /**
     * @dev mapping(uint256 => Booking) _bookingDetails   Mapping of booking IDs to booking details.
     */
    mapping(uint256 => Booking) private _bookingDetails; //bookingID -> Booking Details

    //Modifier to check if the sender is either admin or an owner of the booking
    modifier onlyAdminOwner(uint256[] memory _ids) {
        uint256 len = _ids.length;
        for (uint8 i = 0; i < len; ++i) {
            require(
                hasRole(ADMIN_ROLE, _msgSender()) ||
                    (nftContract.balanceOf(_msgSender(), _ids[i]) > 0),
                "Only admin or owner of the NFT can access the booking"
            );
        }
        _;
    }

    /**
     * @dev Constructor to initialize the contract
     * @param _bukTreasuryContract Address of the treasury.
     * @param _stableTokenAddress Address of the stable token.
     * @param _bukWalletAddress Address of the Buk wallet.
     */
    constructor(
        address _bukTreasuryContract,
        address _stableTokenAddress,
        address _bukWalletAddress,
        address _sigVerifier
    ) {
        _signatureVerifier = ISignatureVerifier(_sigVerifier);
        _setBukTreasury(_bukTreasuryContract);
        _setStableToken(_stableTokenAddress);
        _setBukWallet(_bukWalletAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev See {IBukProtocol-setSignatureVerifier}.
     */
    function setSignatureVerifier(
        address __signatureVerifier
    ) external onlyRole(ADMIN_ROLE) {
        _setSignatureVerifier(__signatureVerifier);
    }

    /**
     * @dev See {IBukProtocol-setBukTreasury}.
     */
    function setBukTreasury(
        address _bukTreasuryContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukTreasury(_bukTreasuryContract);
    }

    /**
     * @dev See {IBukProtocol-setStableToken}.
     */
    function setStableToken(
        address _stableTokenAddress
    ) external onlyRole(ADMIN_ROLE) {
        _setStableToken(_stableTokenAddress);
    }

    /**
     * @dev See {IBukProtocol-setBukWallet}.
     */
    function setBukWallet(
        address _bukWalletAddress
    ) external onlyRole(ADMIN_ROLE) {
        _setBukWallet(_bukWalletAddress);
    }

    /**
     * @dev See {IBukProtocol-setBukNFTs}.
     */
    function setBukNFTs(
        address _nftContractAddr
    ) external onlyRole(ADMIN_ROLE) {
        //Check address is not zero
        require(
            _nftContractAddr != address(0),
            "Address cannot be zero"
        );
        address oldNftContractAddr_ = address(nftContract);
        nftContract = IBukNFTs(_nftContractAddr);
        emit SetBukNFTs(oldNftContractAddr_, _nftContractAddr);
    }

    /**
     * @dev See {IBukProtocol-setBukPosNFTs}.
     */
    function setBukPoSNFTs(
        address _nftPoSContractAddr
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _nftPoSContractAddr != address(0),
            "Address cannot be zero"
        );
        address oldNftPoSContractAddr_ = address(nftPoSContract);
        nftPoSContract = IBukPOSNFTs(_nftPoSContractAddr);
        emit SetBukPoSNFTs(oldNftPoSContractAddr_, _nftPoSContractAddr);
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
     * @dev See {IBukProtocol-setBukRoyaltyInfo}.
     */
    function setBukRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        //SUM of all the royalties should be less than 10000
        require(
            _royaltyFraction <= 10000,
            "Royalty fraction is more than 10000"
        );
        uint96 bukRoyalty_ = bukRoyalty;
        bukRoyalty = _royaltyFraction;
        emit SetRoyalty(bukRoyalty_, _royaltyFraction);
    }

    /**
     * @dev See {IBukProtocol-setHotelRoyaltyInfo}.
     */
    function setHotelRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _royaltyFraction <= 10000,
            "Royalty fraction is more than 10000"
        );
        uint96 hotelRoyalty_ = hotelRoyalty;
        hotelRoyalty = _royaltyFraction;
        emit SetRoyalty(hotelRoyalty_, _royaltyFraction);
    }

    /**
     * @dev See {IBukProtocol-setFirstOwnerRoyaltyInfo}.
     */
    function setFirstOwnerRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _royaltyFraction <= 10000,
            "Royalty fraction is more than 10000"
        );
        uint96 firstOwnerRoyalty_ = firstOwnerRoyalty;
        firstOwnerRoyalty = _royaltyFraction;
        emit SetRoyalty(firstOwnerRoyalty_, _royaltyFraction);
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
        uint96[] memory oldRoyalties_ = new uint96[](otherRoyalties.length);
        for (uint i = 0; i < otherRoyalties.length; i++) {
            oldRoyalties_[i] = otherRoyalties[i].royaltyFraction;
        }
        uint256 totalRoyalties_ = bukRoyalty + hotelRoyalty + firstOwnerRoyalty;
        for (uint i = 0; i < _recipients.length; i++) {
            require(
                _royaltyFractions[i] <= 10000,
                "Royalty fraction is more than 10000"
            );
            totalRoyalties_ += _royaltyFractions[i];
        }
        require(
            totalRoyalties_ < 10000,
            "Total Royalties cannot be more than 10000"
        );
        delete otherRoyalties;
        for (uint i = 0; i < _recipients.length; i++) {
            Royalty memory newRoyalty = Royalty(
                _recipients[i],
                _royaltyFractions[i]
            );
            otherRoyalties.push(newRoyalty);
        }
        emit SetOtherRoyalties(oldRoyalties_, _royaltyFractions);
    }

    /**
     * @dev See {IBukProtocol-setNFTContractName}.
     */
    function setNFTContractName(
        string memory _contractName
    ) external onlyRole(ADMIN_ROLE) {
        string memory oldContractName_ = IBukNFTs(nftContract).name();
        IBukNFTs(nftContract).setNFTContractName(_contractName);
        emit SetNFTContractName(oldContractName_, _contractName);
    }

    /**
     * @dev See {IBukProtocol-setCommission}.
     */
    function setCommission(uint8 _newCommission) external onlyRole(ADMIN_ROLE) {
        require(
            _newCommission <= 100,
            "Commission is more than 100"
        );
        uint oldCommission_ = commission;
        commission = _newCommission;
        emit SetCommission(oldCommission_, _newCommission);
    }

    /**
     * @dev See {IBukProtocol-toggleTradeability}.
     */
    function toggleTradeability(
        uint256 _tokenId
    ) external onlyRole(ADMIN_ROLE) {
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
        uint256 _count,
        uint256[] memory _total,
        uint256[] memory _baseRate,
        uint256[] memory _minSalePrice,
        uint256 _checkin,
        uint256 _checkout,
        uint256 _tradeTimeLimit,
        bool _tradeable
    ) external nonReentrant returns (bool) {
        require(
            (_checkin > block.timestamp),
            "Checkin date should be greater than current date"
        );
        require(
            (_checkout > _checkin),
            "Checkout date should be greater than checkin date"
        );
        uint256 total = 0;
        for (uint8 i = 0; i < _count; ++i) {
            total += _total[i];
        }
        require(
            (_stableToken.allowance(_msgSender(), address(this)) >= total),
            "Check the allowance of the sender"
        );
        require(
            ((_total.length == _baseRate.length) && 
            (_total.length == _minSalePrice.length) && 
            (_total.length == _count) &&  (_count > 0)),
            "Array sizes mismatch"
        );

        uint256[] memory bookings = new uint256[](_count);
        uint commissionTotal = 0;
        for (uint8 i = 0; i < _count; ++i) {
            ++_bookingIds;
            _bookingDetails[_bookingIds] = Booking(
                _bookingIds,
                BookingStatus.booked,
                0,
                _msgSender(),
                _checkin,
                _checkout,
                _total[i],
                _baseRate[i],
                _minSalePrice[i],
                _tradeTimeLimit,
                _tradeable
            );
            bookings[i] = _bookingIds;
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
                _bookingDetails[_ids[i]].firstOwner == _msgSender(),
                "Only booking owner has access"
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
            _bookingDetails[_ids[i]].tokenID = _ids[i];
        }
        emit MintedBookingNFT(_ids, true);
    }

    /**
     * @dev See {IBukProtocol-checkin}.
     */
    function checkin(uint256[] memory _ids) external onlyAdminOwner(_ids) {
        uint256 len = _ids.length;
        require(((len > 0) && (len < 11)), "Not in max-min booking limit");
        for (uint8 i = 0; i < len; ++i) {
            require(
                _bookingDetails[_ids[i]].status == BookingStatus.confirmed,
                "Check the Booking status"
            );
        }
        for (uint8 i = 0; i < len; ++i) {
            _bookingDetails[_ids[i]].status = BookingStatus.checkedin;
            _bookingDetails[_ids[i]].tradeable = false;
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
            IBukNFTs(nftContract).burn(
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
    ) external onlyRole(ADMIN_ROLE) {
        //Check if _bookingOwner is the current owner of the booking
        require(
            nftContract.balanceOf(_bookingOwner, _id) > 0,
            "Check the booking owner"
        );

        // hash message
        bytes32 hash = keccak256(
            abi.encodePacked(_id, _penalty, _refund, _charges)
        );

        address signer = _signatureVerifier.verify(hash, _signature);

        // Verify recovered address matches booking owner
        require(signer == _bookingOwner, "Invalid owner signature");

        require(
            ((_bookingDetails[_id].status == BookingStatus.confirmed) ||
                (_bookingDetails[_id].status == BookingStatus.checkedin)),
            "Not a confirmed or checkedin Booking"
        );
        require(
            ((_penalty + _refund + _charges) < (_bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        _bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.cancelUSDCRefund(_penalty, _bukWallet);
        _bukTreasury.cancelUSDCRefund(_refund, _bookingOwner);
        _bukTreasury.cancelUSDCRefund(_charges, _bukWallet);
        //TODO Change the condition to check if the NFT is burned from the current owner
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
    ) external onlyRole(ADMIN_ROLE) {
        require(
            nftContract.balanceOf(_bookingOwner, _id) > 0,
            "Check the booking owner"
        );

        require(
            ((_bookingDetails[_id].status == BookingStatus.confirmed) ||
                (_bookingDetails[_id].status == BookingStatus.checkedin)),
            "Not a confirmed or checkedin Booking"
        );
        require(
            ((_refund + _charges) < (_bookingDetails[_id].total + 1)),
            "Transfer amount exceeds total"
        );
        _bookingDetails[_id].status = BookingStatus.cancelled;
        _bukTreasury.cancelUSDCRefund(_refund, _bookingOwner);
        _bukTreasury.cancelUSDCRefund(_charges, address(_bukTreasury));
        nftContract.burn(_bookingOwner, _id, 1, false);
        emit CancelRoom(_id, true);
    }

    /**
     * @dev See {IBukProtocol-getWallets}.
     */
    function getWallets()
        external
        view
        onlyRole(ADMIN_ROLE)
        returns (address bukTreasury, address bukWallet, address stableToken)
    {
        return (
            address(_bukTreasury),
            address(_bukWallet),
            address(_stableToken)
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
    ) external view returns (Royalty[] memory) {
        Royalty[] memory royalties = new Royalty[](otherRoyalties.length + 3);
        royalties[0] = Royalty(address(_bukTreasury), bukRoyalty);
        royalties[1] = Royalty(address(_bukTreasury), hotelRoyalty);
        royalties[2] = Royalty(
            _bookingDetails[_tokenId].firstOwner,
            firstOwnerRoyalty
        );
        for (uint i = 0; i < otherRoyalties.length; i++) {
            royalties[i + 3] = otherRoyalties[i];
        }
        return royalties;
    }

    /**
     * Internal function to set the Signature Verifier contract address
     * @param _signatureVerifierContract The address of the Signature Verifier contract
     */
    function _setSignatureVerifier(
        address _signatureVerifierContract
    ) internal {
        _signatureVerifier = ISignatureVerifier(_signatureVerifierContract);
        emit SetSignerVerifier(address(_signatureVerifierContract));
    }

    /**
     * Internal function to set the BukTreasury contract address
     * @param _bukTreasuryContract The address of the BukTreasury contract
     */
    function _setBukTreasury(address _bukTreasuryContract) private {
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(_bukTreasuryContract);
    }

    /**
     * Internal function to set the BukWallet contract address
     * @param _bukWalletAddress The address of the BukWallet contract
     */
    function _setBukWallet(address _bukWalletAddress) private {
        _bukWallet = _bukWalletAddress;
        emit SetBukWallet(_bukWalletAddress);
    }

    /**
     * Internal function to set the stable token contract address
     * @param _stableTokenAddress The address of the stable token contract
     */
    function _setStableToken(address _stableTokenAddress) private {
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
            _stableToken.balanceOf(_msgSender()) >= _total + _commission,
            "Insufficient balance for booking"
        );
        _stableToken.safeTransferFrom(
            _msgSender(),
            _bukWallet,
            _commission
        );
        _stableToken.safeTransferFrom(
            _msgSender(), 
            address(_bukTreasury), 
            _total
        );
        return true;
    }
}
