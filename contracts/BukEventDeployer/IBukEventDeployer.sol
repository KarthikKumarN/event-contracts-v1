// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IBukEventDeployer {
    event DeployedEventNFT(string name);

    /**
     * @dev Emitted when new BukEventProtocol address has been updated
     * @param newAddress, Address of the new bukProtocol
     */
    event SetBukEventProtocol(address newAddress);

    /**
     * @dev Function will set new BUK protocol address
     * @param _bukProtocol address of new BUK protocol
     */
    function setBukEventProtocol(address _bukProtocol) external;

    function deployEventNFT(
        string calldata _name,
        address _bukEventProtocol,
        address _bukTreasury
    ) external returns (address);
}
