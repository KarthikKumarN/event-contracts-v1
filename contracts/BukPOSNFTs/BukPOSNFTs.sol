// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BUK Protocol Proof of Stay NFTs Contract
 * @author BUK Technology Inc
 * @dev Contract for managing Proof-of-Stay utility NFT ERC1155 token
 */
contract BukPOSNFTs is AccessControl, ERC1155 {
    /**
     * @dev name of the contract
     */
    string public name;
    /**
     * @dev address of the BukNFTs contract
     */
    address public nftContract;
    /**
     * @dev address of the Buk Protocol contract
     */
    address public bukProtocolContract;

    /**
     * @dev Mapping for token URI's for Buk PoS NFTs
     */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri
    /**
     * @dev Mapping to toggle the transferrability of Buk PoS NFTs
     */
    mapping(uint256 => bool) public transferStatus; //tokenID -> status

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
     * @dev Event to update the contract name
     */
    event UpdateContractName(string indexed name);
    /**
     * @dev Event to set token URI
     */
    event SetURI(uint indexed id, string indexed uri);
    /**
     * @dev Event to set toggle NFT transfer status
     */
    event ToggleNFT(uint indexed id, bool isTranferable);
    /**
     * @dev Custom error in the function to show that the NFT is not minted.
     */
    error NotYetMinted(string message);

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName Contract Name
     * @param _bukProtocolContract Address of the Buk Protocol contract
     * @param _marketplaceContract Address of the Marketplace contract
     */
    constructor(
        string memory _contractName,
        address _bukProtocolContract,
        address _marketplaceContract
    ) ERC1155("") {
        name = _contractName;
        bukProtocolContract = _bukProtocolContract;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
    }

    /**
     * @dev Function to grant the BukNFT role to a given contract
     * @param nftContractAddr address: The address of the NFT contract
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function grantBukNFTRole(
        address nftContractAddr
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        _grantRole(BUK_NFT_CONTRACT_ROLE, nftContractAddr);
        nftContract = nftContractAddr;
        emit GrantNftContractRole(nftContractAddr);
    }

    /**
     * @dev To set the Buk Protocol role Access.
     * @param _bukProtocolContract - Address of Buk Protocol contract
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function grantBukProtocolRole(
        address _bukProtocolContract
    ) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        revokeRole(BUK_PROTOCOL_CONTRACT_ROLE, _msgSender());
        emit GrantBukProtocolRole(_msgSender(), _bukProtocolContract);
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
     * @dev Function to toggle the NFT transferability status
     * @param _tokenId uint256: The ID of the token
     * @param _isTranferable bool: Transferability status of the NFT
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function toggleNftTransfer(
        uint256 _tokenId,
        bool _isTranferable
    ) external onlyRole(ADMIN_ROLE) {
        transferStatus[_tokenId] = _isTranferable;
        emit ToggleNFT(_tokenId, _isTranferable);
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
     * @dev Function to get the URI for a given ID
     * @param id uint256: The ID of the token
     */
    function uri(
        uint256 id
    ) public view virtual override returns (string memory) {
        return bookingTickets[id];
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
}
