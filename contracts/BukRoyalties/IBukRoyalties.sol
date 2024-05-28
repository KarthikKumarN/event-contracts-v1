// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title Interface to define the BUK royalties.
 * @author BUK Technology Inc
 * @dev Collection of all functions related to the BUK Royalties.
 */
interface IBukRoyalties {
    /**
     * @dev Struct named Royalty to store royalty information.
     * @param address receiver           The address of the receiver who will receive the royalty
     * @param uint96 royaltyFraction     The fraction of the royalty to be paid, expressed as an unsigned 96-bit integer
     */
    struct Royalty {
        address receiver;
        uint96 royaltyFraction;
    }

    /**
     * @dev Emitted when new buk protocol address has been updated
     * @param oldBukEventProtocol, old buk protocol address
     * @param newBukEventProtocol, new buk protocol address
     */
    event SetBukEventProtocol(
        address oldBukEventProtocol,
        address newBukEventProtocol
    );

    /**
     * @dev Emitted when new Buk royalty has been updated
     * @param oldRoyalty, old buk royalty
     * @param newRoyalty, new buk royalty
     * @notice This event is used when Buk royalty is updated
     */
    event SetBukRoyalty(uint96 oldRoyalty, uint96 newRoyalty);

    /**
     * @dev Emitted when Hotel royalty has been updated
     * @param oldRoyalty, old buk royalty
     * @param newRoyalty, new buk royalty
     * @notice This event is used when Hotel royalty is updated
     */
    event SetHotelRoyalty(uint96 oldRoyalty, uint96 newRoyalty);

    /**
     * @dev Emitted when First Owner royalty has been updated
     * @param oldRoyalty, old buk royalty
     * @param newRoyalty, new buk royalty
     * @notice This event is used when First Owner royalty is updated
     */
    event SetFirstOwnerRoyalty(uint96 oldRoyalty, uint96 newRoyalty);

    /**
     * @dev Emitted when other royalties are updated
     * @param oldRoyalty, array of old royalties
     * @param newRoyalty, array od new royalties
     */
    event SetOtherRoyalties(uint96[] oldRoyalty, uint96[] newRoyalty);

    /**
     * @dev Sets the Buk Protocol address.
     * Can only be called by accounts with the ADMIN_ROLE.
     * @param _bukProtocolContract The new Buk Protocol address to set.
     * @dev If {_bukProtocolContract} is the zero address, the function will revert.
     * @dev Emits a {SetBukEventProtocol} event with the previous Buk Protocol address and the new address.
     * @notice This function updates the Buk Protocol address and emits an event.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukEventProtocolContract(address _bukProtocolContract) external;

    /**
     * @dev Function to define the royalty Fraction for Buk.
     * @param _recipient Recipient address.
     * @param _royaltyFraction Royalty Fraction.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external;

    /**
     * @dev Function to define the royalty Fraction for Hotel.
     * @param _recipient Recipient address.
     * @param _royaltyFraction Royalty Fraction.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setHotelRoyaltyInfo(
        address _recipient,
        uint96 _royaltyFraction
    ) external;

    /**
     * @dev Function to define the royalty Fraction for the First Owners.
     * @param _royaltyFraction Royalty Fraction.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setFirstOwnerRoyaltyInfo(uint96 _royaltyFraction) external;

    /**
     * @dev Function to define the royalties.
     * @param _recipients Array of recipients of royalties
     * @param _royaltyFractions Array of percentages for each recipients in the _recipients[] order.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setOtherRoyaltyInfo(
        address[] memory _recipients,
        uint96[] memory _royaltyFractions
    ) external;

    /**
     * @dev Function to retrieve royalty information.
     * @param _eventAddress Contract address of the Event.
     * @param _tokenId ID of the token
     * @notice Token ID and Booking ID are same.
     */
    function getRoyaltyInfo(
        address _eventAddress,
        uint256 _tokenId
    ) external view returns (Royalty[] memory);
}
