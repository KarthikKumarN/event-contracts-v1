// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukProtocol {
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
     * @dev Struct for booking details.
     * @param uint256 id                Booking ID.
     * @param BookingStatus status      Booking status.
     * @param uint256 tokenID           Token ID.
     * @param address owner             Address of the booking owner.
     * @param uint256 checkin           Check-in date.
     * @param uint256 checkout          Check-out date.
     * @param uint256 total             Total price.
     * @param uint256 baseRate          Base rate.
     * @param uint256 minSalePrice      Min Sale Price.
     * @param uint256 tradeTimeLimit    Buy will excecute if tradeLimitTime is not crossed (in hours)
     * @param bool tradeable            Is the NFT Tradeable.
     */
    struct Booking {
        uint256 id;
        BookingStatus status;
        uint256 tokenID;
        address firstOwner;
        uint256 checkin;
        uint256 checkout;
        uint256 total;
        uint256 baseRate;
        uint256 minSalePrice;
        uint256 tradeTimeLimit;
        bool tradeable;
    }

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
     * @dev Emitted when the commission is set.
     */
    event SetCommission(uint256 indexed oldCommission, uint256 indexed newCommission);

    /**
     * @dev Emitted when token uri is set.
     */
    event SetTokenURI(uint256 indexed nftId, string indexed uri);

    /**
     * @dev Emitted when BukNFTs contract address is updated.
     */
    event SetBukNFTs(address indexed oldNftContract, address indexed newNftContract);

    /**
     * @dev Emitted when BukPOSNFTs contract address is updated.
     */
    event SetBukPoSNFTs(address indexed oldNftPoSContract, address indexed newNftPoSContract);

    /**
     * @dev Emitted when signer verifier is updated.
     */
    event SetSignerVerifier(address indexed signerVerifier);

    /**
     * @dev Emitted when Buk treasury is updated.
     */
    event SetBukTreasury(address indexed treasuryContract);

    /**
     * @dev Emitted when Buk Wallet is updated.
     */
    event SetBukWallet(address indexed bukWalletContract);

    /**
     * @dev Emitted when stable token is updated.
     */
    event SetStableToken(address indexed _stableToken);

    /**
     * @dev Emitted when new royalty has been updated
     * @param oldRoyalty, old buk royalty
     * @param newRoyalty, new buk royalty
     * @notice This event is used when Buk, Hotel and First Owner royalties are updated
     */
    event SetRoyalty(uint96 oldRoyalty, uint96 newRoyalty);

    /**
     * @dev Emitted when other royalties are updated
     * @param oldRoyalty, array of old royalties
     * @param newRoyalty, array od new royalties
     */
    event SetOtherRoyalties(uint96[] oldRoyalty, uint96[] newRoyalty);

    /**
     * @dev Emitted when the tradeability of a Buk NFT is toggled.
     * @param _tokenId Token Id whose tradeability is being toggled.
     */
    event ToggleTradeability(uint256 indexed _tokenId, bool _tradeable);

    /**
     * @dev Emitted when single room is booked.
     */
    event BookRoom(uint256 indexed booking);

    /**
     * @dev Emitted when booking refund is done.
     */
    event BookingRefund(uint256 indexed total, address indexed owner);

    /**
     * @dev Emitted when room bookings are confirmed.
     */
    event MintedBookingNFT(uint256[] indexed bookings, bool indexed status);

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
    event SetNFTContractName(string indexed oldContractName, string indexed newContractName);

    /**
     * @dev This function is used to set the address of the signature verifier contract.
     * @param _signatureVerifier The address of the signature verifier contract.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setSignatureVerifier(address _signatureVerifier) external;

    /**
     * @dev Function to update the treasury address.
     * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukTreasury(address _bukTreasuryContract) external;

    /**
     * @dev Function to update the Buk Wallet address to collect commission.
     * @param _bukWalletContract Address of the Buk Wallet.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukWallet(address _bukWalletContract) external;

    /**
     * @dev Function to update the stable token address.
     * @param _stableToken Address of the stable token contract.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setStableToken(address _stableToken) external;

    /**
     * @dev Function to update the BukNFTs contract address.
     * @param _nftContractAddr Address of the BukNFTs contract.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukNFTs(address _nftContractAddr) external;

    /**
     * @dev Function to update the BukPOSNFTs contract address.
     * @param _nftPoSContractAddr Address of the BukPOSNFTs contract.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukPoSNFTs(address _nftPoSContractAddr) external;

    /**
     * @dev Function to update the token uri.
     * @param _tokenId Token Id.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setTokenUri(uint _tokenId, string memory _newUri) external;

    /**
     * @dev Function to define the royalty Fraction for Buk.
     * @param _royaltyFraction Royalty Fraction.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setBukRoyaltyInfo(uint96 _royaltyFraction) external;

    /**
     * @dev Function to define the royalty Fraction for Hotel.
     * @param _royaltyFraction Royalty Fraction.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setHotelRoyaltyInfo(uint96 _royaltyFraction) external;

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
     * @dev Set the name of the contract.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
     */
    function setNFTContractName(string memory _contractName) external;

    /**
     * @dev Function to set the Buk commission percentage.
     * @param _commission Commission percentage.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function setCommission(uint8 _commission) external;

    /**
     * @dev Function to toggle the tradeability of an asset.
     * @param _tokenId Token Id whose tradeability is being toggled.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function toggleTradeability(uint256 _tokenId) external;

    /**
     * @dev Function to book rooms.
     * @param _count Number of rooms to be booked.
     * @param _total Total amount to be paid.
     * @param _baseRate Base rate of the room.
     * @param _minSalePrice Minimum sale price for the booking.
     * @param _checkin Checkin date.
     * @param _checkout Checkout date.
     * @param _tradeTimeLimit Trade Limit of NFT based on Checkin time.
     * @param _tradeable Is the booking NFT tradeable.
     * @return ids IDs of the bookings.
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
    ) external returns (bool);

    /**
     * @dev Allows the admin to refund a booking by canceling it and transferring the amount to the owner.
     * @param _ids An array of booking IDs that need to be refunded.
     * @param _owner The address of the owner of the bookings.
     * @notice This function is usually executed when the booking is unsuccessful from the hotel's end.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function bookingRefund(uint256[] memory _ids, address _owner) external;

    /**
     * @dev Function to mint new BukNFT tokens based on the provided booking IDs and URIs.
     * @param _ids An array of booking IDs representing the unique identifier for each BukNFT token.
     * @param _uri An array of URIs corresponding to each booking ID, which will be associated with the Buk NFTs.
     * @notice Only the owner of the booking can book the NFTs and confirm the rooms.
     * @notice The number of bookings and URIs should be same.
     * @notice The booking status should be booked to confirm it.
     * @notice The NFTs are minted to the owner of the booking.
     */
    function mintBukNFT(uint256[] memory _ids, string[] memory _uri) external;

    /**
     * @dev Function to checkin the rooms.
     * @param _ids An array of booking IDs representing the unique identifier for each BukNFT token.
     * @notice The booking status should be confirmed to checkin it.
     * @notice Once checkedin the NFT becomes non-tradeable.
     * @notice This function can only be called by `ADMIN_ROLE` or the owner of the booking NFT
     */
    function checkin(uint256[] memory _ids) external;

    /**
     * @dev Function to checkout the rooms.
     * @param _ids IDs of the bookings.
     * @notice Only the admin can checkout the rooms.
     * @notice The booking status should be checkedin to checkout it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice The Utility NFTs are minted to the owner of the booking.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function checkout(uint256[] memory _ids) external;

    /**
     * @dev Function to cancel the room bookings.
     * @param _id ID of the booking.
     * @param _penalty Penalty amount to be refunded.
     * @param _refund Refund amount to be refunded.
     * @param _charges Charges amount to be refunded.
     * @param _bookingOwner Owner of the booking.
     * @notice Only the admin can cancel the rooms.
     * @notice The booking status should be confirmed to cancel it.
     * @notice The Active Booking NFTs are burnt from the owner's account.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function cancelRoom(
        uint256 _id,
        uint256 _penalty,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner,
        bytes memory _signature
    ) external;

    /**
     * @dev Function to perform an emergency cancellation of a booking.
     * @param _id The ID of the booking to be cancelled.
     * @param _refund The amount to be refunded to the booking owner.
     * @param _charges The charges associated with the cancellation(if any).
     * @param _bookingOwner The address of the booking owner.
     * @notice This function can only be called by `ADMIN_ROLE`
     */
    function emergencyCancellation(
        uint256 _id,
        uint256 _refund,
        uint256 _charges,
        address _bookingOwner
    ) external;

    /**
     * Function to get wallet addresses
     * @return bukTreasury The address of the bukTreasury contract
     * @return bukWallet The address of the bukWallet contract
     * @return stableToken The address of the stable token contract
     */
    function getWallets()
        external
        view
        returns (address bukTreasury, address bukWallet, address stableToken);

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
    ) external view returns (Royalty[] memory);
}
