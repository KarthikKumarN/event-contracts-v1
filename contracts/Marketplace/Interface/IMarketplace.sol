// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

/**
 * @title Interface to define the buk marketplace
 * @author Buk.technology
 * @dev Collection of all procedures related to the marketplace
 */
interface IMarketplace {
    /**
     * @title Struct to define the booking/room listing details
     * @param price, price of room/booking
     * @param tardeTimeLimt, end date for trade
     * @param status, status of listing
     */
    struct ListingDetails {
        uint256 price;
        uint256 tardeTimeLimt;
        ListingStatus status;
    }

    /**
     * @dev Enum for listing statuses.
     * @var ListingStatus.active      Listing has been active.
     * @var ListingStatus.inactive   Listing has been inactive
     * @var ListingStatus.sold   Listing has been sold
     */
    enum ListingStatus {
        active,
        inactive,
        sold
    }

    /**
     * @dev Emitted when room/booking NFT bought
     * @param previousOwner, Address of the previous owner
     * @param newOwner, Address of the new owner
     * @param tokenId, TokenId of the bought booking
     */
    event RoomBought(
        address indexed previousOwner,
        address indexed newOwner,
        uint256 tokenId
    );

    /**
     * @dev Emitted when a room/booking NFT is listed
     * @param owner, Address of the initial owner
     * @param tokenId, tokenId is the unique identifier of booking NFT
     * @param price, Price of room/booking
     */
    event ListingCreated(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 price
    );

    /**
     * @dev Emitted when an booking/room NFT is relisted
     * @param tokenId, unique number of the booking NFT
     * @param price, new price of the room/booking
     */
    event Relisted(uint256 indexed tokenId, uint256 price);

    /**
     * @dev Emitted when an booking/room is delisted
     * @dev Updates status to ListingStatus.inactive
     * @param tokenId, unique number of the booking NFT
     */
    event Delisted(uint256 indexed tokenId);

    /**
     * @dev Emitted when an booking/room is deleted from list
     * @param tokenId, unique number of the booking NFT
     */
    event DeletedListing(uint256 indexed tokenId);

    /**
     * @dev Emitted when new BukProtocol address has been updated
     * @param oldAddress, Address of the old bukProtocol
     * @param newAddress, Address of the new bukProtocol
     */
    event BukProtocolSet(address oldAddress, address newAddress);

    /**
     * @dev Emitted when new BukNFT address has been updated
     * @param oldAddress, Address of the old bukNFT
     * @param newAddress, Address of the new bukNFT
     */
    event BukNFTSet(address oldAddress, address newAddress);

    /**
     * @dev Emitted when new Treasury Wallet has been updated
     * @param oldAddress, Address of the old treasury wallet
     * @param newAddress, Address of the new treasury wallet
     */
    event TreasuryWalletSet(address oldAddress, address newAddress);

    /**
     * @dev Emitted when new Hotel Wallet has been updated
     * @param oldAddress, Address of the old hotel wallet
     * @param newAddress, Address of the new hotel wallet
     */
    event HotelWalletSet(address oldAddress, address newAddress);

    /**
     * @dev Function will create a listing of Booking/Room NFT
     * @dev Only NFT owner can list
     * @param tokenId_ room/booking NFT id
     * @param price_  price of room/booking
     * @param tardeTimeLimt_ time till tradable
     * @dev While listing will approve marketplace to excecute transfer
     */
    function createListing(
        uint256 tokenId_,
        uint256 price_,
        uint256 tardeTimeLimt_
    ) external;

    /**
     * @dev Function will delist of NFT
     * @dev NFT owner can delist
     * @param tokenId_ NFT id
     */
    function deListing(uint256 tokenId_) external;

    /**
     * @dev Function will delete listing
     * @dev NFT owner or BukProtocal can delete lisitng
     * @dev When user checkin, buk protocol call this function
     * @param tokenId_ NFT id
     */
    function deleteListing(uint256 tokenId_) external;

    /**
     * @dev Function will set price and status for listed of NFT
     * @dev Only NFT owner can update
     * @param tokenId_ NFT id
     */
    function reList(uint256 tokenId_, uint256 price_) external;

    /**
     * @dev Function will enble user buy this room/booking NFT
     * @param tokenId_ room/booking NFT id
     * @dev Calculate buk, hotel and first buyer royalty amount and
     * transfer to corresponding wallets
     * @dev Transfers NFT/Booking to buyer
     * @dev Only Marketplace contract can excecute transfer
     * @dev Buy will excecute if tradeLimitTime is not crossed and in active status
     * @dev Will delete a entry once bought
     */
    function buyRoom(uint256 tokenId_) external;

    /**
     * @dev Function will set new buk protocol address
     * @param bukProtocol_ address of new buk protocol
     */
    function setBukProtocol(address bukProtocol_) external;

    /**
     * @dev Function will set new buk NFT address
     * @param bukNFT_ address of new buk protocol
     */
    function setBukNFT(address bukNFT_) external;

    /**
     * @dev Set new buk royalty
     * @dev Only admin access to set
     * @dev Buk royalty fee applies to the all listing
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setBukRoyalty(uint8 royalty_) external;

    /**
     * @dev Set new hotel royalty
     * @dev Only admin access to set
     * @dev Hotel royalty fee applies to the all listing
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setHotelRoyalty(uint8 royalty_) external;

    /**
     * @dev Set new user royalty
     * @dev Only admin access to set
     * @dev User royalty applies to the all listing
     * @dev User royalty applies first time buyer of room
     * @param royalty_, new royalty percentage with 2 decimals
     */
    function setUserRoyalty(uint8 royalty_) external;

    /**
     * @dev Allows to set a new treasury wallet where buk royalty funds will be transfered.
     * @dev Only admin access to set
     * @param newTreasuryWallet_, Address of the new treasury wallet
     */
    function setTreasuryWallet(address newTreasuryWallet_) external;

    /**
     * @dev Allows to set a new hotel royalty wallet address where royalty will be transfered.
     * @dev Only admin access to set
     * @param newWallet_, Address of the new fee wallet
     */
    function setHotelWallet(address newWallet_) external;

    /**
     * @dev Gets stable token address
     * @return address, Address of the stable token contract
     */
    function getStableToken() external view returns (address);

    /**
     * @dev Gets current buk protocol address
     * @return address, Address of the buk protocol contract
     */
    function getBukProtocol() external view returns (address);

    /**
     * @dev Gets current buk NFT address
     * @return address, Address of the buk NFT contract
     */
    function getBukNFT() external view returns (address);

    /**
     * @dev Gets treasury wallet address
     * @return address, Address of the treasury wallet
     */
    function getTreasuryWallet() external view returns (address);

    /**
     * @dev Gets Hotel wallet address
     * @return address Address of the fee wallet
     */
    function getHotelWallet() external view returns (address);

    /**
     * @dev Gets BUK royalty
     * @return uint8 Percent of BUK royalty
     */
    function getBukRoyalty() external view returns (uint8);

    /**
     * @dev Gets hotel royalty
     * @return uint8 Percent of hotel royalty
     */
    function getHotelRoyalty() external view returns (uint8);

    /**
     * @dev Gets first user royalty
     * @return uint8 Percent of user royalty
     */
    function getUserRoyalty() external view returns (uint8);

    /**
     * @dev Function will provide Lisiting details of booking
     * @param tokenId_ room/booking NFT id
     */
    function getListingDetails(
        uint256 tokenId_
    ) external view returns (ListingDetails calldata);
}
