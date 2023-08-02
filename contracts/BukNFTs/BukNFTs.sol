// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../BukPOSNFTs/IBukPOSNFTs.sol";
import "../BukProtocol/IBukProtocol.sol";

/**
 * @title BUK Protocol NFT Contract
 * @author BUK Technology Inc
 * @dev Contract for managing hotel room-night inventory and ERC1155 token management for room-night NFTs
 */
contract BukNFTs is AccessControl, ERC1155 {
    /**
     * @dev Address of the Buk treasury contract.
     */
    address private _bukTreasury;

    /**
     * @dev Address of the currency.
     */
    address private _currency;

    /**
     * @dev Name of the Buk PoS NFT collection contract
     */
    string public name;

    /**
     * @dev Address of the Buk PoS NFT collection contract
     */
    address public nftPoSContract;

    /**
     * @dev Address of the Buk Protocol contract
     */
    address public bukProtocolContract;

    /**
     * @dev Mapping for token URI's for booked tickets
     */
    mapping(uint256 => string) public bookingTickets; //tokenID -> uri

    /**
     * @dev Mapping to toggle the transferrability of Buk PoS NFTs
     */
    mapping(uint256 => bool) public transferStatus; //tokenID -> status

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
     * @dev Emitted when treasury is updated.
     */
    event SetTreasury(address indexed treasuryContract);

    /**
     * @dev Emitted when currency is updated.
     */
    event SetCurrency(address indexed _currencyContract);

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
     * @dev Event to set toggle NFT transfer status
     */
    event ToggleNFT(uint indexed id, bool isTranferable);

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName NFT contract name
     * @param _bukPoSContract Address of the Buk PoS NFTs contract
     * @param _bukProtocolContract Address of the buk protocol contract
     * @param _marketplaceContract Address of the Marketplace contract
     * @param _bukTreasuryContract Address of the treasury.
     * @param _currencyContract Address of the currency.
     */
    constructor(
        string memory _contractName,
        address _bukPoSContract,
        address _bukProtocolContract,
        address _marketplaceContract,
        address _bukTreasuryContract,
        address _currencyContract
    ) ERC1155("") {
        name = _contractName;
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
        nftPoSContract = _bukPoSContract;
        bukProtocolContract = _bukProtocolContract;
        _bukTreasury = _bukTreasuryContract;
        _currency = _currencyContract;
    }

    /**
    * @dev Function to update the treasury address.
    * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
    */
    function setTreasury(address _bukTreasuryContract) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        _bukTreasury = _bukTreasuryContract;
        IBukPOSNFTs(nftPoSContract).setTreasury(_bukTreasuryContract);
        emit SetTreasury(_bukTreasuryContract);
    }

    /**
    * @dev Function to update the currency address.
    * @param _currencyContract Address of the currency contract.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
    */
    function setCurrency(address _currencyContract) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        _currency = _currencyContract;
        IBukPOSNFTs(nftPoSContract).setCurrency(_currencyContract);
        emit SetCurrency(_currencyContract);
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
     * @dev Function to toggle the NFT transferability status
     * @param _tokenId uint256: The ID of the token
     * @param _isTranferable bool: Transferability status of the NFT
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function toggleNftTransfer(
        uint256 _tokenId,
        bool _isTranferable
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transferStatus[_tokenId] = _isTranferable;
        emit ToggleNFT(_tokenId, _isTranferable);
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
     * @param _account - The account to mint the NFT to.
     * @param _amount - The amount of NFTs to mint.
     * @param _data - The data to store with the NFT.
     * @param _uri - The URI to associate with the NFT.
     * @return uint256 - The token ID of the newly minted NFT.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function mint(
        uint256 _id,
        address _account,
        uint256 _amount,
        bytes calldata _data,
        string calldata _uri
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) returns (uint256) {
        _mint(_account, _id, _amount, _data);
        _setURI(_id, _uri);
        return (_id);
    }

    /**
     * @dev Burn a specific NFT.
     * @param _account - The account to burn the NFT from.
     * @param _id - The token ID of the NFT to burn.
     * @param _amount - The amount of NFTs to burn.
     * @param _isPoSNFT - Whether or not to call the Buk PoS NFTs contract to burn the NFT.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function burn(
        address _account,
        uint256 _id,
        uint256 _amount,
        bool _isPoSNFT
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        string memory uri_ = bookingTickets[_id];
        bookingTickets[_id] = "";
        if (_isPoSNFT) {
            IBukPOSNFTs(nftPoSContract).mint(_account, _id, _amount, uri_, "");
        }
        _burn(_account, _id, _amount);
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
     * @param _from - The current owner of the NFT.
     * @param _to - The address to transfer the ownership to.
     * @param _id - The ID of the NFT token.
     * @param _amount - Count of ERC1155 token of token ID.
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
        require(transferStatus[_id], "This NFT is non transferable");
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
            require(transferStatus[_ids[i]], "One of these NFT is non-transferable");
        }
        //FIXME Is this condition necessary?
        require((_ids.length < 11), "Exceeds max booking transfer limit");
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
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
