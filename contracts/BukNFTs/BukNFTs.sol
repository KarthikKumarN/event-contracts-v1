// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import { ERC1155, IERC165 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import { IBukNFTs } from "../BukNFTs/IBukNFTs.sol";
import { IBukEventProtocol, IBukRoyalties } from "../BukEventProtocol/IBukEventProtocol.sol";
import { IBukTreasury } from "../BukTreasury/IBukTreasury.sol";

/**
 * @title BUK Protocol NFT Contract
 * @author BUK Technology Inc
 * @dev Contract for managing hotel room-night inventory and ERC1155 token management for room-night NFTs
 */
contract BukNFTs is AccessControl, ERC1155, IBukNFTs, Pausable {
    /// @dev Name of the Buk Event NFT collection contract
    string public name;

    /**
     * @dev The denominator with which to interpret the fee set in {_setTokenRoyalty} and {_setDefaultRoyalty} as a
     * fraction of the sale price. Defaults to 10000 so fees are expressed in basis points, but may be customized by an
     * override.
     */
    uint16 public constant FEE_DENOMINATOR = 10000;

    /// @dev Address of the Buk Protocol contract
    IBukEventProtocol public bukEventProtocolContract;

    /// @dev Address of the Buk treasury contract.
    IBukTreasury private _bukTreasury;

    /// @dev Mapping for token URI's for booked tickets
    mapping(uint256 => string) public uriByTokenId; //tokenId -> uri

    /**
     * @dev Constant for the role of the Buk Protocol contract
     * @notice its a hash of keccak256("BUK_PROTOCOL_ROLE")
     */
    bytes32 public constant BUK_PROTOCOL_ROLE =
        0xc90056e279113999fe5438fedaf4c98ded59812067ad79dd0c968b1a84dc7c97;

    /**
     * @dev Constant for the role of the marketplace contract
     * @notice its a hash of keccak256("MARKETPLACE_CONTRACT_ROLE")
     */
    bytes32 public constant MARKETPLACE_CONTRACT_ROLE =
        0x0d718b8af83cb9b4167cc490bac82a506e58f2696ce3ccf6e4e1deac9240d19f;

    /**
     * @dev Constant for the role of the admin
     * @notice its a hash of keccak256("ADMIN_ROLE")
     */
    bytes32 public constant ADMIN_ROLE =
        0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775;

    /**
     * @dev Constructor to initialize the contract
     * @param _contractName NFT contract name
     * @param _bukEventProtocolContract Address of the buk protocol contract
     * @param _bukTreasuryContract Address of the Buk treasury contract.
     */
    constructor(
        string memory _contractName,
        address _bukEventProtocolContract,
        address _bukTreasuryContract
    ) ERC1155("") {
        name = _contractName;
        _setBukTreasury(_bukTreasuryContract);
        _setBukEventProtocol(_bukEventProtocolContract);
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
        _grantRole(BUK_PROTOCOL_ROLE, _bukEventProtocolContract);
    }

    /**
     * @dev Function to pause the contract.
     * @notice This function can only be called by admin
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Function to unpause the contract.
     * @notice This function can only be called by admin
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /// @dev See {IBukNFTs-setBukEventProtocol}.
    function setBukEventProtocol(
        address _bukEventProtocolContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukEventProtocol(_bukEventProtocolContract);
    }

    /// @dev See {IBukNFTs-setBukTreasury}.
    function setBukTreasury(
        address _bukTreasuryContract
    ) external onlyRole(ADMIN_ROLE) {
        _setBukTreasury(_bukTreasuryContract);
    }

    /// @dev See {IBukNFTs-setMarketplaceRole}.
    function setMarketplaceRole(
        address _marketplaceContract
    ) external onlyRole(ADMIN_ROLE) {
        _grantRole(MARKETPLACE_CONTRACT_ROLE, _marketplaceContract);
        emit SetMarketplace(_marketplaceContract);
    }

    /// @dev See {IBukNFTs-setURI}.
    function setURI(
        uint256 _id,
        string memory _newuri
    ) external onlyRole(ADMIN_ROLE) {
        require(
            bytes(uriByTokenId[_id]).length != 0,
            "Token does not exist on BukNFTs"
        );
        _setURI(_id, _newuri);
    }

    /// @dev See {IBukNFTs-mint}.
    function mint(
        uint256 _id,
        address _account,
        uint256 _amount,
        bytes calldata _data,
        string calldata _uri
    ) external onlyRole(BUK_PROTOCOL_ROLE) returns (uint256) {
        _mint(_account, _id, _amount, _data);
        _setURI(_id, _uri);
        return (_id);
    }

    /// @dev See {IBukNFTs-burn}.
    function burn(
        address _account,
        uint256 _id,
        uint256 _amount
    ) external onlyRole(BUK_PROTOCOL_ROLE) {
        delete uriByTokenId[_id];

        _burn(_account, _id, _amount);
    }

    /// @dev See {IBukNFTs-royaltyInfo}.
    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        IBukRoyalties.Royalty[] memory royaltyArray = bukEventProtocolContract
            .getRoyaltyInfo(_tokenId);
        uint256 royaltyAmount_;
        for (uint i = 0; i < royaltyArray.length; i++) {
            royaltyAmount_ += ((_salePrice * royaltyArray[i].royaltyFraction) /
                FEE_DENOMINATOR);
        }
        return (address(_bukTreasury), royaltyAmount_);
    }

    /// @dev See {IBukNFTs-safeTransferFrom}.
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
        whenNotPaused
    {
        IBukEventProtocol.Booking memory details = bukEventProtocolContract
            .getBookingDetails(_id);
        require(
            (block.timestamp <
                (details.checkin - (details.tradeTimeLimit * 3600)) &&
                details.tradeable),
            "Trade limit time crossed"
        );
        require(
            isApprovedForAll(_from, _msgSender()),
            "Not a token owner or approved"
        );
        super._safeTransferFrom(_from, _to, _id, _amount, _data);
    }

    /// @dev See {IBukNFTs-safeBatchTransferFrom}.
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
        whenNotPaused
    {
        require(
            isApprovedForAll(_from, _msgSender()),
            "Not a token owner or approved"
        );
        uint256 len = _ids.length;
        for (uint i = 0; i < len; ++i) {
            IBukEventProtocol.Booking memory details = bukEventProtocolContract
                .getBookingDetails(_ids[i]);
            require(
                (block.timestamp <
                    (details.checkin -
                        (bukEventProtocolContract
                            .getBookingDetails(_ids[i])
                            .tradeTimeLimit * 3600)) &&
                    details.tradeable),
                "Trade limit time crossed"
            );
        }
        super._safeBatchTransferFrom(_from, _to, _ids, _amounts, _data);
    }

    /// @dev See {IBukNFTs-setBukEventProtocol}.
    function uri(
        uint256 _id
    ) public view virtual override(ERC1155, IBukNFTs) returns (string memory) {
        return uriByTokenId[_id];
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, IERC165, ERC1155) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Private function to set the Buk Protocol Contract address.
     * @param _bukEventProtocolContract The address of the Buk Protocol contract
     */
    function _setBukEventProtocol(address _bukEventProtocolContract) private {
        address oldBukEventProtocolContract_ = address(
            bukEventProtocolContract
        );
        bukEventProtocolContract = IBukEventProtocol(_bukEventProtocolContract);
        _grantRole(BUK_PROTOCOL_ROLE, _bukEventProtocolContract);
        _revokeRole(BUK_PROTOCOL_ROLE, oldBukEventProtocolContract_);
        emit SetBukEventProtocol(
            oldBukEventProtocolContract_,
            _bukEventProtocolContract
        );
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
        string memory olduri_ = uriByTokenId[_id];
        uriByTokenId[_id] = _newuri;
        emit SetURI(_id, olduri_, _newuri);
    }
}
