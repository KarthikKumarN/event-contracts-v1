// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title The token used to pay for getting BukNFT
 * @author buk.technology
 * @dev IERC20 used for test purposes
 */
contract Token is ERC20 {
    uint8 private immutable _decimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address receiver_,
        uint totalSupply_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
        _mint(receiver_, totalSupply_ * (10 ** decimals_));
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
