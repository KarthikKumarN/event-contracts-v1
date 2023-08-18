# BUK Protocol Marketplace Contract

The `Marketplace` contract is a Solidity smart contract designed for managing the listing, delisting, buying, and other marketplace functionalities for BUK Protocol NFTs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Events](#events)
- [Interface: IMarketplace](#interface-imarketplace)
- [License](#license)

## Overview

The contract is designed with the following key components:

- **BUK Protocol**: Address of the BUK Protocol contract.
- **BUK NFTs Contract**: Address of the BUK NFTs contract.
- **Stable Token**: ERC20 token used for transactions in the marketplace.
- **Listed NFTs**: Mapping of listed bookings for sale.
- **Roles**: Constants for roles like ADMIN and BUK_PROTOCOL.

## Features

- **NFT Listing**: Allows users to list their NFTs for sale.
- **NFT Delisting**: Allows users to delist their NFTs.
- **NFT Buying**: Enables users to buy listed NFTs.
- **Role-based Access**: Different functionalities accessible by admin, BUK Protocol, and NFT owners.
- **Stable Token Transactions**: Uses a stable token for transactions in the marketplace.

## Functions

### Public and External Functions:

- **createListing**: List a booking/room NFT for sale.
- **delist**: Delist a booking/room NFT.
- **deleteListing**: Delete a listing of a booking/room NFT.
- **relist**: Update the price and status for a listed NFT.
- **buyRoom**: Buy a listed room/booking NFT.
- **setBukProtocol**: Set a new BUK Protocol address.
- **setBukNFT**: Set a new BUK NFT address.
- **setStableToken**: Set a new stable token address.
- **getStableToken**: Get the address of the stable token.
- **getBukProtocol**: Get the current BUK Protocol address.
- **getBukNFT**: Get the current BUK NFT address.
- **getListingDetails**: Provide listing details of a booking.
- **isBookingListed**: Check if a booking/NFT is listed.

### Private Functions:

- **\_setBukNFT**: Set a new BUK NFT address.
- **\_setBukProtocol**: Set a new BUK Protocol address.
- **\_setStableToken**: Set a new stable token address.
- **\_buy**: Safe transfer NFT to buyer and transfer the price to the owner.

## Events

- **RoomBought**: Emitted when a room/booking NFT is bought.
- **ListingCreated**: Emitted when a room/booking NFT is listed for sale.
- **Relisted**: Emitted when a booking/room NFT is relisted with a new price.
- **Delisted**: Emitted when a booking/room NFT is delisted.
- **DeletedListing**: Emitted when a booking/room listing is deleted.
- **BukProtocolSet**: Emitted when a new BUK Protocol address is set.
- **BukNFTSet**: Emitted when a new BUK NFT address is set.
- **StableTokenSet**: Emitted when a new stable token address is set.

## Interface: IMarketplace

The `IMarketplace` interface provides a blueprint for the main `Marketplace` contract. It defines the essential functions, events, and data structures that the main contract should implement.

### Key Components:

- **ListingDetails**: Struct to define the booking/room listing details.
- **ListingStatus**: Enum for listing statuses.
- **Events**: Various events like `RoomBought`, `ListingCreated`, `Relisted`, etc.
- **Functions**: Functions like `createListing`, `delist`, `deleteListing`, `relist`, etc.

## License

This project is licensed under the MIT License.
