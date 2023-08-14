// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IBukPOSNFTs is IERC1155 {

    /**
     * @dev Event to set NFT contract role
     */
    event SetNftContractRole(address indexed nftContractAddr);

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
    event SetNFTContractName(string indexed name);

    /**
     * @dev Event to set token URI
     */
    event SetURI(uint indexed id, string indexed uri);

    /**
     * @dev Custom error in the function to show that the NFT is not minted.
     */
    error NotYetMinted(string message);

    /**
     * @dev Function to update the Buk Protocol Contract address.
     * @param _bukProtocolContract Address of the Buk Protocol Contract.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
     */
    function setBukProtocol(address _bukProtocolContract) external;
    
    /**
     * @dev Function to update the treasury address.
     * @param _bukTreasuryContract Address of the treasury.
     * @notice This function can only be called by addresses with `ADMIN_ROLE`
     */
    function setBukTreasury(address _bukTreasuryContract) external;

    /**
     * @dev Function to set the BukNFT role to a given contract
     * @param _nftContract address: The address of the NFT contract
     * @notice This function can only be called by a contract with `ADMIN_ROLE`
     */
    function setBukNFTRole(address _nftContract) external;

    /**
     * @dev Function to set the contract name
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function setNFTContractName(string memory _contractName) external;

    /**
     * @dev Function to set the URI for a given ID
     * @param _id uint256: The ID of the token
     * @param _newuri string: The new URI of the token
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function setURI(uint256 _id, string memory _newuri) external;

    /**
     * @dev Function to mint tokens
     * @param _account address: The address to which the tokens will be minted
     * @param _id uint256: The ID of the token
     * @param _amount uint256: The amount of tokens to be minted
     * @param _newuri string: The URI of the token
     * @param _data bytes: Additional data associated with the token
     * @notice This function can only be called by a contract with `BUK_NFT_CONTRACT_ROLE`
     */
    function mint(
        address _account,
        uint256 _id,
        uint256 _amount,
        string calldata _newuri,
        bytes calldata _data
    ) external;

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
    ) external;

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
    ) external;

    /**
     * @dev Function to get the URI for a given ID
     * @param _id uint256: The ID of the token
     */
    function uri(uint256 _id) external view returns (string memory);
}
