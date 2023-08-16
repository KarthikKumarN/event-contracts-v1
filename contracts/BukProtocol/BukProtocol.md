# BukProtocol Contract

The `BukProtocol` contract is a Solidity smart contract designed for a booking system that leverages the power of Non-Fungible Tokens (NFTs). It provides functionalities for users to book rooms, manage their bookings, and interact with related NFTs.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Events](#events)
- [Interface: IBukProtocol](#interface-ibukprotocol)
- [License](#license)

## Overview

The contract is designed with the following key components:

- **Booking Status**: Different statuses a booking can have, such as booked, confirmed, checked-in, etc.
- **Booking Details**: Struct capturing all relevant details of a booking.
- **NFT Interaction**: Functions related to the creation, transfer, and management of NFTs representing bookings.

## Features

- **NFT-based Bookings**: Each booking is represented as an NFT, providing uniqueness and tradeability.
- **Role-based Access**: Different functionalities accessible by users, NFT owners, and admins.
- **Emergency Cancellation**: Special function for admins to handle unforeseen cancellations.
- **Royalty System**: Integration with a royalty system for NFT transactions.

## Functions

### Public and External Functions:

- **checkin**: Allows users to check into their bookings.
- **checkout**: Admin function to check out bookings.
- **cancelRoom**: Admin function to cancel a booking.
- **emergencyCancellation**: Admin function for emergency cancellations.
- **getWallets**: Retrieve addresses of related contracts.
- **getBookingDetails**: Fetch details of a specific booking.
- **getRoyaltyInfo**: Retrieve royalty information for a given NFT.
- **setAdminWallet**: Set the admin wallet address.
- **setSignatureVerifier**: Set the address of the signature verifier contract.
- **setBukTreasury**: Update the treasury address.
- **setBukWallet**: Update the Buk Wallet address to collect commission.
- **setStableToken**: Update the stable token address.
- **setBukNFTs**: Update the BukNFTs contract address.
- **setBukPoSNFTs**: Update the BukPOSNFTs contract address.
- **setRoyaltiesContract**: Sets the Buk royalties contract address.
- **setTokenUri**: Update the token uri.
- **setNFTContractName**: Set the name of the contract.
- **setCommission**: Set the Buk commission percentage.
- **toggleTradeability**: Toggle the tradeability of an asset.
- **bookRoom**: Function to book rooms.

### Private Functions:

- **_setAdminWallet**: Set the Admin Wallet address.
- **_setSignatureVerifier**: Set the Signature Verifier contract address.
- **_setBukTreasury**: Set the BukTreasury contract address.
- **_setBukWallet**: Set the BukWallet contract address.
- **_setStableToken**: Set the stable token contract address.
- **_bookingPayment**: Function to do the booking payment.

## Events

- **SetAdminWallet**: Triggered when the admin wallet is updated.
- **BookRoom**: Emitted when a room is booked.
- **CheckinRooms**: Emitted when check-in is done.
- **CheckoutRooms**: Emitted upon checkout.
- **CancelRoom**: Emitted when a booking is cancelled.
- **SetCommission**: Emitted when the commission is set.
- **SetTokenURI**: Emitted when token uri is set.
- **SetBukNFTs**: Emitted when BukNFTs contract address is updated.
- **SetBukPoSNFTs**: Emitted when BukPOSNFTs contract address is updated.
- **SetRoyaltiesContract**: Emitted when BukRoyalties contract address is updated.
- **SetSignerVerifier**: Emitted when signer verifier is updated.
- **SetBukTreasury**: Emitted when Buk treasury is updated.
- **SetBukWallet**: Emitted when Buk Wallet is updated.
- **SetStableToken**: Emitted when stable token is updated.
- **SetNFTContractName**: Event to update the contract name.
- **ToggleTradeability**: Emitted when the tradeability of a Buk NFT is toggled.

## Interface: IBukProtocol

The `IBukProtocol` interface provides a blueprint for the main `BukProtocol` contract. It defines the essential functions, events, and data structures that the main contract should implement.

### Key Components:

- **BookingStatus Enum**: Represents the different statuses a booking can have.
- **Booking Struct**: Captures all the details of a booking.
- **Events**: Various events like `SetAdminWallet`, `BookRoom`, `CheckinRooms`, etc.
- **Functions**: Functions like `setAdminWallet`, `setSignatureVerifier`, `setBukTreasury`, etc.

## License

This project is licensed under the MIT License.
