# BUK Protocol Proof of Stay NFTs Contract

The `BukPOSNFTs` contract is a Solidity smart contract designed for managing Proof-of-Stay utility NFT ERC1155 token.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Events](#events)
- [Interface: IBukPOSNFTs](#interface-ibukposnfts)
- [License](#license)

## Overview

The contract is designed with the following key components:

- **Buk Treasury**: Address of the Buk treasury contract.
- **BukNFTs Contract**: Address of the BukNFTs contract.
- **Buk Protocol**: Address of the Buk Protocol contract.
- **Token URI Mapping**: Mapping for token URI's for Buk PoS NFTs.
- **Roles**: Constants for roles like Buk NFT contract, Buk Protocol contract, and admin.

## Features

- **Role-based Access**: Different functionalities accessible by admin, Buk NFT contract, and Buk Protocol contract.
- **Token URI Management**: Functions to set and retrieve token URIs.
- **NFT Minting**: Functions to mint new NFTs.
- **Safe Transfers**: Functions to safely transfer NFTs.

## Functions

### Public and External Functions:

- **setBukProtocol**: Set the Buk Protocol Contract address.
- **setBukTreasury**: Set the Buk Treasury address.
- **setBukNFTRole**: Set the BukNFT role to a given contract.
- **setNFTContractName**: Set the name of the contract.
- **setURI**: Sets the URI for a specific token ID.
- **mint**: Mint a new NFT with a specific token ID, account, amount, and data.
- **getName**: Returns the contract name of BukPOSNFTs.
- **safeTransferFrom**: Transfers ownership of an NFT token from one address to another.
- **safeBatchTransferFrom**: Transfers ownership of multiple NFT tokens from one address to another.
- **uri**: Returns the URI associated with the token ID.

### Private Functions:

- **_setNFTContractName**: Update the contract name.
- **_setBukProtocol**: Set the Buk Protocol Contract address.
- **_setBukTreasury**: Set the BukTreasury contract address.
- **_setURI**: Returns the URI associated with the token ID.

## Events

- **SetNftContractRole**: Emitted when NFT contract role is set.
- **SetBukProtocol**: Emitted when Buk Protocol Address is updated.
- **SetBukTreasury**: Emitted when treasury is updated.
- **SetNFTContractName**: Event to update the contract name.
- **SetURI**: Event to set token URI.

## Interface: IBukPOSNFTs

The `IBukPOSNFTs` interface provides a blueprint for the main `BukPOSNFTs` contract. It defines the essential functions, events, and data structures that the main contract should implement.

### Key Components:

- **Events**: Various events like `SetNftContractRole`, `SetBukProtocol`, `SetBukTreasury`, etc.
- **Functions**: Functions like `setBukProtocol`, `setBukTreasury`, `setBukNFTRole`, etc.

## License

This project is licensed under the MIT License.
