import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { Election, useElectionContract } from '../hooks/useElectionContract';

interface DecryptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  electionId: number;
  election: Election;
  onFinalized?: () => void;
}

interface VoteResult {
  candidateName: string;
  voteCount: number;
  percentage: number;
}

// Dialog component for decrypting and viewing election results
export function DecryptDialog({ open, onOpenChange, electionId, election, onFinalized }: DecryptDialogProps) {
  const { getDecryptedVoteSum, finalizeElection, endElection, isLoading } = useElectionContract();
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedSum, setDecryptedSum] = useState<number | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResult[]>([]);

  useEffect(() => {
    if (open && election.isFinalized) {
      handleDecrypt();
    }
  }, [open, election.isFinalized]);

  const calculateVoteDistribution = (sum: number, totalVoters: number, candidateCount: number): VoteResult[] => {
    // For a simple case with candidates indexed as 1, 2, 3, etc.  // improve type safety
    // We need to solve the system of equations:
    // v1 + v2 + v3 + ... = totalVoters
    // v1*1 + v2*2 + v3*3 + ... = sum
    
    // This is a simplified calculation
    // In production, you'd want a more robust algorithm
    const results: VoteResult[] = [];
    
    if (candidateCount === 2) {
      // For 2 candidates: A=1, B=2
      // v1 + v2 = totalVoters
      // v1*1 + v2*2 = sum
      // Solving: v1 = 2*totalVoters - sum, v2 = sum - totalVoters
      const v1 = 2 * totalVoters - sum;
      const v2 = sum - totalVoters;
      results.push(
        { candidateName: election.candidateNames[0], voteCount: v1, percentage: (v1 / totalVoters) * 100 },
        { candidateName: election.candidateNames[1], voteCount: v2, percentage: (v2 / totalVoters) * 100 }
      );
    } else if (candidateCount === 3) {
      // For 3 candidates, we need an additional constraint or assumption
      // This is a simplified approach - assumes votes are distributed
      const avgIndex = sum / totalVoters;
      // Estimate distribution based on average
      const estimatedVotes = election.candidateNames.map((name, idx) => {
        const index = idx + 1;
        const diff = Math.abs(index - avgIndex);
        const weight = 1 / (diff + 1);
        return { candidateName: name, weight };
      });

      const totalWeight = estimatedVotes.reduce((acc, v) => acc + v.weight, 0);
      estimatedVotes.forEach(v => {
        const voteCount = Math.round((v.weight / totalWeight) * totalVoters);
        results.push({
          candidateName: v.candidateName,
          voteCount,
          percentage: (voteCount / totalVoters) * 100
        });
      });
    } else {
      // For more candidates, show basic info
      results.push({
        candidateName: 'Total',
        voteCount: totalVoters,
        percentage: 100
      });
    }

    return results.sort((a, b) => b.voteCount - a.voteCount);
  };

  const handleEndElection = async () => {
    try {
      const success = await endElection(electionId);
      if (success) {
        // Refresh election data
        onFinalized?.();
      }
    } catch (error) {
      console.error('Error ending election:', error);
    }
  };

  const handleDecrypt = async () => {
    setDecrypting(true);

    try {
      // First finalize the election (this triggers the decryption request to oracle)
      const finalizeSuccess = await finalizeElection(electionId);
      if (!finalizeSuccess) {
        throw new Error("Failed to finalize election");
      }

      // Wait for decryption to complete (poll for completion)
      let attempts = 0;
      const maxAttempts = 20; // Max 30 seconds (20 * 1.5s)

      while (attempts < maxAttempts) {
        try {
          const sum = await getDecryptedVoteSum(electionId);
          if (sum !== null && sum !== undefined) {
            setDecryptedSum(sum);
            const results = calculateVoteDistribution(
              sum,
              Number(election.totalVoters),
              Number(election.candidateCount)
            );
            setVoteResults(results);
            // Refresh election data
            onFinalized?.();
            break;
          }
        } catch (error) {
          // Election not finalized yet, continue waiting
          console.log('Waiting for decryption to complete...');
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
        }
      }

      if (attempts >= maxAttempts) {
        throw new Error("Decryption not completed. Please try again later.");
      }

    } catch (error) {
      console.error('Error during decryption:', error);
      throw error;
    } finally {
      setDecrypting(false);
    }
  };

  const handleFinalize = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    try {
      const success = await finalizeElection(electionId);
      if (success) {
        onFinalized?.();
        handleClose();
      }
    } catch (error) {
      console.error('Error finalizing election:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading && !decrypting) {
      onOpenChange(false);
      setDecryptedSum(null);
      setVoteResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && !decrypting && handleClose()}>
      <DialogContent 
        className="sm:max-w-lg"
        onInteractOutside={(e) => (isLoading || decrypting) && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {decryptedSum === null ? (
              <>
                <Lock className="h-5 w-5" />
                Decrypt Results
              </>
            ) : (
              <>
                <Unlock className="h-5 w-5" />
                Election Results
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {election.isFinalized 
              ? 'View the decrypted election results'
              : 'Decrypt the encrypted votes to view results and finalize the election'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {decrypting && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Decrypting votes...</p>
            </div>
          )}

          {!decrypting && decryptedSum === null && (
            <div className="text-center py-4">
              {election.isActive ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    The election is still active. You can end it now to allow decryption.
                  </p>
                  <Button
                    onClick={handleEndElection}
                    disabled={isLoading}
                    type="button"
                  >
                    End Election
                  </Button>
                </>
              ) : !election.isFinalized ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click below to finalize the election and decrypt the results. This will request decryption from the FHE oracle.
                  </p>
                  <Button
                    onClick={handleDecrypt}
                    disabled={isLoading}
                    type="button"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Finalize & Decrypt Results
                  </Button>
                </>
              ) : null}
            </div>
          )}

          {decryptedSum !== null && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Encrypted Sum Decrypted</div>
                <div className="text-2xl font-bold">{decryptedSum}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total Votes: {Number(election.totalVoters)}
                </div>
              </div>

              {voteResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Vote Distribution</h4>
                  {voteResults.map((result, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{result.candidateName}</span>
                        <span className="text-sm text-muted-foreground">
                          {result.voteCount} votes ({result.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={result.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}

              {Number(election.candidateCount) > 3 && (
                <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                  Note: With {election.candidateCount} candidates, individual vote counts cannot be precisely determined from the sum alone. 
                  Consider using additional data points for accurate results.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading || decrypting}
            type="button"
          >
            Close
          </Button>
          {!election.isFinalized && decryptedSum !== null && (
            <Button 
              onClick={handleFinalize} 
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing...
                </>
              ) : (
                'Finalize Election'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

