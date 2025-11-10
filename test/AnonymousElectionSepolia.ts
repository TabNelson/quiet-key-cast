import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { AnonymousElection, AnonymousElection__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
};

/**
 * Integration test for AnonymousElection on Sepolia Testnet
 * This test suite is designed to run against a deployed contract on Sepolia
 */
describe("AnonymousElection - Sepolia Integration", function () {
  let signers: Signers;
  let electionContract: AnonymousElection;
  let electionContractAddress: string;

  before(async function () {
    // Skip if running in mock environment
    if (fhevm.isMock) {
      console.warn(`This test suite is for Sepolia testnet only`);
      this.skip();
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
    };

    // Get the deployed contract address from deployments
    const deployment = await ethers.getContract("AnonymousElection");
    electionContractAddress = await deployment.getAddress();
    electionContract = (await ethers.getContractAt(
      "AnonymousElection",
      electionContractAddress
    )) as AnonymousElection;

    console.log(`Testing AnonymousElection contract at: ${electionContractAddress}`);
  });

  it("should create a test election on Sepolia", async function () {
    this.timeout(120000); // 2 minutes timeout for Sepolia transactions

    const candidates = ["Test Candidate A", "Test Candidate B", "Test Candidate C"];
    
    const tx = await electionContract
      .connect(signers.deployer)
      .createElection(
        "Sepolia Test Election",
        "Integration test election on Sepolia testnet",
        candidates,
        24 // 24 hours
      );

    console.log(`Creating election... Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);
    console.log(`Election created successfully!`);

    // Get election count
    const electionCount = await electionContract.getElectionCount();
    console.log(`Total elections: ${electionCount}`);

    // Get the latest election details
    const electionId = Number(electionCount) - 1;
    const election = await electionContract.getElection(electionId);
    
    console.log(`Election ID: ${electionId}`);
    console.log(`Title: ${election.title}`);
    console.log(`Description: ${election.description}`);
    console.log(`Candidates: ${election.candidateNames.join(", ")}`);
    console.log(`Admin: ${election.admin}`);
    console.log(`Is Active: ${election.isActive}`);
    
    expect(election.title).to.equal("Sepolia Test Election");
    expect(election.candidateCount).to.equal(3);
    expect(election.isActive).to.be.true;
  });

  it("should cast a vote on Sepolia", async function () {
    this.timeout(120000); // 2 minutes timeout

    // Get the latest election
    const electionCount = await electionContract.getElectionCount();
    const electionId = Number(electionCount) - 1;

    // Check if already voted
    const hasVoted = await electionContract.hasUserVoted(electionId, signers.deployer.address);
    
    if (hasVoted) {
      console.log("Already voted in this election, skipping vote test");
      this.skip();
      return;
    }

    // Vote for candidate 1
    const voteChoice = 1;
    console.log(`Encrypting vote for candidate ${voteChoice}...`);
    
    const encryptedVote = await fhevm
      .createEncryptedInput(electionContractAddress, signers.deployer.address)
      .add32(voteChoice)
      .encrypt();

    console.log(`Casting vote...`);
    const tx = await electionContract
      .connect(signers.deployer)
      .vote(electionId, encryptedVote.handles[0], encryptedVote.inputProof);

    console.log(`Vote transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);
    console.log(`Vote cast successfully!`);

    // Verify vote was recorded
    const hasVotedAfter = await electionContract.hasUserVoted(electionId, signers.deployer.address);
    expect(hasVotedAfter).to.be.true;

    const election = await electionContract.getElection(electionId);
    console.log(`Total voters: ${election.totalVoters}`);
  });

  it("should retrieve election details", async function () {
    const electionCount = await electionContract.getElectionCount();
    console.log(`\n=== Election Summary ===`);
    console.log(`Total elections: ${electionCount}`);

    if (electionCount > 0) {
      for (let i = 0; i < Number(electionCount); i++) {
        const election = await electionContract.getElection(i);
        console.log(`\nElection ${i}:`);
        console.log(`  Title: ${election.title}`);
        console.log(`  Candidates: ${election.candidateNames.join(", ")}`);
        console.log(`  Total Voters: ${election.totalVoters}`);
        console.log(`  Is Active: ${election.isActive}`);
        console.log(`  Is Finalized: ${election.isFinalized}`);
        console.log(`  Admin: ${election.admin}`);
      }
    }
  });
});

