// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Anonymous Election Contract using FHE
/// @notice A simple election system where students vote anonymously using encrypted votes
/// @dev Votes are encrypted on-chain and only the admin can decrypt the final sum
contract AnonymousElection is SepoliaConfig {
    struct Election {
        string title;
        string description;
        uint256 candidateCount;
        string[] candidateNames;
        bool isActive;
        bool isFinalized;
        euint32 encryptedVoteSum;
        address admin;
        uint256 totalVoters;
        uint32 decryptedSum;
    }

    Election[] public elections;
    
    // Mapping: electionId => voter => hasVoted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Mapping: requestId => electionId (for decryption callbacks)
    mapping(uint256 => uint256) private _requestToElection;
    
    // Events
    event ElectionCreated(uint256 indexed electionId, string title, address indexed admin);
    event VoteCasted(uint256 indexed electionId, address indexed voter);
    event ElectionEnded(uint256 indexed electionId);
    event FinalizeRequested(uint256 indexed electionId, uint256 requestId);
    event ElectionFinalized(uint256 indexed electionId, uint256 decryptedSum);

    modifier onlyAdmin(uint256 _electionId) {
        require(elections[_electionId].admin == msg.sender, "Only admin can perform this action");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId < elections.length, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(!elections[_electionId].isFinalized, "Election is finalized");
        _;
    }

    /// @notice Create a new election
    /// @param _title The title of the election
    /// @param _description The description of the election
    /// @param _candidateNames Array of candidate names
    function createElection(
        string memory _title,
        string memory _description,
        string[] memory _candidateNames
    ) external returns (uint256) {
        require(_candidateNames.length >= 2, "Must have at least 2 candidates");
        require(_candidateNames.length <= 10, "Cannot have more than 10 candidates");

        uint256 electionId = elections.length;
        
        Election storage newElection = elections.push();
        newElection.title = _title;
        newElection.description = _description;
        newElection.candidateCount = _candidateNames.length;
        newElection.candidateNames = _candidateNames;
        newElection.isActive = true;
        newElection.isFinalized = false;
        newElection.admin = msg.sender;
        newElection.totalVoters = 0;

        emit ElectionCreated(electionId, _title, msg.sender);
        
        return electionId;
    }

    /// @notice Cast an encrypted vote
    /// @param _electionId The ID of the election
    /// @param _encryptedVote The encrypted vote (candidate number: 1, 2, 3, etc.)
    /// @param inputProof The proof for the encrypted input
    /// @dev Students encrypt their candidate choice (1 for candidate A, 2 for candidate B, etc.)
    function vote(
        uint256 _electionId,
        externalEuint32 _encryptedVote,
        bytes calldata inputProof
    ) external electionExists(_electionId) electionActive(_electionId) {
        require(!hasVoted[_electionId][msg.sender], "Already voted in this election");

        Election storage election = elections[_electionId];
        
        // Convert external encrypted input to internal euint32
        euint32 encryptedVote = FHE.fromExternal(_encryptedVote, inputProof);
        
        // Add the encrypted vote to the sum
        if (election.totalVoters == 0) {
            election.encryptedVoteSum = encryptedVote;
        } else {
            election.encryptedVoteSum = FHE.add(election.encryptedVoteSum, encryptedVote);
        }
        
        // Grant permissions
        FHE.allowThis(election.encryptedVoteSum);
        FHE.allow(election.encryptedVoteSum, election.admin);
        
        // Mark as voted
        hasVoted[_electionId][msg.sender] = true;
        election.totalVoters++;
        
        emit VoteCasted(_electionId, msg.sender);
    }

    /// @notice Get the encrypted vote sum (only admin can decrypt)
    /// @param _electionId The ID of the election
    /// @return The encrypted sum of all votes
    function getEncryptedVoteSum(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (euint32) {
        return elections[_electionId].encryptedVoteSum;
    }

    /// @notice End an election (only admin)
    /// @param _electionId The ID of the election
    function endElection(uint256 _electionId) external electionExists(_electionId) onlyAdmin(_electionId) {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election not active");
        
        election.isActive = false;
        emit ElectionEnded(_electionId);
    }

    /// @notice Request decryption and publish clear results (anyone can trigger after election ended)
    /// @param _electionId The ID of the election
    function finalizeElection(uint256 _electionId) external electionExists(_electionId) {
        Election storage election = elections[_electionId];
        require(!election.isActive, "Election still active");
        require(!election.isFinalized, "Election already finalized");

        // Request decryption for the encrypted vote sum
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(election.encryptedVoteSum);

        uint256 requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        _requestToElection[requestId] = _electionId;
        emit FinalizeRequested(_electionId, requestId);
    }

    /// @notice Manually finalize for development/localhost testing
    /// @param _electionId The ID of the election
    /// @param _decryptedSum The decrypted sum to set
    function manualFinalize(uint256 _electionId, uint32 _decryptedSum) external onlyAdmin(_electionId) {
        Election storage election = elections[_electionId];
        require(!election.isFinalized, "Election already finalized");
        
        election.decryptedSum = _decryptedSum;
        election.isFinalized = true;
        emit ElectionFinalized(_electionId, _decryptedSum);
    }

    /// @notice Callback called by the FHE decryption oracle
    /// @dev Expects the decrypted sum in bytes
    function decryptionCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        uint256 electionId = _requestToElection[requestId];
        Election storage election = elections[electionId];
        require(!election.isFinalized, "Election already finalized");
        require(!election.isActive, "Election still active");

        // Parse the decrypted sum (uint32)
        require(cleartexts.length >= 4, "Invalid cleartexts length");
        uint32 decryptedSum;
        assembly {
            // Read 4 bytes starting at offset 32 (skip bytes length slot)
            decryptedSum := shr(224, mload(add(cleartexts, 32)))
        }

        // Store the decrypted sum
        election.decryptedSum = decryptedSum;
        election.isFinalized = true;

        emit ElectionFinalized(electionId, decryptedSum);
        return true;
    }

    /// @notice Get the decrypted vote sum (only available after finalize)
    /// @param _electionId The ID of the election
    function getDecryptedVoteSum(uint256 _electionId) external view electionExists(_electionId) returns (uint32) {
        require(elections[_electionId].isFinalized, "Election not finalized");
        return elections[_electionId].decryptedSum;
    }

    /// @notice Get election details
    /// @param _electionId The ID of the election
    function getElection(
        uint256 _electionId
    ) external view electionExists(_electionId) returns (
        string memory title,
        string memory description,
        uint256 candidateCount,
        string[] memory candidateNames,
        bool isActive,
        bool isFinalized,
        address admin,
        uint256 totalVoters
    ) {
        Election storage election = elections[_electionId];
        return (
            election.title,
            election.description,
            election.candidateCount,
            election.candidateNames,
            election.isActive,
            election.isFinalized,
            election.admin,
            election.totalVoters
        );
    }

    /// @notice Get total number of elections
    function getElectionCount() external view returns (uint256) {
        return elections.length;
    }

    /// @notice Check if a user has voted in an election
    function hasUserVoted(uint256 _electionId, address _voter) external view returns (bool) {
        return hasVoted[_electionId][_voter];
    }
}

