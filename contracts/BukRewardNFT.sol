// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BukRewardNFT
 * @dev ERC721 token contract with role-based access control for minting with calldata and fixed IPFS URI.
 */
contract BukRewardNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    AccessControl
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;
    string public TOKEN_URI = "";

    event Minted(address indexed to, uint256 indexed tokenId);
    event SafeMinted(address indexed to, uint256 indexed tokenId, bytes data);
    event BatchSafeMinted(
        address indexed to,
        uint256 indexed tokenIdStart,
        uint256 amount
    );

    constructor(
        address initialAdmin,
        address initialMinter,
        string memory contractName,
        string memory contractSymbol,
        string memory tokenURL
    ) ERC721(contractName, contractSymbol) {
        TOKEN_URI = tokenURL;
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialMinter);
    }

    /**
     * @dev Grant the minter role to a new address.
     */
    function setMinterRole(
        address minter
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Safely mint a new token with arbitrary `data` for contract recipients.
     * This `data` is forwarded to `onERC721Received` in case the recipient is a contract.
     */
    function safeMint(
        address to,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId, data); // Forwarding data to `onERC721Received` if needed
        _setTokenURI(tokenId, TOKEN_URI);
        emit SafeMinted(to, tokenId, data);
    }

    /**
     * @dev Batch mint multiple tokens to the same address with arbitrary `data`.
     * This can be useful for scenarios like airdrops.
     */
    function batchSafeMint(
        address to,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(MINTER_ROLE) {
        uint256 startTokenId = _nextTokenId;
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId, data);
            _setTokenURI(tokenId, TOKEN_URI);
        }
        emit BatchSafeMinted(to, startTokenId, amount);
    }

    /**
     * Function will mint NFT
     * @dev Only MINTER_ROLE can mint
     */
    function mint(
        address account,
        uint256 amount,
        bytes memory
    ) public onlyRole(MINTER_ROLE) {
        for (uint256 i; i < amount; ++i) {
            uint256 tokenId = _nextTokenId++;
            _mint(account, tokenId);
            _setTokenURI(tokenId, TOKEN_URI);
        }
    }

    /**
     * @dev Override tokenURI to return the correct URI from ERC721URIStorage.
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * The following functions are overrides required by Solidity.
     **/
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
