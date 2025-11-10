import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AnonymousElection, AnonymousElection__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  admin: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  carol: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("AnonymousElection")) as AnonymousElection__factory;
  const electionContract = (await factory.deploy()) as AnonymousElection;
  const electionContractAddress = await electionContract.getAddress();

  return { electionContract, electionContractAddress };
}

describe("AnonymousElection", function () {
  let signers: Signers;
  let electionContract: AnonymousElection;
  let electionContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      admin: ethSigners[1],
      alice: ethSigners[2],
      bob: ethSigners[3],
      carol: ethSigners[4],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ electionContract, electionContractAddress } = await deployFixture());
  });

  describe("Election Creation", function () {
    it("should create a new election", async function () {
      const candidates = ["Alice Smith", "Bob Johnson", "Carol White"];
      const tx = await electionContract
        .connect(signers.admin)
        .createElection(
          "Student Council President 2024",
          "Vote for your next student council president",
          candidates,
          72 // 72 hours
        );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const election = await electionContract.getElection(0);
      expect(election.title).to.equal("Student Council President 2024");
      expect(election.candidateCount).to.equal(3);
      expect(election.admin).to.equal(signers.admin.address);
      expect(election.isActive).to.be.true;
      expect(election.isFinalized).to.be.false;
    });

    it("should fail if less than 2 candidates", async function () {
      const candidates = ["Alice Smith"];
      await expect(
        electionContract
          .connect(signers.admin)
          .createElection("Invalid Election", "Test", candidates, 24)
      ).to.be.revertedWith("Must have at least 2 candidates");
    });

    it("should fail if more than 10 candidates", async function () {
      const candidates = Array(11).fill("Candidate");
      await expect(
        electionContract
          .connect(signers.admin)
          .createElection("Invalid Election", "Test", candidates, 24)
      ).to.be.revertedWith("Cannot have more than 10 candidates");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      const candidates = ["Alice Smith", "Bob Johnson", "Carol White"];
      await electionContract
        .connect(signers.admin)
        .createElection(
          "Student Council President 2024",
          "Vote for your next student council president",
          candidates,
          72
        );
    });

    it("should allow a student to vote with encrypted vote", async function () {
      // Alice votes for candidate 1
      const voteChoice = 1;
      const encryptedVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.alice.address)
        .add32(voteChoice)
        .encrypt();

      const tx = await electionContract
        .connect(signers.alice)
        .vote(0, encryptedVote.handles[0], encryptedVote.inputProof);

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const hasVoted = await electionContract.hasUserVoted(0, signers.alice.address);
      expect(hasVoted).to.be.true;

      const election = await electionContract.getElection(0);
      expect(election.totalVoters).to.equal(1);
    });

    it("should accumulate encrypted votes correctly", async function () {
      // Alice votes for candidate 1
      const aliceVote = 1;
      const encryptedAliceVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.alice.address)
        .add32(aliceVote)
        .encrypt();

      await electionContract
        .connect(signers.alice)
        .vote(0, encryptedAliceVote.handles[0], encryptedAliceVote.inputProof);

      // Bob votes for candidate 2
      const bobVote = 2;
      const encryptedBobVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.bob.address)
        .add32(bobVote)
        .encrypt();

      await electionContract
        .connect(signers.bob)
        .vote(0, encryptedBobVote.handles[0], encryptedBobVote.inputProof);

      // Carol votes for candidate 1
      const carolVote = 1;
      const encryptedCarolVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.carol.address)
        .add32(carolVote)
        .encrypt();

      await electionContract
        .connect(signers.carol)
        .vote(0, encryptedCarolVote.handles[0], encryptedCarolVote.inputProof);

      // Get encrypted vote sum
      const encryptedSum = await electionContract.getEncryptedVoteSum(0);

      // Admin decrypts the sum
      const decryptedSum = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedSum,
        electionContractAddress,
        signers.admin
      );

      // Expected sum: 1 + 2 + 1 = 4
      expect(decryptedSum).to.equal(aliceVote + bobVote + carolVote);

      const election = await electionContract.getElection(0);
      expect(election.totalVoters).to.equal(3);
    });

    it("should not allow voting twice", async function () {
      const voteChoice = 1;
      const encryptedVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.alice.address)
        .add32(voteChoice)
        .encrypt();

      await electionContract
        .connect(signers.alice)
        .vote(0, encryptedVote.handles[0], encryptedVote.inputProof);

      // Try to vote again
      const encryptedVote2 = await fhevm
        .createEncryptedInput(electionContractAddress, signers.alice.address)
        .add32(2)
        .encrypt();

      await expect(
        electionContract
          .connect(signers.alice)
          .vote(0, encryptedVote2.handles[0], encryptedVote2.inputProof)
      ).to.be.revertedWith("Already voted in this election");
    });
  });

  describe("Election Finalization", function () {
    beforeEach(async function () {
      const candidates = ["Alice Smith", "Bob Johnson"];
      await electionContract
        .connect(signers.admin)
        .createElection(
          "Quick Election",
          "Test election",
          candidates,
          1 // 1 hour
        );

      // Cast some votes
      const aliceVote = await fhevm
        .createEncryptedInput(electionContractAddress, signers.alice.address)
        .add32(1)
        .encrypt();

      await electionContract
        .connect(signers.alice)
        .vote(0, aliceVote.handles[0], aliceVote.inputProof);
    });

    it("should not allow finalizing before election ends", async function () {
      await expect(
        electionContract.connect(signers.admin).finalizeElection(0)
      ).to.be.revertedWith("Election has not ended yet");
    });

    it("should allow admin to finalize after election ends", async function () {
      // Fast forward time by 2 hours
      await ethers.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      const tx = await electionContract.connect(signers.admin).finalizeElection(0);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const election = await electionContract.getElection(0);
      expect(election.isFinalized).to.be.true;
      expect(election.isActive).to.be.false;
    });

    it("should not allow non-admin to finalize", async function () {
      await ethers.provider.send("evm_increaseTime", [2 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        electionContract.connect(signers.alice).finalizeElection(0)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Complex Voting Scenario", function () {
    it("should handle realistic election with multiple voters", async function () {
      const candidates = ["Candidate A", "Candidate B", "Candidate C"];
      await electionContract
        .connect(signers.admin)
        .createElection(
          "Class Representative Election",
          "Vote for your class representative",
          candidates,
          48
        );

      // Simulate voting:
      // Alice votes for Candidate A (1)
      // Bob votes for Candidate B (2)
      // Carol votes for Candidate A (1)
      // Expected sum: 1 + 2 + 1 = 4

      const votes = [
        { signer: signers.alice, choice: 1 },
        { signer: signers.bob, choice: 2 },
        { signer: signers.carol, choice: 1 },
      ];

      for (const vote of votes) {
        const encryptedVote = await fhevm
          .createEncryptedInput(electionContractAddress, vote.signer.address)
          .add32(vote.choice)
          .encrypt();

        await electionContract
          .connect(vote.signer)
          .vote(0, encryptedVote.handles[0], encryptedVote.inputProof);
      }

      // Get encrypted sum
      const encryptedSum = await electionContract.getEncryptedVoteSum(0);

      // Admin decrypts
      const decryptedSum = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedSum,
        electionContractAddress,
        signers.admin
      );

      expect(decryptedSum).to.equal(4);

      // Calculate individual results from sum:
      // If we know: n votes total, sum S, and candidate encoding
      // For 3 candidates: A=1, B=2, C=3
      // Let a, b, c be vote counts
      // We have: a + b + c = 3 (total voters)
      //         a*1 + b*2 + c*3 = 4 (sum)
      // Solution: a=2, b=1, c=0
      const election = await electionContract.getElection(0);
      expect(election.totalVoters).to.equal(3);
    });
  });

  describe("Edge Cases", function () {
    it("should handle election with no votes", async function () {
      const candidates = ["Candidate A", "Candidate B"];
      await electionContract
        .connect(signers.admin)
        .createElection("Empty Election", "No votes", candidates, 24);

      const election = await electionContract.getElection(0);
      expect(election.totalVoters).to.equal(0);
    });

    it("should get election count correctly", async function () {
      expect(await electionContract.getElectionCount()).to.equal(0);

      const candidates = ["A", "B"];
      await electionContract.connect(signers.admin).createElection("E1", "D1", candidates, 24);
      expect(await electionContract.getElectionCount()).to.equal(1);

      await electionContract.connect(signers.admin).createElection("E2", "D2", candidates, 24);
      expect(await electionContract.getElectionCount()).to.equal(2);
    });

    it("Should reject election creation with 0 candidates", async function () {
      await expect(
        electionContract.createElection(
          "Test Election",
          "Test Description",
          [],
          24
        )
      ).to.be.revertedWith("Must have at least 2 candidates");
    });

    it("Should reject election creation with more than 10 candidates", async function () {
      const tooManyCandidates = Array(11).fill("Candidate");
      await expect(
        electionContract.createElection(
          "Test Election",
          "Test Description",
          tooManyCandidates,
          24
        )
      ).to.be.revertedWith("Cannot have more than 10 candidates");
    });

    it("Should handle vote with invalid candidate index", async function () {
      const { electionContract, encryptedInput } = await loadFixture(deployElectionFixture);
      await expect(
        electionContract.vote(0, encryptedInput.handles[0], encryptedInput.inputProof)
      ).to.not.be.reverted;
    });
  });
});

