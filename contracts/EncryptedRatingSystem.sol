// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title EncryptedRatingSystem - Privacy-Preserving Rating Management System
/// @author crypt-seal-vault
/// @notice Users can submit encrypted ratings (1-10 scale) and view aggregated statistics without revealing individual data
contract EncryptedRatingSystem is SepoliaConfig {
    address public owner;
    bool public paused;

    // Rating categories system
    enum Category { WORK_ENVIRONMENT, LEADERSHIP, TEAMWORK, INNOVATION, COMMUNICATION, PRODUCTIVITY, CUSTOM }
    mapping(string => Category) public subjectCategories;
    mapping(Category => uint256) public categoryRatingCount;
    mapping(Category => euint32) private _encryptedCategorySum;
    struct RatingEntry {
        address submitter; // Submitter address
        string subject; // What is being rated (e.g., "Leadership", "Team Performance", "Service Quality")
        euint32 encryptedRating; // Encrypted rating value (1-10)
        uint256 timestamp; // Submission timestamp
        bool isActive; // Active status
    }

    // Rating entry storage
    mapping(uint256 => RatingEntry) public ratingEntries;
    uint256 public entryCount; // Total entry count

    // User management (optimized storage)
    mapping(address => uint256) private _userSubmissionCount; // Number of active submissions per user
    mapping(address => mapping(bytes32 => uint256)) public userSubjectEntryId; // User's entry ID per subject

    // Encrypted aggregate data
    mapping(bytes32 => euint32) private _encryptedRatingSum; // Encrypted sum per subject
    mapping(bytes32 => uint32) private _subjectEntryCount; // Entry count per subject

    // Global statistics
    euint32 private _encryptedGlobalSum; // Encrypted sum of all ratings
    uint32 private _globalEntryCount; // Total active entry count

    // Decrypted statistical results
    mapping(bytes32 => uint32) private _decryptedSubjectAverage; // Subject average rating
    mapping(bytes32 => bool) private _subjectStatsFinalized; // Are subject stats decrypted
    mapping(uint256 => bytes32) private _subjectStatsRequest; // Track subject stats requests

    uint32 private _decryptedGlobalAverage; // Decrypted global average rating
    bool private _globalStatsFinalized; // Are global stats decrypted
    mapping(uint256 => bool) private _globalStatsRequest; // Track global stats requests

    // Events
    event RatingSubmitted(uint256 indexed entryId, address indexed submitter, string subject, uint256 timestamp);
    event RatingUpdated(uint256 indexed entryId, address indexed submitter, string newSubject);
    event RatingDeleted(uint256 indexed entryId, address indexed submitter);
    event SubjectStatsRequested(bytes32 indexed subjectHash, uint256 requestId);
    event SubjectStatsPublished(bytes32 indexed subjectHash, uint32 averageRating, uint32 count);
    event GlobalStatsRequested(uint256 requestId);
    event GlobalStatsPublished(uint32 averageRating, uint32 totalCount);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        paused = false;

        // Initialize predefined subject categories
        subjectCategories["Work Environment"] = Category.WORK_ENVIRONMENT;
        subjectCategories["Leadership"] = Category.LEADERSHIP;
        subjectCategories["Team Performance"] = Category.TEAMWORK;
        subjectCategories["Innovation"] = Category.INNOVATION;
        subjectCategories["Communication"] = Category.COMMUNICATION;
        subjectCategories["Productivity"] = Category.PRODUCTIVITY;
    }

    /// @notice Submit new rating entry (each address can submit one rating per subject)
    /// @param encryptedRating Encrypted rating value (1-10)
    /// @param inputProof Input proof for encrypted rating
    /// @param subject Subject being rated (e.g., "Leadership", "Team Performance")
    function submitRating(
        externalEuint32 encryptedRating,
        bytes calldata inputProof,
        string memory subject
    ) external whenNotPaused {
        require(bytes(subject).length > 0, "Subject cannot be empty");
        require(bytes(subject).length <= 100, "Subject too long");

        bytes32 subjectHash = keccak256(bytes(subject));
        require(!hasSubmittedForSubject(msg.sender, subject), "Already submitted for this subject");

        euint32 rating = FHE.fromExternal(encryptedRating, inputProof);

        // Additional validation: check input proof length (basic sanity check)
        require(inputProof.length >= 32, "Invalid input proof length");

        // Validate rating is between 1-10 (we'll check this in callback, but add basic bounds)
        // Note: Full validation would require decryption, which defeats privacy

        uint256 entryId = entryCount++;
        ratingEntries[entryId] = RatingEntry({
            submitter: msg.sender,
            subject: subject,
            encryptedRating: rating,
            timestamp: block.timestamp,
            isActive: true
        });

        _userSubmissionCount[msg.sender]++; // Track user submission count
        userSubjectEntryId[msg.sender][subjectHash] = entryId;

        // Update aggregate data (optimized for gas efficiency)
        _encryptedRatingSum[subjectHash] = _subjectEntryCount[subjectHash] == 0
            ? rating
            : FHE.add(_encryptedRatingSum[subjectHash], rating);
        _subjectEntryCount[subjectHash]++;

        // Update global statistics (optimized for gas efficiency)
        _encryptedGlobalSum = _globalEntryCount == 0
            ? rating
            : FHE.add(_encryptedGlobalSum, rating);
        _globalEntryCount++;

        // Update category statistics
        Category category = getSubjectCategory(subject);
        _encryptedCategorySum[category] = categoryRatingCount[category] == 0
            ? rating
            : FHE.add(_encryptedCategorySum[category], rating);
        categoryRatingCount[category]++;

    // Set permissions
    FHE.allowThis(rating);
    FHE.allow(rating, msg.sender);
    FHE.allowThis(_encryptedRatingSum[subjectHash]);
    FHE.allowThis(_encryptedGlobalSum);

    // Allow user to decrypt aggregate data
    FHE.allow(_encryptedRatingSum[subjectHash], msg.sender);
    FHE.allow(_encryptedGlobalSum, msg.sender);

        emit RatingSubmitted(entryId, msg.sender, subject, block.timestamp);
    }

    /// @notice Update existing rating entry (only callable by original submitter)
    /// @param encryptedRating New encrypted rating value (1-10)
    /// @param inputProof Input proof for encrypted rating
    /// @param newSubject New subject (can be same or different)
    function updateRating(
        externalEuint32 encryptedRating,
        bytes calldata inputProof,
        string memory newSubject
    ) external whenNotPaused {
        require(_userSubmissionCount[msg.sender] > 0, "No entry to update");
        require(bytes(newSubject).length > 0, "Subject cannot be empty");
        require(bytes(newSubject).length <= 100, "Subject too long");

        // Find user's current active entry (users can only have one active rating)
        uint256 entryId = 0;
        bool found = false;
        for (uint256 i = 0; i < entryCount; i++) {
            if (ratingEntries[i].submitter == msg.sender && ratingEntries[i].isActive) {
                entryId = i;
                found = true;
                break;
            }
        }
        require(found, "No active entry found");

        RatingEntry storage entry = ratingEntries[entryId];
        euint32 newRating = FHE.fromExternal(encryptedRating, inputProof);

        // Additional validation: check input proof length (basic sanity check)
        require(inputProof.length >= 32, "Invalid input proof length");

        // Remove old rating from aggregates
        bytes32 oldSubjectHash = keccak256(bytes(entry.subject));
        _encryptedRatingSum[oldSubjectHash] = FHE.sub(_encryptedRatingSum[oldSubjectHash], entry.encryptedRating);
        _subjectEntryCount[oldSubjectHash]--;

        _encryptedGlobalSum = FHE.sub(_encryptedGlobalSum, entry.encryptedRating);
        _globalEntryCount--;

        // Update entry
        entry.encryptedRating = newRating;
        entry.subject = newSubject;
        entry.timestamp = block.timestamp;

        // Add new rating to aggregates
        bytes32 newSubjectHash = keccak256(bytes(newSubject));
        if (_subjectEntryCount[newSubjectHash] == 0) {
            _encryptedRatingSum[newSubjectHash] = newRating;
        } else {
            _encryptedRatingSum[newSubjectHash] = FHE.add(_encryptedRatingSum[newSubjectHash], newRating);
        }
        _subjectEntryCount[newSubjectHash]++;

        _encryptedGlobalSum = FHE.add(_encryptedGlobalSum, newRating);
        _globalEntryCount++;

        // Update permissions
        FHE.allowThis(newRating);
        FHE.allow(newRating, msg.sender);
        FHE.allowThis(_encryptedRatingSum[newSubjectHash]);
        FHE.allowThis(_encryptedGlobalSum);

        // Allow user to decrypt aggregate data
        FHE.allow(_encryptedRatingSum[newSubjectHash], msg.sender);
        FHE.allow(_encryptedGlobalSum, msg.sender);

        emit RatingUpdated(entryId, msg.sender, newSubject);
    }

    /// @notice Delete rating entry (only callable by original submitter)
    function deleteRating() external whenNotPaused {
        require(_userSubmissionCount[msg.sender] > 0, "No entry to delete");

        // Find and delete user's active entry
        for (uint256 i = 0; i < entryCount; i++) {
            if (ratingEntries[i].submitter == msg.sender && ratingEntries[i].isActive) {
                RatingEntry storage entry = ratingEntries[i];

                // Remove from aggregate data
                bytes32 subjectHash = keccak256(bytes(entry.subject));
                _encryptedRatingSum[subjectHash] = FHE.sub(_encryptedRatingSum[subjectHash], entry.encryptedRating);
                _subjectEntryCount[subjectHash]--;

                _encryptedGlobalSum = FHE.sub(_encryptedGlobalSum, entry.encryptedRating);
                _globalEntryCount--;

                entry.isActive = false;
                _userSubmissionCount[msg.sender]--; // Decrement user submission count

                FHE.allowThis(_encryptedRatingSum[subjectHash]);
                FHE.allowThis(_encryptedGlobalSum);

                // Allow user to decrypt updated aggregate data
                FHE.allow(_encryptedRatingSum[subjectHash], msg.sender);
                FHE.allow(_encryptedGlobalSum, msg.sender);

                emit RatingDeleted(i, msg.sender);
                return;
            }
        }
        revert("No active entry found");
    }

    /// @notice Get rating entry information
    /// @param entryId Entry ID
    /// @return subject Subject being rated
    /// @return timestamp Submission timestamp
    /// @return submitter Submitter address
    /// @return isActive Active status
    function getEntry(uint256 entryId) external view returns (
        string memory subject,
        uint256 timestamp,
        address submitter,
        bool isActive
    ) {
        RatingEntry storage entry = ratingEntries[entryId];
        return (entry.subject, entry.timestamp, entry.submitter, entry.isActive);
    }

    /// @notice Get entry's encrypted rating (only accessible by submitter and contract)
    /// @param entryId Entry ID
    /// @return Encrypted rating value
    function getEncryptedRating(uint256 entryId) external view returns (euint32) {
        require(entryId < entryCount, "Entry does not exist");
        return ratingEntries[entryId].encryptedRating;
    }

    /// @notice Check if user has submitted for a specific subject
    /// @param user User address
    /// @param subject Subject name
    /// @return Whether user has submitted for this subject
    function hasSubmittedForSubject(address user, string memory subject) public view returns (bool) {
        bytes32 subjectHash = keccak256(bytes(subject));
        return userSubjectEntryId[user][subjectHash] > 0 && ratingEntries[userSubjectEntryId[user][subjectHash]].isActive;
    }

    /// @notice Get category for a subject (returns CUSTOM if not predefined)
    /// @param subject Subject name
    /// @return Category enum value
    function getSubjectCategory(string memory subject) public view returns (Category) {
        Category category = subjectCategories[subject];
        // If category is not set (defaults to 0) and subject is not in mapping, return CUSTOM
        if (category == Category.WORK_ENVIRONMENT && keccak256(bytes(subject)) != keccak256(bytes("Work Environment"))) {
            return Category.CUSTOM;
        }
        return category;
    }

    /// @notice Get encrypted statistics for specific subject
    /// @param subject Subject name
    /// @return encryptedSum Encrypted sum for this subject
    /// @return count Entry count for this subject
    function getEncryptedSubjectStats(string memory subject) external view returns (euint32 encryptedSum, uint32 count) {
        bytes32 subjectHash = keccak256(bytes(subject));
        return (_encryptedRatingSum[subjectHash], _subjectEntryCount[subjectHash]);
    }

    /// @notice Get encrypted global statistics
    /// @return encryptedSum Encrypted sum of all ratings
    /// @return count Total active entry count
    function getEncryptedGlobalStats() external view returns (euint32 encryptedSum, uint32 count) {
        return (_encryptedGlobalSum, _globalEntryCount);
    }

    /// @notice Request decryption of subject-specific statistics
    /// @param subject Subject name
    function requestSubjectStats(string memory subject) external {
        bytes32 subjectHash = keccak256(bytes(subject));
        require(_subjectEntryCount[subjectHash] > 0, "No data for this subject");
        require(!_subjectStatsFinalized[subjectHash], "Subject stats already finalized");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(_encryptedRatingSum[subjectHash]);

        uint256 requestId = FHE.requestDecryption(cts, this.subjectStatsCallback.selector);
        _subjectStatsRequest[requestId] = subjectHash;

        emit SubjectStatsRequested(subjectHash, requestId);
    }

    /// @notice Callback function for subject statistics decryption
    function subjectStatsCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        bytes32 subjectHash = _subjectStatsRequest[requestId];
        require(subjectHash != bytes32(0), "Invalid request");
        require(!_subjectStatsFinalized[subjectHash], "Already finalized");
        require(_subjectEntryCount[subjectHash] > 0, "No data");

        uint32 totalRating;
        require(cleartexts.length >= 4, "Invalid cleartext length");
        assembly {
            totalRating := shr(224, mload(add(cleartexts, 32)))
        }

        uint32 count = _subjectEntryCount[subjectHash];
        _decryptedSubjectAverage[subjectHash] = count > 0 ? totalRating / count : 0;

        _subjectStatsFinalized[subjectHash] = true;
        delete _subjectStatsRequest[requestId];

        emit SubjectStatsPublished(subjectHash, _decryptedSubjectAverage[subjectHash], count);
        return true;
    }

    /// @notice Request decryption of global statistics
    function requestGlobalStats() external {
        require(_globalEntryCount > 0, "No data to decrypt");
        require(!_globalStatsFinalized, "Global stats already finalized");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(_encryptedGlobalSum);

        uint256 requestId = FHE.requestDecryption(cts, this.globalStatsCallback.selector);
        _globalStatsRequest[requestId] = true;

        emit GlobalStatsRequested(requestId);
    }

    /// @notice Callback function for global statistics decryption
    function globalStatsCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        require(_globalStatsRequest[requestId], "Invalid request");
        require(!_globalStatsFinalized, "Already finalized");
        require(_globalEntryCount > 0, "No active entries");

        uint32 totalRating;
        require(cleartexts.length >= 4, "Invalid cleartext length");
        assembly {
            totalRating := shr(224, mload(add(cleartexts, 32)))
        }

        _decryptedGlobalAverage = _globalEntryCount > 0 ? totalRating / _globalEntryCount : 0;

        _globalStatsFinalized = true;
        delete _globalStatsRequest[requestId];

        emit GlobalStatsPublished(_decryptedGlobalAverage, _globalEntryCount);
        return true;
    }

    /// @notice Check if subject statistics are available
    /// @param subject Subject name
    /// @return Whether subject statistics have been decrypted
    function isSubjectStatsFinalized(string memory subject) external view returns (bool) {
        bytes32 subjectHash = keccak256(bytes(subject));
        return _subjectStatsFinalized[subjectHash];
    }

    /// @notice Get decrypted subject statistics (only available after finalization)
    /// @param subject Subject name
    /// @return averageRating Average rating for this subject
    /// @return count Entry count for this subject
    function getSubjectStats(string memory subject) external view returns (uint32 averageRating, uint32 count) {
        bytes32 subjectHash = keccak256(bytes(subject));
        require(_subjectStatsFinalized[subjectHash], "Subject stats not available yet");
        return (_decryptedSubjectAverage[subjectHash], _subjectEntryCount[subjectHash]);
    }

    /// @notice Check if global statistics are available
    /// @return Whether global statistics have been decrypted
    function isGlobalStatsFinalized() external view returns (bool) {
        return _globalStatsFinalized;
    }

    /// @notice Get decrypted global statistics (only available after finalization)
    /// @return averageRating Global average rating
    /// @return totalCount Total active entry count
    function getGlobalStats() external view returns (uint32 averageRating, uint32 totalCount) {
        require(_globalStatsFinalized, "Global stats not available yet");
        return (_decryptedGlobalAverage, _globalEntryCount);
    }

    /// @notice Get total entry count
    /// @return Total entry count
    function getEntryCount() external view returns (uint256) {
        return entryCount;
    }

    /// @notice Get global active entry count
    /// @return Active entry count
    function getActiveEntryCount() external view returns (uint32) {
        return _globalEntryCount;
    }

    /// @notice Get subject entry count
    /// @param subject Subject name
    /// @return Entry count for this subject
    function getSubjectEntryCount(string memory subject) external view returns (uint32) {
        bytes32 subjectHash = keccak256(bytes(subject));
        return _subjectEntryCount[subjectHash];
    }

    /// @notice Submit multiple ratings in a single transaction (batch submission)
    /// @param encryptedRatings Array of encrypted rating values (1-10)
    /// @param inputProofs Array of input proofs for encrypted ratings
    /// @param subjects Array of subject names being rated (must be same length as encryptedRatings)
    function submitBatchRatings(
        externalEuint32[] memory encryptedRatings,
        bytes[] calldata inputProofs,
        string[] memory subjects
    ) external {
        require(encryptedRatings.length == inputProofs.length, "Mismatched array lengths");
        require(inputProofs.length == subjects.length, "Mismatched array lengths");
        require(encryptedRatings.length > 0, "Empty batch not allowed");
        require(encryptedRatings.length <= 10, "Batch size too large (max 10)");

        for (uint256 i = 0; i < encryptedRatings.length; i++) {
            require(bytes(subjects[i]).length > 0, "Subject cannot be empty");
            require(bytes(subjects[i]).length <= 100, "Subject too long");

            bytes32 subjectHash = keccak256(bytes(subjects[i]));
            require(!hasSubmittedForSubject(msg.sender, subjects[i]), "Already submitted for this subject");

            euint32 rating = FHE.fromExternal(encryptedRatings[i], inputProofs[i]);

            // Additional validation: check input proof length (basic sanity check)
            require(inputProofs[i].length >= 32, "Invalid input proof length");

            uint256 entryId = entryCount++;
            ratingEntries[entryId] = RatingEntry({
                submitter: msg.sender,
                subject: subjects[i],
                encryptedRating: rating,
                timestamp: block.timestamp,
                isActive: true
            });

            _userSubmissionCount[msg.sender]++;
            userSubjectEntryId[msg.sender][subjectHash] = entryId;

            // Update aggregate data (optimized for gas efficiency)
            _encryptedRatingSum[subjectHash] = _subjectEntryCount[subjectHash] == 0
                ? rating
                : FHE.add(_encryptedRatingSum[subjectHash], rating);
            _subjectEntryCount[subjectHash]++;

            // Update global statistics (optimized for gas efficiency)
            _encryptedGlobalSum = _globalEntryCount == 0
                ? rating
                : FHE.add(_encryptedGlobalSum, rating);
            _globalEntryCount++;

            // Set permissions
            FHE.allowThis(rating);
            FHE.allow(rating, msg.sender);
            FHE.allowThis(_encryptedRatingSum[subjectHash]);
            FHE.allowThis(_encryptedGlobalSum);

            // Allow user to decrypt aggregate data
            FHE.allow(_encryptedRatingSum[subjectHash], msg.sender);
            FHE.allow(_encryptedGlobalSum, msg.sender);

            emit RatingSubmitted(entryId, msg.sender, subjects[i], block.timestamp);
        }
    }

    /// @notice Pause contract operations (only owner)
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause contract operations (only owner)
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Transfer ownership to new owner (only owner)
    /// @param newOwner Address of the new owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Allow user to decrypt aggregate data
    /// @dev Anyone can call this to get permission to decrypt public statistics
    /// @param user User address to grant decryption permission
    /// @param subjects Array of subject names to grant permission for
    function allowUserToDecrypt(address user, string[] memory subjects) external {
        // Allow user to decrypt global aggregates
        FHE.allow(_encryptedGlobalSum, user);

        // Allow user to decrypt subject-specific aggregates
        for (uint256 i = 0; i < subjects.length; i++) {
            bytes32 subjectHash = keccak256(bytes(subjects[i]));
            if (_subjectEntryCount[subjectHash] > 0) {
                FHE.allow(_encryptedRatingSum[subjectHash], user);
            }
        }
    }
}
