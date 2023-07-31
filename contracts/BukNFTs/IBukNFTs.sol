// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IBukNFTs is IERC1155 {

    /**
     * @dev To set the buk protocol role.
     * @param _bukProtocolContract - Address of buk protocol contract
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function grantBukProtocolRole(address _bukProtocolContract) external;

    /**
     * @dev Update the name of the contract.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function updateName(string memory _contractName) external;

    /**
     * @dev Sets the URI for a specific token ID.
     * @param _id - The ID of the token.
     * @param _newuri - The new URI for the token.
     * @notice This function can only be called by a contract with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function setURI(uint256 _id, string memory _newuri) external;

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
    ) external returns (uint256);


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
    ) external;

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
    ) external;

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
    ) external;

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
        returns (address[] memory receivers, uint256[] memory royaltyAmounts);


    /**
     * @dev Returns the URI associated with the token ID.
     * @param _id - The token ID to retrieve the URI for.
     * @return string - The URI associated with the token ID.
     */
    function uri(uint256 _id) external view returns (string memory);
}
