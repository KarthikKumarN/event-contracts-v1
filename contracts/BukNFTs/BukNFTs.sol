// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {ERC1155, IERC165} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IBukNFTs} from "../BukNFTs/IBukNFTs.sol";
import {IBukPOSNFTs} from "../BukPOSNFTs/IBukPOSNFTs.sol";
import {IBukProtocol, IBukRoyalties} from "../BukProtocol/IBukProtocol.sol";
import {IBukTreasury} from "../BukTreasury/IBukTreasury.sol";

/**
 * @title BUK Protocol NFT Contract
 * @author BUK Technology Inc
 * @dev Contract for managing hotel room-night inventory and ERC1155 token management for room-night NFTs
 */
contract BukNFTs is AccessControl, ERC1155, IBukNFTs {

    /**
     * @dev Name of the Buk PoS NFT collection contract
     */
    string public name;

    /**
     * @dev Address of the Buk PoS NFT collection contract
     */
    IBukPOSNFTs public nftPoSContract;

    /**
     * @dev Address of the Buk Protocol contract
     */
    IBukProtocol public bukProtocolContract;
    
    /**
     * @dev Address of the Buk treasury contract.
     */
    IBukTreasury private _bukTreasury;

    /**
     * @dev Mapping for token URI's for booked tickets
     */
    mapping(uint256 => string) public uriByTokenId; //tokenId -> uri

    /**
     * @dev Constant for the role of the Buk Protocol contract
     */
    bytes32 public constant BUK_PROTOCOL_CONTRACT_ROLE =
        keccak256("BUK_PROTOCOL_CONTRACT_ROLE");

    /**
     * @dev Constant for the role of the marketplace contract
     */
    bytes32 public constant MARKETPLACE_CONTRACT_ROLE =
        keccak256("MARKETPLACE_CONTRACT_ROLE");

    /**
     * @dev Constant for the role of the admin
     */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName NFT contract name
     * @param _bukPoSContract Address of the Buk PoS NFTs contract
     * @param _bukProtocolContract Address of the buk protocol contract
     * @param _bukTreasuryContract Address of the Buk treasury contract.
     */
    constructor(
        string memory _contractName,
        address _bukPoSContract,
        address _bukProtocolContract,
        address _bukTreasuryContract
    ) ERC1155("") {
        _setNFTContractName(_contractName);
        _setBukTreasury(_bukTreasuryContract);
        _setBukPOSNFTRole(_bukPoSContract);
        _setBukProtocol(_bukProtocolContract);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
    }

    /**
     * @dev See {IBukNFTs-setBukProtocol}.
     */
    function setBukProtocol(
        address _bukProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukProtocol(_bukProtocolContract);
    }

    /**
     * @dev See {IBukNFTs-setBukTreasury}.
     */
    function setBukTreasury(
        address _bukTreasuryContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukTreasury(_bukTreasuryContract);
    }

    /**
     * @dev See {IBukNFTs-setMarketplaceRole}.
     */
    function setMarketplaceRole(
        address _marketplaceContract
    ) external onlyRole(ADMIN_ROLE) {
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
        emit SetMarketplace(_marketplaceContract);
    }

    /**
     * @dev See {IBukNFTs-setBukPOSNFTRole}.
     */
    function setBukPOSNFTRole(
        address _nftPoSContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukPOSNFTRole(_nftPoSContract);
    }

    /**
     * @dev See {IBukNFTs-setNFTContractName}.
     */
    function setNFTContractName(
        string memory _contractName
    ) external onlyRole(ADMIN_ROLE) {
        _setNFTContractName(_contractName);
    }

    /**
     * @dev See {IBukNFTs-setURI}.
     */
    function setURI(
        uint256 _id,
        string memory _newuri
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(uriByTokenId[_id]).length != 0, "Token does not exist on BukNFTs");
        _setURI(_id, _newuri);
    }

    /**
     * @dev See {IBukNFTs-mint}.
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
     * @dev See {IBukNFTs-burn}.
     */
    function burn(
        address _account,
        uint256 _id,
        uint256 _amount,
        bool _mintPoS
    ) external onlyRole(BUK_PROTOCOL_CONTRACT_ROLE) {
        string memory uri_ = uriByTokenId[_id];
        delete uriByTokenId[_id];
        if (_mintPoS) {
            nftPoSContract.mint(_account, _id, _amount, uri_, "");
        }
        _burn(_account, _id, _amount);
    }

    /**
     * @dev See {IBukNFTs-royaltyInfo}.
     */
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        IBukRoyalties.Royalty[] memory royaltyArray = bukProtocolContract
            .getRoyaltyInfo(_tokenId);
        uint256 royaltyAmount_ = 0;
        for (uint i = 0; i < royaltyArray.length; i++) {
            royaltyAmount_ += ((_salePrice * royaltyArray[i].royaltyFraction) /
                _feeDenominator());
        }
        return (address(_bukTreasury), royaltyAmount_);
    }

    /**
     * @dev Returns the contract name of BukNFTs.
     * @return string - The Buk NFT contract name.
     */
    /**
     * @dev See {IBukNFTs-getName}.
     */
    function getName() external view returns (string memory) {
        return name;
    }

    /**
     * @dev See {IBukNFTs-safeTransferFrom}.
     */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    )
        public
        virtual
        override(ERC1155, IBukNFTs)
        onlyRole(MARKETPLACE_CONTRACT_ROLE)
    {
        require(
            (block.timestamp <
                (bukProtocolContract.getBookingDetails(_id).checkin -
                    (bukProtocolContract.getBookingDetails(_id).tradeTimeLimit *
                        3600)) &&
                bukProtocolContract.getBookingDetails(_id).tradeable),
            "Trade limit time crossed"
        );
        require(
            isApprovedForAll(_from, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        require(balanceOf(_from, _id) > 0, "From address does not own NFT");
        super._safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /**
     * @dev See {IBukNFTs-safeBatchTransferFrom}.
     */
    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    )
        public
        virtual
        override(ERC1155, IBukNFTs)
        onlyRole(MARKETPLACE_CONTRACT_ROLE)
    {
        require(
            isApprovedForAll(_from, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );
        uint256 len = _ids.length;
        for (uint i = 0; i < len; ++i) {
            require(
                (block.timestamp <
                    (bukProtocolContract.getBookingDetails(_ids[i]).checkin -
                        (bukProtocolContract
                            .getBookingDetails(_ids[i])
                            .tradeTimeLimit * 3600)) &&
                    bukProtocolContract.getBookingDetails(_ids[i]).tradeable),
                "Trade limit time crossed"
            );
            require(
                balanceOf(_from, _ids[i]) > 0,
                "From address does not own NFT"
            );
        }
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    /**
     * @dev See {IBukNFTs-setBukProtocol}.
     */
    function uri(
        uint256 _id
    ) public view virtual override(ERC1155, IBukNFTs) returns (string memory) {
        return uriByTokenId[_id];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, IERC165, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev The denominator with which to interpret the fee set in {_setTokenRoyalty} and {_setDefaultRoyalty} as a
     * fraction of the sale price. Defaults to 10000 so fees are expressed in basis points, but may be customized by an
     * override.
     */
    function _feeDenominator() internal pure virtual returns (uint96) {
        return 10000;
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
        _grantRole(BUK_PROTOCOL_CONTRACT_ROLE, _bukProtocolContract);
        _revokeRole(BUK_PROTOCOL_CONTRACT_ROLE, oldBukProtocolContract_);
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
     * Private function to set the role to a BukPOSNFT contract
     * @param _nftPoSContract The address of the BukPOSNFT contract to grant the role to
     */
    function _setBukPOSNFTRole(address _nftPoSContract) private {
        address oldNftPoSContract_ = address(nftPoSContract);
        nftPoSContract = IBukPOSNFTs(_nftPoSContract);
        emit SetNftPoSContractRole(oldNftPoSContract_, _nftPoSContract);
    }

    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @param _newuri - The URI associated with the token ID.
     */
    function _setURI(uint256 _id, string memory _newuri) private {
        string memory olduri_ = uriByTokenId[_id];
        uriByTokenId[_id] = _newuri;
        emit SetURI(_id, olduri_, _newuri);
    }
}
