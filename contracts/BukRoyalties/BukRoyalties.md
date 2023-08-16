# BukRoyalties Contract

The `BukRoyalties` contract is a Solidity smart contract designed to manage the royalty system for the Buk Protocol. It provides functionalities to set and retrieve royalty information for various entities involved in the protocol.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Events](#events)
- [Interface: IBukRoyalties](#interface-ibukroyalties)
- [License](#license)

## Overview

The contract is designed with the following key components:

- **Roles**: Uses the AccessControl library from OpenZeppelin to manage roles.
- **Royalty Struct**: A struct to capture the details of each royalty.
- **Royalty Arrays**: Arrays to store different types of royalties.

## Features

- **Role-based Access**: Different functionalities accessible by users with the `ADMIN_ROLE`.
- **Royalty Management**: Functions to set and retrieve royalty information for Buk, Hotel, First Owners, and other entities.

## Functions

### Public and External Functions:

- **setBukProtocolContract**: Sets the Buk Protocol address.
- **setBukRoyaltyInfo**: Defines the royalty fraction for Buk.
- **setHotelRoyaltyInfo**: Defines the royalty fraction for Hotel.
- **setFirstOwnerRoyaltyInfo**: Defines the royalty fraction for the First Owners.
- **setOtherRoyaltyInfo**: Defines the royalties for other entities.
- **getRoyaltyInfo**: Retrieves royalty information for a given token ID.

## Events

- **SetBukProtocol**: Emitted when the Buk Protocol address is updated.
- **SetBukRoyalty**: Emitted when the Buk royalty is updated.
- **SetHotelRoyalty**: Emitted when the Hotel royalty is updated.
- **SetFirstOwnerRoyalty**: Emitted when the First Owner royalty is updated.
- **SetOtherRoyalties**: Emitted when other royalties are updated.

## Interface: IBukRoyalties

The contract also defines an interface `IBukRoyalties` which outlines the expected structure and functions for the BukRoyalties contract. The interface includes:

- **Royalty Struct**: A struct to capture the details of each royalty.
- **Events**: Events related to updating the Buk Protocol address and setting royalties.
- **Functions**: Functions to set the Buk Protocol address, define royalty fractions, and retrieve royalty information.


## License

This project is licensed under the MIT License.