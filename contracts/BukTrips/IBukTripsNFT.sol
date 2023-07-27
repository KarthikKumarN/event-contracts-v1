// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukTripsNFT {

    function updateName(string memory contractName) external;

    function grantFactoryRole(address _factory_contract) external;

    function uri(uint256 id) external view returns (string memory);

    function mint(uint256 _id, address account, uint256 amount, bytes calldata data, string calldata _uri, bool _status) external returns (uint256);

    function burn(address account, uint256 id, uint256 amount, bool utility) external;
    
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
    
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) external;

    function setURI(uint256 _id, string memory _newuri) external;

}
