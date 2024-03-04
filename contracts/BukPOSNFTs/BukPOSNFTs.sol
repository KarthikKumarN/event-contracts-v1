// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { ERC1155, IERC165 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IBukNFTs } from "../BukNFTs/IBukNFTs.sol";
import { IBukPOSNFTs } from "../BukPOSNFTs/IBukPOSNFTs.sol";
import { IBukProtocol, IBukRoyalties } from "../BukProtocol/IBukProtocol.sol";
import { IBukTreasury } from "../BukTreasury/IBukTreasury.sol";

/**
 * @title BUK Protocol Proof of Stay NFTs Contract
 * @author BUK Technology Inc
 * @dev Contract for managing Proof-of-Stay utility NFT ERC1155 token
 */
contract BukPOSNFTs is AccessControl, ERC1155, IBukPOSNFTs {
    /// @dev Name of the contract
    string public name;

    /// @dev Address of the Buk treasury contract.
    IBukTreasury private _bukTreasury;

    /// @dev Address of the BukNFTs contract
    IBukNFTs public nftContract;

    /// @dev Address of the Buk Protocol contract
    IBukProtocol public bukProtocolContract;

    /// @dev Mapping for token URI's for Buk POS NFTs
    mapping(uint256 => string) public uriByTokenId; //tokenId -> uri

    /**
     * @dev Constant for the role of the Buk NFT contract
     * @notice its a hash of keccak256("BUK_NFT_CONTRACT_ROLE")
     */
    bytes32 public constant BUK_NFT_CONTRACT_ROLE =
        0x6f175d21d6dd2f858978c1597b4f5520369b996b309c4b19f3efbf37f3c323e0;

    /**
     * @dev Constant for the role of the admin
     * @notice its a hash of keccak256("ADMIN_ROLE")
     */
    bytes32 public constant ADMIN_ROLE =
        0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775;

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
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    /// @dev See {IBukPOSNFTs-setBukProtocol}.
    function setBukProtocol(
        address _bukProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukProtocol(_bukProtocolContract);
    }

    /// @dev See {IBukPOSNFTs-setBukTreasury}.
    function setBukTreasury(
        address _bukTreasuryContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukTreasury(_bukTreasuryContract);
    }

    /// @dev See {IBukPOSNFTs-setBukNFTRole}.
    function setBukNFTRole(address _nftContract) external onlyRole(ADMIN_ROLE) {
        _grantRole(BUK_NFT_CONTRACT_ROLE, _nftContract);
        _revokeRole(BUK_NFT_CONTRACT_ROLE, address(nftContract));
        address oldNFTContract_ = address(nftContract);
        nftContract = IBukNFTs(_nftContract);
        emit SetNFTContractRole(oldNFTContract_, _nftContract);
    }

    /// @dev See {IBukPOSNFTs-setNFTContractName}.
    function setNFTContractName(
        string memory _contractName
    ) external onlyRole(ADMIN_ROLE) {
        _setNFTContractName(_contractName);
    }

    /// @dev See {IBukPOSNFTs-setURI}.
    function setURI(
        uint256 _id,
        string memory _newuri
    ) external onlyRole(ADMIN_ROLE) {
        require(
            bytes(uriByTokenId[_id]).length != 0,
            "Token not exist on BukPOSNFTs"
        );
        _setURI(_id, _newuri);
    }

    /// @dev See {IBukPOSNFTs-mint}.
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

    /// @dev See {IBukPOSNFTs-safeTransferFrom}.
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) public virtual override(ERC1155, IBukPOSNFTs) onlyRole(ADMIN_ROLE) {
        require(balanceOf(_from, _id) > 0, "From address does not own NFT");
        super._safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /// @dev See {IBukPOSNFTs-safeBatchTransferFrom}.
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) public virtual override(ERC1155, IBukPOSNFTs) onlyRole(ADMIN_ROLE) {
        uint256 len = _ids.length;
        for (uint i = 0; i < len; ++i) {
            require(
                balanceOf(_from, _ids[i]) > 0,
                "From address does not own NFT"
            );
        }
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    /// @dev See {IBukPOSNFTs-uri}.
    function uri(
        uint256 _id
    )
        public
        view
        virtual
        override(ERC1155, IBukPOSNFTs)
        returns (string memory)
    {
        return uriByTokenId[_id];
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, IERC165, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Private function to update the contract name
     * @param _contractName The new name for the contract
     */
    function _setNFTContractName(string memory _contractName) private {
        string memory oldName_ = name;
        name = _contractName;
        emit SetNFTContractName(oldName_, _contractName);
    }

    /**
     * Private function to set the Buk Protocol Contract address.
     * @param _bukProtocolContract The address of the Buk Protocol contract
     */
    function _setBukProtocol(address _bukProtocolContract) private {
        address oldBukProtocolContract_ = address(bukProtocolContract);
        bukProtocolContract = IBukProtocol(_bukProtocolContract);
        emit SetBukProtocol(oldBukProtocolContract_, _bukProtocolContract);
    }

    /**
     * Private function to set the BukTreasury contract address
     * @param _bukTreasuryContract The address of the BukTreasury contract
     */
    function _setBukTreasury(address _bukTreasuryContract) private {
        address oldBukTreasuryContract_ = address(_bukTreasury);
        _bukTreasury = IBukTreasury(_bukTreasuryContract);
        emit SetBukTreasury(oldBukTreasuryContract_, _bukTreasuryContract);
    }

    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @param _newuri - The URI associated with the token ID.
     */
    function _setURI(uint256 _id, string memory _newuri) private {
        string memory oldUri_ = uriByTokenId[_id];
        uriByTokenId[_id] = _newuri;
        emit SetURI(_id, oldUri_, _newuri);
    }
}
