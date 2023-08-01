// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukPOSNFTs {

    function grantBukNFTRole(address nftContractAddr) external;

    function grantBukProtocolRole(address bukProtocolContract) external;

    function updateName(string memory contractName) external;

    function mint(address account, uint256 id, uint256 amount, string calldata newuri, bytes calldata data) external;

    function setURI(uint256 id, string memory newuri) external;

    function setContractURI(string memory contractUri) external;
}
