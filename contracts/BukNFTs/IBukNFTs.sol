// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IBukNFTs is IERC1155 {

    /**
     * @dev Update the name of the contract.
     * @notice This function can only be called by addresses with `BUK_PROTOCOL_CONTRACT_ROLE`
     */
    function updateName(string memory _contractName) external;

    /**
    * @dev Function to update the marketplace address.
    * @param _marketplaceContract Address of the marketplace.
     * @notice This function can only be called by addresses with `DEFAULT_ADMIN_ROLE`
    */
    function addMarketplace(address _marketplaceContract) external;

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
    ) external returns (uint256);


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
    ) external;

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
    ) external;

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
    ) external;

    /**
     * @dev name of the Buk PoS NFT contract
     */
    function name() external view returns (string memory);

    /**
     * @dev address of the Buk PoS NFT contract
     */
    function nftPoSContract() external view returns (address);

    /**
     * @dev address of the Buk Protocol contract
     */
    function bukProtocolContract() external view returns (address);

    /**
     * @dev Mapping for token URI's for Buk PoS NFTs
     * @param _id uint256: The ID of the token
     */
    function bookingTickets(uint256 _id) external view returns (string memory);

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
