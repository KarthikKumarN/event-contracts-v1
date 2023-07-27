// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IBukTripsUtilityNFT.sol";

/**
* @title BUK Protocol NFT Contract
* @author BUK Technology Inc
* @dev Contract for managing hotel room-night inventory and ERC1155 token management for room-night NFTs
*/
contract BukTripsNFT is AccessControl, ERC1155 {

    /**
    * @dev name of the collection contract
    */
    string public name;
    /**
    * @dev address of the utility collection contract
    */
    address private utilityContract;

    /**
    * @dev Mapping for token URI's for booked tickets
    */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri

    /**
    * @dev Constant for the role of the factory contract
    */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    /**
    * @dev Constant for the role of the factory contract
    */
    bytes32 public constant FACTORY_CONTRACT_ROLE = keccak256("FACTORY_CONTRACT");
    /**
    * @dev Constant for the role of the marketplace contract
    */
    bytes32 public constant MARKETPLACE_CONTRACT_ROLE = keccak256("MARKETPLACE_CONTRACT");

    /**
    * @dev Event to update the supplier details
    */
    event UpdateContractName(string indexed contractName);
    /**
    * @dev Event to safe transfer NFT
    */
    event GrantFactoryRole(address indexed oldFactory, address indexed newFactory);
    /**
    * @dev Event to set token URI
    */
    event SetURI(uint256 indexed id, string indexed uri);

    /**
    * @dev Constructor to initialize the contract
    * @param _utilityContract Address of the utility contract
    * @param _factoryContract Address of the factory contract
    */
    constructor(string memory _contractName, address _utilityContract, address _factoryContract) ERC1155("") {
        name = _contractName;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setRoleAdmin(FACTORY_CONTRACT_ROLE, FACTORY_CONTRACT_ROLE);
        _grantRole(FACTORY_CONTRACT_ROLE, _factoryContract);
        utilityContract = _utilityContract;
    }
    
    /**
    * @dev To set the factory role.
    * @param _factoryContract - Address of factory contract
    */
    function grantFactoryRole(address _factoryContract) external onlyRole(FACTORY_CONTRACT_ROLE) {
        IBukTripsUtilityNFT(utilityContract).grantFactoryRole(_factoryContract);
        _grantRole(FACTORY_CONTRACT_ROLE, _factoryContract);
        revokeRole(FACTORY_CONTRACT_ROLE, _msgSender());
        emit GrantFactoryRole(_msgSender(), _factoryContract);
    }

    /**
    * @dev Update the name of the contract.
    * @notice This function can only be called by addresses with `UPDATE_CONTRACT_ROLE`
    */
    function updateName(string memory _contractName) external onlyRole(FACTORY_CONTRACT_ROLE) {
        name = _contractName;
        IBukTripsUtilityNFT(utilityContract).updateName(_contractName);
        emit UpdateContractName(_contractName);
    }

    /**
    * @dev Sets the URI for a specific token ID.
    * @param _id - The ID of the token.
    * @param _newuri - The new URI for the token.
    * @notice This function can only be called by a contract with `FACTORY_CONTRACT_ROLE`
    */
    function setURI(uint256 _id, string memory _newuri) external onlyRole(FACTORY_CONTRACT_ROLE) {
        //check if that nft exists in the collection
        _setURI(_id,_newuri);
        IBukTripsUtilityNFT(utilityContract).setURI(_id,_newuri);
        emit SetURI(_id,_newuri);
    }

    /**
    * @dev Mint a new NFT with a specific token ID, account, amount, and data.
    * @param _id - The token ID to mint the NFT with.
    * @param account - The account to mint the NFT to.
    * @param amount - The amount of NFTs to mint.
    * @param data - The data to store with the NFT.
    * @param _uri - The URI to associate with the NFT.
    * @return uint256 - The token ID of the newly minted NFT.
    * @notice This function can only be called by a contract with `FACTORY_CONTRACT_ROLE`
    */
    function mint(uint256 _id, address account, uint256 amount, bytes calldata data, string calldata _uri) external onlyRole(FACTORY_CONTRACT_ROLE) returns (uint256) {
        _mint(account, _id, amount, data);
        _setURI( _id, _uri);
        return ( _id );
    }

    /**
    * @dev Burn a specific NFT.
    * @param account - The account to burn the NFT from.
    * @param id - The token ID of the NFT to burn.
    * @param amount - The amount of NFTs to burn.
    * @param utility - Whether or not to call the utility contract to burn the NFT.
    * @notice This function can only be called by a contract with `FACTORY_CONTRACT_ROLE`
    */
    function burn(address account, uint256 id, uint256 amount, bool utility) external onlyRole(FACTORY_CONTRACT_ROLE) {
        string memory uri_ =  bookingTickets[id];
        bookingTickets[id] = "";
        if(utility) {
            IBukTripsUtilityNFT(utilityContract).mint(account, id, amount, uri_, "");
        }
        _burn(account, id, amount);
    }

    /**
    * @dev Returns the URI associated with the token ID.
    * @param _id - The token ID to retrieve the URI for.
    * @return string - The URI associated with the token ID.
    */
    function uri(uint256 _id) public view virtual override returns (string memory) {
        return bookingTickets[_id];
    }

    /**
    * @dev Transfers ownership of an NFT token from one address to another.
    * @param from - The current owner of the NFT.
    * @param to - The address to transfer the ownership to.
    * @param id - The ID of the NFT token.
    * @param data - Additional data to include in the transfer.
    */
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public onlyRole(MARKETPLACE_CONTRACT_ROLE) virtual override {
        super._safeTransferFrom(from, to, id, amount, data);
    }

    /**
    * @dev Transfers ownership of multiple NFT tokens from one address to another.
    * @param from - The current owner of the NFTs.
    * @param to - The address to transfer the ownership to.
    * @param ids - The IDs of the NFT tokens.
    * @param data - Additional data to include in the transfer.
    */
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyRole(MARKETPLACE_CONTRACT_ROLE) virtual override {
        require((ids.length < 11), "Exceeds max booking transfer limit");
        super._safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    } 

    function _setURI(uint256 id, string memory newuri) internal {
        bookingTickets[id] = newuri;
    }
}
