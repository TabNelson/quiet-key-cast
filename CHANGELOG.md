# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Network status component for better UX
- Contract verification script for localhost deployment
- Comprehensive .gitignore file
- Contributing guidelines documentation
- Enhanced UI development scripts

### Fixed
- Error handling for Sepolia RPC connection failures
- Account balance display formatting
- Election creation validation for zero candidates
- Contract type definitions for getElectionCount
- Frontend loading states and error boundaries
- Date formatting in election cards
- Contract instance caching race conditions

### Changed
- Improved time calculation in election cards
- Enhanced TypeScript configuration
- Better error messages throughout the application

### Security
- Proper contract instance synchronization
- Enhanced error handling for user inputs

## [0.1.0] - 2025-11-10

### Added
- Initial FHE anonymous election system implementation
- Hardhat-based smart contract development setup
- React frontend with TypeScript and Vite
- RainbowKit wallet integration
- FHE encryption/decryption with Zama SDK
- Responsive UI with Tailwind CSS and shadcn/ui
- Local and Sepolia testnet deployment support
- Comprehensive test suite

### Technical Details
- Built with Solidity 0.8.24 and FHEVM by Zama
- Uses Fully Homomorphic Encryption for vote privacy
- Implements anonymous voting with encrypted aggregation
- Supports 2-10 candidates per election
- Admin-only decryption of final results
