// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../BukPOSNFTs/IBukPOSNFTs.sol";
import "../BukProtocol/IBukProtocol.sol";

/**
 * @title BUK Protocol NFT Contract
 * @author BUK Technology Inc
 * @dev Contract for managing hotel room-night inventory and ERC1155 token management for room-night NFTs
 */
contract BukNFTs is AccessControl, ERC1155 {
    /**
     * @dev name of the collection contract
     */
    string public name;
    /**
     * @dev address of the Buk PoS NFT collection contract
     */
    address public nftPoSContract;
    /**
     * @dev address of the Buk Protocol contract
     */
    address public bukProtocolContract;

    /**
     * @dev Mapping for token URI's for booked tickets
     */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri

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
     * @dev Event to update the contract name
     */
    event UpdateContractName(string indexed contractName);
    /**
     * @dev Emitted when Buk Protocol role access is granted for NFT and PoS contracts
     */
    event GrantBukProtocolRole(
        address indexed oldAddress,
        address indexed newAddress
    );
    /**
     * @dev Event to set token URI
     */
    event SetURI(uint256 indexed id, string indexed uri);

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName NFT contract name
     * @param _bukPoSContract Address of the Buk PoS NFTs contract
     * @param _bukProtocolContract Address of the buk protocol contract
     * @param _marketplaceContract Address of the Marketplace contract
     */
    constructor(
        string memory _contractName,
        address _bukPoSContract,
        address _bukProtocolContract,
        address _marketplaceContract
    ) ERC1155("") {
        name = _contractName;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
        nftPoSContract = _bukPoSContract;
        bukProtocolContract = _bukProtocolContract;
    }

    /**
     * @dev To set the buk protocol role.
     * @param _bukProtocolContract - Address of buk protocol contract
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function grantBukProtocolRole(
        address _bukProtocolContract
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        IBukPOSNFTs(nftPoSContract).grantBukProtocolRole(_bukProtocolContract);
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        revokeRole(BUK_PROTOCOL_CONTRACT_ROLE, _msgSender());
        emit GrantBukProtocolRole(_msgSender(), _bukProtocolContract);
    }

    /**
     * @dev Update the name of the contract.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function updateName(
        string memory _contractName
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        name = _contractName;
        IBukPOSNFTs(nftPoSContract).updateName(_contractName);
        emit UpdateContractName(_contractName);
    }

    /**
     * @dev Sets the URI for a specific token ID.
     * @param _id - The ID of the token.
     * @param _newuri - The new URI for the token.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function setURI(
        uint256 _id,
        string memory _newuri
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        if (bytes(bookingTickets[_id]).length != 0) {
            _setURI(_id, _newuri);
        } else {
            IBukPOSNFTs(nftPoSContract).setURI(_id, _newuri);
        }
        emit SetURI(_id, _newuri);
    }

    /**
     * @dev Mint a new NFT with a specific token ID, account, amount, and data.
     * @param _id - The token ID to mint the NFT with.
     * @param account - The account to mint the NFT to.
     * @param amount - The amount of NFTs to mint.
     * @param data - The data to store with the NFT.
     * @param _uri - The URI to associate with the NFT.
     * @return uint256 - The token ID of the newly minted NFT.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function mint(
        uint256 _id,
        address account,
        uint256 amount,
        bytes calldata data,
        string calldata _uri
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) returns (uint256) {
        _mint(account, _id, amount, data);
        _setURI(_id, _uri);
        return (_id);
    }

    /**
     * @dev Burn a specific NFT.
     * @param account - The account to burn the NFT from.
     * @param id - The token ID of the NFT to burn.
     * @param amount - The amount of NFTs to burn.
     * @param isPoSNFT - Whether or not to call the Buk PoS NFTs contract to burn the NFT.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function burn(
        address account,
        uint256 id,
        uint256 amount,
        bool isPoSNFT
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        string memory uri_ = bookingTickets[id];
        bookingTickets[id] = "";
        if (isPoSNFT) {
            IBukPOSNFTs(nftPoSContract).mint(account, id, amount, uri_, "");
        } else {
            _burn(account, id, amount);
        }
    }

    /**
     * @dev To retrieve information about the royalties associated with a specific token.
     * @param _tokenId - The token ID of the NFT.
     * @param _salePrice - The price at which the token is being sold.
     */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    )
        external
        view
        returns (address[] memory receivers, uint256[] memory royaltyAmounts)
    {
        IBukProtocol.Royalty[] memory royaltyArray = IBukProtocol(
            bukProtocolContract
        ).getRoyaltyInfo(_tokenId);
        receivers = new address[](royaltyArray.length);
        royaltyAmounts = new uint256[](royaltyArray.length);
        for (uint i = 0; i < royaltyArray.length; i++) {
            receivers[i] = royaltyArray[i].receiver;
            royaltyAmounts[i] =
                (_salePrice * royaltyArray[i].royaltyFraction) /
                _feeDenominator();
        }
        return (receivers, royaltyAmounts);
    }

    /**
     * @dev Transfers ownership of an NFT token from one address to another.
     * @param from - The current owner of the NFT.
     * @param to - The address to transfer the ownership to.
     * @param id - The ID of the NFT token.
     * @param data - Additional data to include in the transfer.
     * @notice This function can only be called by a contract with `MARKETPLACE_CONTRACT_ROLE`
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override onlyRole(MARKETPLACE_CONTRACT_ROLE) {
        super._safeTransferFrom(from, to, id, amount, data);
    }

    /**
     * @dev Transfers ownership of multiple NFT tokens from one address to another.
     * @param from - The current owner of the NFTs.
     * @param to - The address to transfer the ownership to.
     * @param ids - The IDs of the NFT tokens.
     * @param data - Additional data to include in the transfer.
     * @notice This function can only be called by a contract with `MARKETPLACE_CONTRACT_ROLE`
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override onlyRole(MARKETPLACE_CONTRACT_ROLE) {
        require((ids.length < 11), "Exceeds max booking transfer limit");
        super._safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @return string - The URI associated with the token ID.
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

    function _setURI(uint256 id, string memory newuri) internal {
        bookingTickets[id] = newuri;
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
