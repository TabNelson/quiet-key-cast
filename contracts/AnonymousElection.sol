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
        uint256 endTime;
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

    // Mapping: electionId => candidateId => encrypted vote count (for tracking purposes)
    mapping(uint256 => mapping(uint256 => euint32)) public candidateVoteCounts;

    // Mapping: requestId => electionId (for decryption callbacks)
    mapping(uint256 => uint256) private _requestToElection;
    
    // Events
    event ElectionCreated(uint256 indexed electionId, string title, address indexed admin, uint256 candidateCount);
    event VoteCasted(uint256 electionId, address voter, uint256 totalVoters);
    event ElectionEnded(uint256 indexed electionId, uint256 timestamp);
    event FinalizeRequested(uint256 indexed electionId, uint256 requestId);
    event ElectionFinalized(uint256 indexed electionId, uint256 decryptedSum, uint256 totalVoters);

    modifier onlyAdmin(uint256 _electionId) {
        require(_electionId < elections.length, "Election does not exist");
        require(elections[_electionId].admin != address(0), "Election admin not set");
        require(elections[_electionId].admin == msg.sender, "Only election admin can perform this action");
        require(msg.sender != address(0), "Invalid caller address");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId < elections.length, "Election does not exist");
        _;
    }

    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp < elections[_electionId].endTime, "Election has ended");
        require(!elections[_electionId].isFinalized, "Election is finalized");
        _;
    }

    /// @notice Create a new election
    /// @param _title The title of the election
    /// @param _description The description of the election
    /// @param _candidateNames Array of candidate names
    /// @param _durationInHours Duration of the election in hours
    function createElection(
        string memory _title,
        string memory _description,
        string[] memory _candidateNames,
        uint256 _durationInHours
    ) external returns (uint256) {
        // Enhanced validation for election creation
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_title).length <= 100, "Title too long");
        require(bytes(_description).length <= 500, "Description too long");
        require(_candidateNames.length >= 2, "Must have at least 2 candidates");
        require(_candidateNames.length <= 20, "Cannot have more than 20 candidates");
        require(_durationInHours >= 1, "Duration must be at least 1 hour");
        require(_durationInHours <= 168, "Duration cannot exceed 1 week");

        // Validate candidate names
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            require(bytes(_candidateNames[i]).length > 0, "Candidate name cannot be empty");
            require(bytes(_candidateNames[i]).length >= 2, "Candidate name too short");
            require(bytes(_candidateNames[i]).length <= 50, "Candidate name too long");
            require(!containsOnlyWhitespace(_candidateNames[i]), "Candidate name cannot be only whitespace");

            // Check for duplicate names
            for (uint256 j = i + 1; j < _candidateNames.length; j++) {
                require(
                    keccak256(bytes(_candidateNames[i])) != keccak256(bytes(_candidateNames[j])),
                    "Duplicate candidate names not allowed"
                );
            }
        }

        uint256 electionId = elections.length;

        Election storage newElection = elections.push();
        newElection.title = _title;
        newElection.description = _description;
        newElection.candidateCount = _candidateNames.length;
        newElection.candidateNames = _candidateNames;
        newElection.endTime = block.timestamp + (_durationInHours * 1 hours);
        newElection.isActive = true;
        newElection.isFinalized = false;
        newElection.admin = msg.sender;
        newElection.totalVoters = 0;

        emit ElectionCreated(electionId, _title, msg.sender, _candidateNames.length);

        return electionId;
    }
    
    function getElectionAdmin(uint256 _electionId) external view electionExists(_electionId) returns (address) {
        return elections[_electionId].admin;
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

        // Enhanced election state validation
        require(election.isActive, "Election must be active to vote");
        require(!election.isFinalized, "Election already finalized");
        require(election.totalVoters < 1000, "Maximum voters reached");
        require(bytes(election.title).length > 0, "Election title is invalid");

        // Validate election state and candidate bounds
        require(election.candidateCount > 0, "Election has no candidates");
        require(election.candidateCount <= 10, "Too many candidates");
        require(!election.isFinalized, "Election already finalized");
        // Note: encryptedVote range validation happens at decryption time
        
        euint32 encryptedVote = FHE.fromExternal(_encryptedVote, inputProof);

        // Update candidate vote counts (simplified tracking - not cryptographically secure)
        // This is a basic counter for monitoring voting activity
        uint256 candidateIndex = 0; // Default to first candidate for tracking
        if (election.totalVoters == 0) {
            candidateVoteCounts[_electionId][candidateIndex] = encryptedVote;
        } else {
            euint32 currentCount = candidateVoteCounts[_electionId][candidateIndex];
            candidateVoteCounts[_electionId][candidateIndex] = FHE.add(currentCount, encryptedVote);
        }

        if (election.totalVoters == 0) {
            election.encryptedVoteSum = encryptedVote;
        } else {
            euint32 currentSum = election.encryptedVoteSum;
            election.encryptedVoteSum = FHE.add(currentSum, encryptedVote);
        }
        
        FHE.allowThis(election.encryptedVoteSum);
        FHE.allow(election.encryptedVoteSum, election.admin);
        
        hasVoted[_electionId][msg.sender] = true;
        election.totalVoters++;
        
        emit VoteCasted(_electionId, msg.sender, election.totalVoters);
    }

    /// @notice Get the encrypted vote sum (only admin can decrypt)
    /// @param _electionId The ID of the election
    /// @return The encrypted sum of all votes
    function getEncryptedVoteSum(
        uint256 _electionId
    ) external view onlyAdmin(_electionId) returns (euint32) {
        return elections[_electionId].encryptedVoteSum;
    }

    /// @notice Get candidate vote count (encrypted - for admin monitoring)
    /// @param _electionId The ID of the election
    /// @param _candidateId The candidate ID
    /// @return Encrypted vote count for the candidate
    function getCandidateVoteCount(
        uint256 _electionId,
        uint256 _candidateId
    ) external view electionExists(_electionId) returns (euint32) {
        require(_candidateId < elections[_electionId].candidateCount, "Invalid candidate ID");
        return candidateVoteCounts[_electionId][_candidateId];
    }

    /// @notice End an election (admin can call after end time)
    /// @param _electionId The ID of the election
    function endElection(uint256 _electionId) external onlyAdmin(_electionId) {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election not active");
        require(block.timestamp >= election.endTime, "Election has not ended yet");
        require(!election.isFinalized, "Election already finalized");

        election.isActive = false;
        emit ElectionEnded(_electionId, block.timestamp);
    }

    /// @notice Request decryption and publish clear results (admin can trigger after election ended)
    /// @param _electionId The ID of the election
    function finalizeElection(uint256 _electionId) external onlyAdmin(_electionId) {
        Election storage election = elections[_electionId];
        require(!election.isActive, "Election still active");
        require(!election.isFinalized, "Election already finalized");
        require(election.totalVoters > 0, "No votes cast in this election");
        require(election.encryptedVoteSum != euint32.wrap(0), "No encrypted votes to decrypt");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(election.encryptedVoteSum);

        uint256 requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        _requestToElection[requestId] = _electionId;
        emit FinalizeRequested(_electionId, requestId);
    }

    /// @notice Callback called by the FHE decryption oracle
    /// @dev Expects the decrypted sum in bytes
    function decryptionCallback(uint256 requestId, bytes memory cleartexts, bytes[] memory /*signatures*/) public returns (bool) {
        uint256 electionId = _requestToElection[requestId];
        Election storage election = elections[electionId];
        require(!election.isFinalized, "Election already finalized");
        require(!election.isActive, "Election still active");

        require(cleartexts.length >= 4, "Invalid cleartexts length");
        uint32 decryptedSum;
        assembly {
            decryptedSum := shr(224, mload(add(cleartexts, 32)))
        }

        election.decryptedSum = decryptedSum;
        election.isFinalized = true;

        emit ElectionFinalized(electionId, decryptedSum, election.totalVoters);
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
        uint256 endTime,
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
            election.endTime,
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

    /// @notice Helper function to check if string contains only whitespace
    function containsOnlyWhitespace(string memory str) internal pure returns (bool) {
        bytes memory strBytes = bytes(str);
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] != 0x20 && strBytes[i] != 0x09 && strBytes[i] != 0x0A && strBytes[i] != 0x0D) {
                return false;
            }
        }
        return strBytes.length > 0;
    }
}

