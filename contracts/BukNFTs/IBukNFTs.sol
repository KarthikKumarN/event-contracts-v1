// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface IBukNFTs is IERC1155 {

    function updateName(string memory contractName) external;

    function grantBukProtocolRole(address bukProtocolContract) external;

    function uri(uint256 id) external view returns (string memory);

    function mint(uint256 id, address account, uint256 amount, bytes calldata data, string calldata uri, bool status) external returns (uint256);

    function burn(address account, uint256 id, uint256 amount, bool utility) external;
    
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
    
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;

    function setURI(uint256 id, string memory newuri) external;

}
