//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../BukRoyalties/IBukRoyalties.sol";
import "../BukProtocol/IBukProtocol.sol";

contract BukRoyalties is AccessControl, IBukRoyalties {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IBukProtocol public bukProtocolContract;
    Royalty public bukRoyalty;
    Royalty public hotelRoyalty;
    uint96 public firstOwnerFraction;

    Royalty[] public otherRoyalties;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev See {IBukProtocol-setBukProtocolContract}.
     */
    function setBukProtocolContract(
        address _bukProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _bukProtocolContract != address(0),
            "Buk Protocol Address cannot be zero"
        );
        address oldBukProtocolContract = address(bukProtocolContract);
        bukProtocolContract = IBukProtocol(_bukProtocolContract);
        emit SetBukProtocol(oldBukProtocolContract, _bukProtocolContract);
    }

    /**
     * @dev See {IBukProtocol-setBukRoyaltyInfo}.
     */
    function setBukRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _royaltyFraction <= 10000,
            "Royalty fraction is more than 10000"
        );
        uint96 bukRoyalty_ = bukRoyalty.royaltyFraction;
        bukRoyalty = Royalty(_recipient, _royaltyFraction);
        emit SetBukRoyalty(bukRoyalty_, _royaltyFraction);
    }

    /**
     * @dev See {IBukProtocol-setHotelRoyaltyInfo}.
     */
    function setHotelRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _royaltyFraction <= 10000,
            "Royalty fraction is more than 10000"
        );
        uint96 hotelRoyalty_ = hotelRoyalty.royaltyFraction;
        hotelRoyalty = Royalty(_recipient, _royaltyFraction);
        emit SetHotelRoyalty(hotelRoyalty_, _royaltyFraction);
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
        uint96 firstOwnerFraction_ = firstOwnerFraction;
        firstOwnerFraction = _royaltyFraction;
        emit SetFirstOwnerRoyalty(firstOwnerFraction_, _royaltyFraction);
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
        uint256 totalRoyalties_ = bukRoyalty.royaltyFraction +
            hotelRoyalty.royaltyFraction +
            firstOwnerFraction;
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
     * @dev See {IBukProtocol-getRoyaltyInfo}.
     */
    function getRoyaltyInfo(
        uint256 _tokenId
    ) external view returns (Royalty[] memory) {
        IBukProtocol.Booking memory bookingDetails_ = bukProtocolContract.getBookingDetails(
            _tokenId
        );
        Royalty[] memory royalties = new Royalty[](otherRoyalties.length + 3);
        royalties[0] = bukRoyalty;
        royalties[1] = hotelRoyalty;
        royalties[2] = Royalty(bookingDetails_.firstOwner, firstOwnerFraction);
        for (uint i = 0; i < otherRoyalties.length; i++) {
            royalties[i + 3] = otherRoyalties[i];
        }
        return royalties;
    }
}
