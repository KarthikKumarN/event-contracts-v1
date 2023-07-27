// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukTripsUtilityNFT {

    function grantBukTripsNFTRole(address _nftContract) external;

    function grantFactoryRole(address _factoryContract) external;

    function updateName(string memory _contractName) external;

    function mint(address account, uint256 _id, uint256 amount, string calldata _newuri, bytes calldata data) external;

    function setURI(uint256 _id, string memory _newuri) external;
}
