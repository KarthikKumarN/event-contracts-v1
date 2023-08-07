// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../BukNFTs/IBukNFTs.sol";
import "../BukProtocol/IBukProtocol.sol";
import "../BukTreasury/IBukTreasury.sol";

/**
 * @title BUK Protocol Proof of Stay NFTs Contract
 * @author BUK Technology Inc
 * @dev Contract for managing Proof-of-Stay utility NFT ERC1155 token
 */
contract BukPOSNFTs is AccessControl, ERC1155 {
    /**
     * @dev Address of the Buk treasury contract.
     */
    IBukTreasury private _bukTreasury;

    /**
     * @dev Name of the contract
     */
    string public name;

    /**
     * @dev Address of the BukNFTs contract
     */
    IBukNFTs public nftContract;

    /**
     * @dev Address of the Buk Protocol contract
     */
    IBukProtocol public bukProtocolContract;

    /**
     * @dev Mapping for token URI's for Buk PoS NFTs
     */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri

    /**
     * @dev Constant for the role of the Buk NFT contract
     */
    bytes32 public constant BUK_NFT_CONTRACT_ROLE =
        keccak256("BUK_NFT_CONTRACT");
    /**
     * @dev Constant for the role of the Buk Protocol contract
     */
    bytes32 public constant BUK_PROTOCOL_CONTRACT_ROLE =
        keccak256("BUK_PROTOCOL_CONTRACT");
    /**
     * @dev Constant for the role of the marketplace contract
     */
    bytes32 public constant MARKETPLACE_CONTRACT_ROLE =
        keccak256("MARKETPLACE_CONTRACT");
    /**
     * @dev Constant for the role of the marketplace contract
     */
    bytes32 public constant ADMIN_ROLE =
        keccak256("ADMIN");

    /**
     * @dev Event to grant NFT contract role
     */
    event GrantNftContractRole(address indexed nftContractAddr);

    /**
     * @dev Emitted when Buk Protocol role access is granted for NFT and PoS contracts
     */
    event GrantBukProtocolRole(
        address indexed oldAddress,
        address indexed newAddress
    );

    /**
     * @dev Emitted when treasury is updated.
     */
    event SetBukTreasury(address indexed treasuryContract);

    /**
     * @dev Emitted when marketplace role is granted.
     */
    event SetMarketplace(address indexed marketplaceContract);

    /**
     * @dev Event to update the contract name
     */
    event UpdateContractName(string indexed name);

    /**
     * @dev Event to set token URI
     */
    event SetURI(uint indexed id, string indexed uri);

    /**
     * @dev Custom error in the function to show that the NFT is not minted.
     */

    error NotYetMinted(string message);

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName Contract Name
     * @param _bukProtocolContract Address of the Buk Protocol contract
     */
    constructor(
        string memory _contractName,
        address _bukProtocolContract
    ) ERC1155("") {
        name = _contractName;
        bukProtocolContract = IBukProtocol(_bukProtocolContract);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
    }

    /**
    * @dev Function to update the treasury address.
    * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
    */
    function setBukTreasury(address _bukTreasuryContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(_bukTreasuryContract);
    }

    /**
    * @dev Function to update the marketplace address.
    * @param _marketplaceContract Address of the marketplace.
     * @notice This function can only be called by addresses with `DEFAULT_ADMIN_ROLE`
    */
    function addMarketplace(address _marketplaceContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
        emit SetMarketplace(_marketplaceContract);
    }

    /**
     * @dev Function to grant the BukNFT role to a given contract
     * @param _nftContract address: The address of the NFT contract
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function grantBukNFTRole(
        address _nftContract
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        _grantRole(BUK_NFT_CONTRACT_ROLE, _nftContract);
        nftContract = IBukNFTs(_nftContract);
        emit GrantNftContractRole(_nftContract);
    }

    /**
     * @dev Function to set the URI for a given ID
     * @param _id uint256: The ID of the token
     * @param _newuri string: The new URI of the token
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function setURI(
        uint256 _id,
        string memory _newuri
    ) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        if (bytes(bookingTickets[_id]).length != 0) {
            _setURI(_id, _newuri);
        } else {
            revert NotYetMinted("Token is not yet minted.");
        }
        emit SetURI(_id, _newuri);
    }

    /**
     * @dev Function to update the contract name
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function updateName(
        string memory _contractName
    ) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        name = _contractName;
        emit UpdateContractName(name);
    }

    /**
     * @dev Function to mint tokens
     * @param _account address: The address to which the tokens will be minted
     * @param _id uint256: The ID of the token
     * @param _amount uint256: The amount of tokens to be minted
     * @param _newuri string: The URI of the token
     * @param _data bytes: Additional data associated with the token
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function mint(
        address _account,
        uint256 _id,
        uint256 _amount,
        string calldata _newuri,
        bytes calldata _data
    ) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        _mint(_account, _id, _amount, _data);
        _setURI(_id, _newuri);
    }

    /**
     * @dev Transfers ownership of an NFT token from one address to another.
     * @param _from - The current owner of the NFT.
     * @param _to - The address to transfer the ownership to.
     * @param _id - The ID of the NFT token.
     * @param _amount - The amount of NFTs to mint.
     * @param _data - Additional data to include in the transfer.
     * @notice This function checks if the NFT is tranferable or not.
     * @notice This function can only be called by a contract with `MARKETPLACE_CONTRACT_ROLE`
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) public virtual override onlyRole(MARKETPLACE_CONTRACT_ROLE) {
        require(bukProtocolContract.getBookingDetails(_id).tradeable, "This NFT is non transferable");
        require(balanceOf(_from, _id)>0, "From address does not own NFT");
        super._safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /**
     * @dev Transfers ownership of multiple NFT tokens from one address to another.
     * @param _from - The current owner of the NFTs.
     * @param _to - The address to transfer the ownership to.
     * @param _ids - The IDs of the NFT tokens.
     * @param _amounts - Count of ERC1155 tokens of the respective token IDs.
     * @param _data - Additional data to include in the transfer.
     * @notice This function checks if the NFTs are tranferable or not.
     * @notice This function can only be called by a contract with `MARKETPLACE_CONTRACT_ROLE`
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) public virtual override onlyRole(MARKETPLACE_CONTRACT_ROLE) {
        uint256 len = _ids.length;
        for(uint i=0; i<len; ++i) {
            require(bukProtocolContract.getBookingDetails(_ids[i]).tradeable, "One of these NFT is non-transferable");
            require(balanceOf(_from, _ids[i])>0, "From address does not own NFT");
        }
        //FIXME Is this condition necessary?
        require((_ids.length < 11), "Exceeds max booking transfer limit");
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    /**
     * @dev To retrieve information about the royalties associated with a specific token.
     * @param _tokenId - The token ID of the NFT.
     * @param _salePrice - The price at which the token is being sold.
     * @return receiver - The address of the royalty receiver.
     * @return royaltyAmount - The amount of royalty to be paid.
     */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    )
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        IBukProtocol.Royalty[] memory royaltyArray = bukProtocolContract.getRoyaltyInfo(_tokenId);
        uint256 royaltyAmount_ = 0;
        for (uint i = 0; i < royaltyArray.length; i++) {
            royaltyAmount_ += ((_salePrice * royaltyArray[i].royaltyFraction)/_feeDenominator());
        }
        return (address(_bukTreasury), royaltyAmount_);
    }

    /**
     * @dev Function to get the URI for a given ID
     * @param _id uint256: The ID of the token
     */
    function uri(
        uint256 _id
    ) public view virtual override returns (string memory) {
        return bookingTickets[_id];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // /**
    //  * @dev To calculate and transfer the royalty points to the respective receivers
    //  * @param _tokenId The ID of the token for which the royalties should be calculated and transferred
    //  * @param _salePrice The sale price of the token
    //  */
    // function _distributeRoyalties(
    //     uint256 _tokenId,
    //     uint256 _salePrice
    // ) private {
    //     address[] memory receivers;
    //     uint256[] memory royaltyAmounts;
    //     (receivers, royaltyAmounts) = royaltyInfo(_tokenId, _salePrice);
    //     for (uint i = 0; i < receivers.length; i++) {
    //         //Before this, in the marketplace, we need to take an approval for the USDC contracts
    //         //Approval from the buyer to the BukPOSNFTs
    //         // require(
    //         //     IERC20(_currency).transferFrom(buyer, receivers[i], royaltyAmounts[i]),
    //         //     "Royalty transfer failed"
    //         // );
    //     }
    // }

    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @param _newuri - The URI associated with the token ID.
     */
    function _setURI(uint256 _id, string memory _newuri) internal {
        bookingTickets[_id] = _newuri;
    }

    /**
     * @dev The denominator with which to interpret the fee set in {_setTokenRoyalty} and {_setDefaultRoyalty} as a
     * fraction of the sale price. Defaults to 10000 so fees are expressed in basis points, but may be customized by an
     * override.
     */
    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
    }
}
