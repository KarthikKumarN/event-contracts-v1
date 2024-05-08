//SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IBukRoyalties } from "../BukRoyalties/IBukRoyalties.sol";
import { IBukEventProtocol } from "../BukEventProtocol/IBukEventProtocol.sol";

/**
 * @title BukRoyalties contract
 * @author BUK Technology Inc
 * @dev Contract to manage the royalties of the Buk NFTs.
 */
contract BukRoyalties is AccessControl, IBukRoyalties {
    /**
     * @dev Constant for the role of the admin
     * @notice its a hash of keccak256("ADMIN_ROLE")
     */
    bytes32 public constant ADMIN_ROLE =
        0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775;

    /// @dev Address of the Buk Event Protocol contract
    IBukEventProtocol public bukEventProtocolContract;

    /**
     * @dev Public variable representing the Buk POS NFT collection contract.
     * It holds the address of the Buk Royalty contract.
     */
    Royalty public bukRoyalty;

    /**
     * @dev Public variable representing the Buk POS NFT collection contract.
     * It holds the address of the Hotel Royalty contract.
     */
    Royalty public hotelRoyalty;

    /**
     * @dev Unsigned integer representing the fraction of ownership held by the first owner.
     * The value is stored as a uint96 data type.
     */
    uint96 public firstOwnerFraction;

    /**
     * @dev Dynamic array of the Royalty type representing other royalty contracts associated
     * with the Buk POS NFT collection contract.
     */
    Royalty[] public otherRoyalties;

    /**
     * @dev Constructor to initialize the contract.
     * This constructor assigns the DEFAULT_ADMIN_ROLE and ADMIN_ROLE to the contract deployer.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /// @dev See {IBukRoyalties-setBukEventProtocolContract}.
    function setBukEventProtocolContract(
        address _bukEventProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        require(_bukEventProtocolContract != address(0), "Invalid address");
        address oldBukEventProtocolContract = address(bukEventProtocolContract);
        bukEventProtocolContract = IBukEventProtocol(_bukEventProtocolContract);
        emit SetBukEventProtocol(
            oldBukEventProtocolContract,
            _bukEventProtocolContract
        );
    }

    /// @dev See {IBukRoyalties-setBukRoyaltyInfo}.
    function setBukRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(_royaltyFraction <= 10000, "Royalty is more than 10000");
        uint96 bukRoyalty_ = bukRoyalty.royaltyFraction;
        bukRoyalty = Royalty(_recipient, _royaltyFraction);
        emit SetBukRoyalty(bukRoyalty_, _royaltyFraction);
    }

    /// @dev See {IBukRoyalties-setHotelRoyaltyInfo}.
    function setHotelRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(_royaltyFraction <= 10000, "Royalty is more than 10000");
        uint96 hotelRoyalty_ = hotelRoyalty.royaltyFraction;
        hotelRoyalty = Royalty(_recipient, _royaltyFraction);
        emit SetHotelRoyalty(hotelRoyalty_, _royaltyFraction);
    }

    /// @dev See {IBukRoyalties-setFirstOwnerRoyaltyInfo}.
    function setFirstOwnerRoyaltyInfo(
        uint96 _royaltyFraction
    ) external onlyRole(ADMIN_ROLE) {
        require(_royaltyFraction <= 10000, "Royalty is more than 10000");
        uint96 firstOwnerFraction_ = firstOwnerFraction;
        firstOwnerFraction = _royaltyFraction;
        emit SetFirstOwnerRoyalty(firstOwnerFraction_, _royaltyFraction);
    }

    /// @dev See {IBukRoyalties-setRoyaltyInfo}.
    function setOtherRoyaltyInfo(
        address[] memory _recipients,
        uint96[] memory _royaltyFractions
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _recipients.length == _royaltyFractions.length,
            "Arrays must have the same length"
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
                "Royalty is more than 10000"
            );
            totalRoyalties_ += _royaltyFractions[i];
        }
        require(totalRoyalties_ < 10000, "Total cannot be more than 10000");
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

    /// @dev See {IBukRoyalties-getRoyaltyInfo}.
    function getRoyaltyInfo(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (Royalty[] memory) {
        IBukEventProtocol.Booking
            memory bookingDetails_ = bukEventProtocolContract
                .getEventBookingDetails(_eventAddress, _tokenId);
        (_tokenId);
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
