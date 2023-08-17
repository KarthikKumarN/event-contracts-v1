# BUK Protocol NFT Contract

The `BukNFTs` contract is a Solidity smart contract designed for managing hotel room-night inventory and ERC1155 token management for room-night NFTs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Events](#events)
- [Interface: IBukNFTs](#interface-ibuknfts)
- [License](#license)

## Overview

The contract is designed with the following key components:

- **Buk Treasury**: Address of the Buk treasury contract.
- **Buk PoS NFT Collection**: Name and address of the Buk PoS NFT collection contract.
- **Buk Protocol**: Address of the Buk Protocol contract.
- **Token URI Mapping**: Mapping for token URI's for booked tickets.
- **Roles**: Constants for roles like Buk Protocol contract, marketplace contract, and admin.

## Features

- **Role-based Access**: Different functionalities accessible by admin, marketplace, and Buk Protocol contract.
- **Token URI Management**: Functions to set and retrieve token URIs.
- **NFT Minting and Burning**: Functions to mint and burn NFTs.
- **Royalty Information**: Function to retrieve royalty information for a specific token.
- **Safe Transfers**: Functions to safely transfer NFTs.

## Functions

### Public and External Functions:

- **setBukProtocol**: Set the Buk Protocol Contract address.
- **setBukTreasury**: Set the treasury address.
- **setMarketplaceRole**: Set the marketplace address.
- **setBukPOSNFTRole**: Set the BukPOSNFT to the contract.
- **setNFTContractName**: Set the name of the contract.
- **setURI**: Sets the URI for a specific token ID.
- **mint**: Mint a new NFT with a specific token ID, account, amount, and data.
- **burn**: Burn a specific NFT.
- **royaltyInfo**: To retrieve information about the royalties associated with a specific token.
- **safeTransferFrom**: Transfers ownership of an NFT token from one address to another.
- **safeBatchTransferFrom**: Transfers ownership of multiple NFT tokens from one address to another.
- **uri**: Returns the URI associated with the token ID.

### Private Functions:

- **_setNFTContractName**: Update the contract name.
- **_setBukProtocol**: Set the Buk Protocol Contract address.
- **_setBukTreasury**: Set the BukTreasury contract address.
- **_setBukPOSNFTRole**: Set the role to a BukPOSNFT contract.
- **_setURI**: Returns the URI associated with the token ID.

## Events

- **SetBukProtocol**: Emitted when Buk Protocol Address is updated.
- **SetBukTreasury**: Emitted when treasury is updated.
- **SetMarketplace**: Emitted when marketplace role is granted.
- **SetNFTContractName**: Event to update the contract name.
- **SeNftPoSContractRole**: Event to set NFT contract role.
- **SetURI**: Event to set token URI.

## Interface: IBukNFTs

The `IBukNFTs` interface provides a blueprint for the main `BukNFTs` contract. It defines the essential functions, events, and data structures that the main contract should implement.

### Key Components:

- **Events**: Various events like `SetBukProtocol`, `SetBukTreasury`, `SetMarketplace`, etc.
- **Functions**: Functions like `setBukProtocol`, `setBukTreasury`, `setMarketplaceRole`, etc.

## License

This project is licensed under the MIT License.