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
    * @dev address of the utility contract
    */
    address public nftContract;

    /**
    * @dev Mapping for token URI's for booked tickets
    */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri

    /**
    * @dev Constant for the role of the Buk NFT contract
    */
    bytes32 public constant BUK_NFT_CONTRACT_ROLE = keccak256("BUK_NFT_CONTRACT");
    /**
    * @dev Constant for the role of the Buk Protocol contract
    */
    bytes32 public constant BUK_PROTOCOL_CONTRACT_ROLE = keccak256("BUK_PROTOCOL_CONTRACT");

    /**
    * @dev Event to grant NFT contract role
    */
    event GrantNftContractRole(address indexed nftContractAddr);
    /**
    * @dev Emitted when Buk Protocol role access is granted for NFT and PoS contracts
    */
    event GrantBukProtocolRole(address indexed oldAddress, address indexed newAddress);
    /**
    * @dev Event to update the contract name
    */
    event UpdateContractName(string indexed name);
    /**
    * @dev Event to set token URI
    */
    event SetURI(uint indexed id, string indexed uri);
    /**
    * @dev Custom error in the function to transfer NFTs.
    */
    error NonTransferable(string message);
    /**
    * @dev Custom error in the function to show that the NFT is not minted.
    */
    error NotYetMinted(string message);

    /**
    * @dev Constructor to initialize the contract
    * @param contractName Contract Name
    * @param bukProtocolContract Address of the Buk Protocol contract
    */
    constructor(string memory contractName, address bukProtocolContract) ERC1155("") {
        name = contractName;
        _setRoleAdmin(BUK_PROTOCOL_CONTRACT_ROLE, BUK_NFT_CONTRACT_ROLE);
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, bukProtocolContract);
    }

    /**
    * @dev Function to grant the BukNFT role to a given contract
    * @param nftContractAddr address: The address of the NFT contract
    * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
    */
    function grantBukNFTRole(address nftContractAddr) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE)  {
        _grantRole(BUK_NFT_CONTRACT_ROLE, nftContractAddr);
        nftContract = nftContractAddr;
        emit GrantNftContractRole(nftContractAddr);
    }

    /**
    * @dev To set the Buk Protocol role Access.
    * @param bukProtocolContract - Address of Buk Protocol contract
    */
    function grantBukProtocolRole(address bukProtocolContract) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, bukProtocolContract);
        revokeRole(BUK_PROTOCOL_CONTRACT_ROLE, _msgSender());
        emit GrantBukProtocolRole(_msgSender(), bukProtocolContract);
    }

    /**
    * @dev Function to set the URI for a given ID
    * @param _id uint256: The ID of the token
    * @param _newuri string: The new URI of the token
    * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
    */
    function setURI(uint256 _id, string memory _newuri) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        if(bytes(bookingTickets[_id]).length != 0) {
            _setURI(_id,_newuri);
        } else {
            revert NotYetMinted("Token is not yet minted.");
        }
        emit SetURI(_id,_newuri);
    }
    
    /**
    * @dev Function to update the contract name
    * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
    */
    function updateName(string memory _contractName) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        name = _contractName;
        emit UpdateContractName(name);
    }

    /**
    * @dev Function to mint tokens
    * @param account address: The address to which the tokens will be minted
    * @param _id uint256: The ID of the token
    * @param amount uint256: The amount of tokens to be minted
    * @param _newuri string: The URI of the token
    * @param data bytes: Additional data associated with the token
    * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
    */
    function mint(address account, uint256 _id, uint256 amount, string calldata _newuri, bytes calldata data) external onlyRole(BUK_NFT_CONTRACT_ROLE) {
        _mint(account, _id, amount, data);
        _setURI(_id,_newuri);
    }

    /**
    * @dev Function to get the URI for a given ID
    * @param id uint256: The ID of the token
    * @return id - The URI of the token
    */
    function uri(uint256 id) public view virtual override returns (string memory) {
        return bookingTickets[id];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    } 

    /**
    * @dev Transfers ownership of an NFT token from one address to another.
    * @param from - The current owner of the NFT.
    * @param to - The address to transfer the ownership to.
    * @param id - The ID of the NFT token.
    * @param data - Additional data to include in the transfer.
    * @notice This function is to disable the transfer functionality of the utility tokens
    */
    function _safeTransferFrom( address from, address to, uint256 id, uint256 amount, bytes memory data ) internal virtual override {
        revert NonTransferable("Token transfer not allowed.");
    }    

    /**
    * @dev Transfers ownership of multiple NFT tokens from one address to another.
    * @param from - The current owner of the NFTs.
    * @param to - The address to transfer the ownership to.
    * @param ids - The IDs of the NFT tokens.
    * @param data - Additional data to include in the transfer.
    * @notice This function is to disable the batch transfer functionality of the utility tokens
    */
    function _safeBatchTransferFrom( address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data ) internal virtual override {
        revert NonTransferable("Token transfer not allowed.");
    }

    function _setURI(uint256 id, string memory newuri) internal {
        bookingTickets[id] = newuri;
    }
}
