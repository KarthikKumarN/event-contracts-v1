# SignatureVerifier Contract

The `SignatureVerifier` contract is a Solidity smart contract designed to verify the signature of hashed messages using the ECDSA cryptographic algorithm. It provides a utility to ensure the authenticity of messages within the Buk Protocol.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Functions](#functions)
- [Interface: ISignatureVerifier](#interface-isignatureverifier)
- [License](#license)

## Overview

The contract is designed with the following key component:

- **Signature Verification**: Uses the ECDSA library from OpenZeppelin to verify the signature of hashed messages.

## Features

- **ECDSA Verification**: Provides a function to verify the signature of a hashed message using the ECDSA cryptographic algorithm.

## Functions

### Public and External Functions:

- **verify**: Verifies the signature of a hashed message and returns the address of the signer.

## Interface: ISignatureVerifier

The contract also defines an interface `ISignatureVerifier` which outlines the expected structure and functions for the SignatureVerifier contract. The interface includes:

- **Function verify**: A function that verifies the signature of a hashed message using ECDSA and returns the address of the signer.

## License

This project is licensed under the MIT License.
