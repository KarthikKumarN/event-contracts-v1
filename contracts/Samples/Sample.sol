// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YourNFTContract is ERC1155, Ownable {
    //FIXME To be added to Buk Protocol
    // Define the percentage and recipient of royalties for each token.
    // The key is the token ID, and the value is an array of struct that includes the recipient's address and the percentage.
    mapping (uint256 => Royalty[]) public royalties;

    //FIXME To be added to Buk Protocol
    struct Royalty {
        address recipient;
        uint256 percentage;
    }

    constructor(string memory uri) ERC1155(uri) {}

    //FIXME To be added to Buk NFTs
    // Implement a modified royaltyInfo function from EIP-2981 to return an array of royalties.
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view returns (address[] memory receivers, uint256[] memory royaltyAmounts) {
        Royalty[] memory royaltyArray = royalties[_tokenId];
        receivers = new address[](royaltyArray.length);
        royaltyAmounts = new uint256[](royaltyArray.length);

        for (uint i = 0; i < royaltyArray.length; i++) {
            receivers[i] = royaltyArray[i].recipient;
            royaltyAmounts[i] = (_salePrice * royaltyArray[i].percentage) / 100;
        }

        return (receivers, royaltyAmounts);
    }

    //FIXME To be added to Buk NFTs
    // Allows the contract owner to define the royalties for a token.
    function setRoyalties(uint256 _tokenId, address[] memory _recipients, uint256[] memory _percentages) external onlyOwner {
        require(_recipients.length == _percentages.length, "Input arrays must have the same length");
        delete royalties[_tokenId]; // Clear any existing royalties
        for (uint i = 0; i < _recipients.length; i++) {
            require(_percentages[i] <= 100, "Percentage is more than 100");
            royalties[_tokenId].push(Royalty(_recipients[i], _percentages[i]));
        }
    }

    // A simple minting function for demonstration.
    function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyOwner {
        _mint(account, id, amount, data);
    }
}
