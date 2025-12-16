import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Election, useElectionContract } from '../hooks/useElectionContract';

interface VoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  electionId: number;
  election: Election;
  onSuccess?: () => void;
}

export function VoteDialog({ open, onOpenChange, electionId, election, onSuccess }: VoteDialogProps) {
  const { castVote, isLoading } = useElectionContract();
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

  const handleVote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!selectedCandidate) return;

    try {
      const candidateIndex = parseInt(selectedCandidate);
      const success = await castVote(electionId, candidateIndex);

      if (success) {
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error casting vote:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setSelectedCandidate('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && handleClose()}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => isLoading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Cast Your Vote</DialogTitle>
          <DialogDescription>
            Select your preferred candidate. Your vote will be encrypted and remain anonymous.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVote}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Candidates</Label>
              <RadioGroup 
                value={selectedCandidate} 
                onValueChange={setSelectedCandidate}
                disabled={isLoading}
              >
                {election.candidateNames.map((name, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem 
                      value={index.toString()} 
                      id={`candidate-${index}`}
                      disabled={isLoading}
                    />
                    <Label 
                      htmlFor={`candidate-${index}`} 
                      className="flex-1 cursor-pointer font-medium"
                    >
                      {name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Privacy Notice:</strong> Your vote will be encrypted before submission. 
              Only the final aggregated results can be decrypted by the election admin.
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleClose} 
              disabled={isLoading}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!selectedCandidate || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Vote'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

