// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";

/// @title FHE Key Management Contract
/// @notice Manages FHE keys for anonymous voting system
/// @dev Handles key rotation and validation for encrypted votes
contract FHEKeyManager {
    struct KeyRotation {
        uint256 rotationTime;
        bytes32 publicKey;
        bytes32 privateKeyHash;
        bool isActive;
        uint256 validityPeriod; // How long this key is valid
        address rotatedBy;      // Who performed the rotation
    }

    struct KeyValidation {
        bool isValid;
        uint256 lastValidationTime;
        bytes32 validationHash;
    }

    mapping(uint256 => KeyRotation) public keyRotations;
    mapping(uint256 => KeyValidation) public keyValidations;
    uint256 public currentKeyId;
    address public admin;
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 30 days;

    event KeyRotated(uint256 indexed keyId, bytes32 publicKey, address indexed rotatedBy);
    event KeyDeactivated(uint256 indexed keyId, address indexed deactivatedBy);
    event KeyValidated(uint256 indexed keyId, bool isValid);
    event EmergencyKeyRotation(uint256 indexed keyId, bytes32 emergencyKey);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier validKeyId(uint256 _keyId) {
        require(_keyId > 0 && _keyId <= currentKeyId, "Invalid key ID");
        _;
    }

    constructor() {
        admin = msg.sender;
        currentKeyId = 0;
        // Initialize with genesis key
        _rotateKey(keccak256(abi.encodePacked("genesis-key", block.timestamp)), keccak256(abi.encodePacked("genesis-hash")));
    }

    /// @notice Rotate to a new FHE key pair
    /// @param _newPublicKey The new public key for encryption
    /// @param _privateKeyHash Hash of the new private key (stored off-chain)
    function rotateKey(bytes32 _newPublicKey, bytes32 _privateKeyHash) external onlyAdmin {
        _rotateKey(_newPublicKey, _privateKeyHash);
    }

    /// @notice Internal key rotation logic
    function _rotateKey(bytes32 _publicKey, bytes32 _privateKeyHash) internal {
        require(_publicKey != bytes32(0), "Invalid public key");
        require(_privateKeyHash != bytes32(0), "Invalid private key hash");

        currentKeyId++;

        keyRotations[currentKeyId] = KeyRotation({
            rotationTime: block.timestamp,
            publicKey: _publicKey,
            privateKeyHash: _privateKeyHash,
            isActive: true,
            validityPeriod: DEFAULT_VALIDITY_PERIOD,
            rotatedBy: msg.sender
        });

        // Initialize validation record
        keyValidations[currentKeyId] = KeyValidation({
            isValid: true,
            lastValidationTime: block.timestamp,
            validationHash: keccak256(abi.encodePacked(_publicKey, _privateKeyHash, block.timestamp))
        });

        emit KeyRotated(currentKeyId, _publicKey, msg.sender);
    }

    /// @notice Validate an encrypted vote against current key
    /// @param _encryptedVote The encrypted vote to validate
    /// @return bool indicating if the vote is valid for current key
    function validateVote(euint32 _encryptedVote) external view returns (bool) {
        if (!keyRotations[currentKeyId].isActive) return false;
        if (block.timestamp > keyRotations[currentKeyId].rotationTime + keyRotations[currentKeyId].validityPeriod) {
            return false; // Key expired
        }
        return keyValidations[currentKeyId].isValid;
    }

    /// @notice Get current active key info
    function getCurrentKey() external view returns (
        bytes32 publicKey,
        uint256 keyId,
        uint256 validityPeriod,
        bool isActive
    ) {
        KeyRotation memory key = keyRotations[currentKeyId];
        return (key.publicKey, currentKeyId, key.validityPeriod, key.isActive);
    }

    /// @notice Get key rotation history
    /// @param _keyId The key ID to query
    function getKeyInfo(uint256 _keyId) external view validKeyId(_keyId) returns (
        uint256 rotationTime,
        bytes32 publicKey,
        bool isActive,
        uint256 validityPeriod,
        address rotatedBy
    ) {
        KeyRotation memory key = keyRotations[_keyId];
        return (key.rotationTime, key.publicKey, key.isActive, key.validityPeriod, key.rotatedBy);
    }

    /// @notice Deactivate an old key (admin only)
    /// @param _keyId The key ID to deactivate
    function deactivateKey(uint256 _keyId) external onlyAdmin validKeyId(_keyId) {
        require(keyRotations[_keyId].isActive, "Key already deactivated");
        require(_keyId != currentKeyId, "Cannot deactivate current active key");

        keyRotations[_keyId].isActive = false;
        keyValidations[_keyId].isValid = false;

        emit KeyDeactivated(_keyId, msg.sender);
    }

    /// @notice Validate key compatibility with encrypted data
    /// @param _keyId The key ID
    /// @param _dataHash Hash of encrypted data
    function validateKeyCompatibility(uint256 _keyId, bytes32 _dataHash) external view validKeyId(_keyId) returns (bool) {
        require(keyRotations[_keyId].isActive, "Key not active");

        // Check if key has not expired
        uint256 expiryTime = keyRotations[_keyId].rotationTime + keyRotations[_keyId].validityPeriod;
        if (block.timestamp > expiryTime) return false;

        // Verify validation record
        return keyValidations[_keyId].isValid;
    }

    /// @notice Get total number of key rotations
    function getTotalKeyRotations() external view returns (uint256) {
        return currentKeyId;
    }

    /// @notice Check if a key is valid for voting
    /// @param _keyId The key ID to check
    function isKeyValid(uint256 _keyId) external view returns (bool) {
        if (_keyId == 0 || _keyId > currentKeyId) return false;

        KeyRotation memory key = keyRotations[_keyId];
        if (!key.isActive) return false;

        uint256 expiryTime = key.rotationTime + key.validityPeriod;
        if (block.timestamp > expiryTime) return false;

        return keyValidations[_keyId].isValid;
    }

    /// @notice Emergency key rotation (admin only)
    /// @param _emergencyKey New emergency key
    function emergencyKeyRotation(bytes32 _emergencyKey) external onlyAdmin {
        uint256 emergencyId = currentKeyId + 1;
        currentKeyId = emergencyId;

        keyRotations[emergencyId] = KeyRotation({
            rotationTime: block.timestamp,
            publicKey: _emergencyKey,
            privateKeyHash: keccak256(abi.encodePacked("emergency-", block.timestamp, msg.sender)),
            isActive: true,
            validityPeriod: DEFAULT_VALIDITY_PERIOD,
            rotatedBy: msg.sender
        });

        keyValidations[emergencyId] = KeyValidation({
            isValid: true,
            lastValidationTime: block.timestamp,
            validationHash: keccak256(abi.encodePacked(_emergencyKey, block.timestamp))
        });

        emit EmergencyKeyRotation(emergencyId, _emergencyKey);
    }

    /// @notice Extend key validity period (admin only)
    /// @param _keyId The key ID to extend
    /// @param _additionalPeriod Additional validity period in seconds
    function extendKeyValidity(uint256 _keyId, uint256 _additionalPeriod) external onlyAdmin validKeyId(_keyId) {
        require(keyRotations[_keyId].isActive, "Key not active");
        require(_additionalPeriod > 0 && _additionalPeriod <= 365 days, "Invalid extension period");

        keyRotations[_keyId].validityPeriod += _additionalPeriod;
    }

    /// @notice Transfer admin rights
    /// @param _newAdmin New admin address
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid admin address");
        admin = _newAdmin;
    }
}
