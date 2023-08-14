// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
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
        keccak256("BUK_NFT_CONTRACT_ROLE");
        
    /**
     * @dev Constant for the role of the Buk Protocol contract
     */
    bytes32 public constant BUK_PROTOCOL_CONTRACT_ROLE =
        keccak256("BUK_PROTOCOL_CONTRACT_ROLE");

    /**
     * @dev Constant for the role of the admin
     */
    bytes32 public constant ADMIN_ROLE =
        keccak256("ADMIN_ROLE");

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
     * @dev Emitted when Buk Protocol Address is updated.
     */
    event SetBukProtocol(address indexed bukProtocolContract);

    /**
     * @dev Emitted when treasury is updated.
     */
    event SetBukTreasury(address indexed treasuryContract);

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
     * @param _bukTreasuryContract Address of the Buk treasury contract.
     * @dev address nftContract Address of the Buk NFT contract.
     */
    constructor(
        string memory _contractName,
        address _bukProtocolContract,
        address _bukTreasuryContract
    ) ERC1155("") {
        _setNFTContractName(_contractName);
        _setBukTreasury(_bukTreasuryContract);
        _setBukProtocol(_bukProtocolContract);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
    }

    /**
     * @dev Function to update the Buk Protocol Contract address.
     * @param _bukProtocolContract Address of the Buk Protocol Contract.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
     */
    function setBukProtocol(
        address _bukProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukProtocol(_bukProtocolContract);
    }

    /**
    * @dev Function to update the treasury address.
    * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
    */
    function setBukTreasury(address _bukTreasuryContract) external onlyRole(ADMIN_ROLE) {
        _setBukTreasury(_bukTreasuryContract);
    }

    /**
     * @dev Function to grant the BukNFT role to a given contract
     * @param _nftContract address: The address of the NFT contract
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function grantBukNFTRole(
        address _nftContract
    ) external onlyRole(ADMIN_ROLE) {
        _grantRole(BUK_NFT_CONTRACT_ROLE, _nftContract);
        nftContract = IBukNFTs(_nftContract);
        emit GrantNftContractRole(_nftContract);
    }

    /**
     * @dev Function to set the contract name
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function setNFTContractName(
        string memory _contractName
    ) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        _setNFTContractName(_contractName);
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
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) public virtual override onlyRole(ADMIN_ROLE) {
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
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) public virtual override onlyRole(ADMIN_ROLE) {
        uint256 len = _ids.length;
        for(uint i=0; i<len; ++i) {
            require(bukProtocolContract.getBookingDetails(_ids[i]).tradeable, "One of these NFT is non-transferable");
            require(balanceOf(_from, _ids[i])>0, "From address does not own NFT");
        }
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
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

    /**
     * Internal function to update the contract name
     * @param _contractName The new name for the contract
     */
    function _setNFTContractName(string memory _contractName) internal {
        name = _contractName;
        emit UpdateContractName(name);
    }

    /**
     * Internal function to set the Buk Protocol Contract address.
     * @param _bukProtocolContract The address of the Buk Protocol contract
     */
    function _setBukProtocol(address _bukProtocolContract) internal {
        bukProtocolContract = IBukProtocol(_bukProtocolContract);
        emit SetBukProtocol(_bukProtocolContract);
    }

    /**
     * Internal function to set the BukTreasury contract address
     * @param _bukTreasuryContract The address of the BukTreasury contract
     */
    function _setBukTreasury(address _bukTreasuryContract) internal {
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(_bukTreasuryContract);
    }

    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @param _newuri - The URI associated with the token ID.
     */
    function _setURI(uint256 _id, string memory _newuri) internal {
        bookingTickets[_id] = _newuri;
    }
}
