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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { useElectionContract } from '../hooks/useElectionContract';

interface CreateElectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateElectionDialog({ open, onOpenChange, onSuccess }: CreateElectionDialogProps) {
  const { createElection, isLoading } = useElectionContract();
  
  // Election title input
  const [title, setTitle] = useState('');
  // Election description input
  const [description, setDescription] = useState('');
  // Initialize with 2 empty candidate fields (minimum required)
  const [candidates, setCandidates] = useState<string[]>(['', '']);
  // Default election duration is 24 hours
  const [durationHours, setDurationHours] = useState('24');

  const handleAddCandidate = () => {
    if (candidates.length < 10) {
      setCandidates([...candidates, '']);
    }
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const handleCandidateChange = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // Validate all fields before submission
    e?.preventDefault();
    
    const validCandidates = candidates.filter(c => c.trim() !== '');
    
    if (title.trim() === '') {
      alert('Please enter an election title');
      return;
    }
    if (validCandidates.length < 2) {
      alert('Please add at least 2 candidates');
      return;
    }
    if (parseInt(durationHours) < 1) {
      alert('Duration must be at least 1 hour');
      return;
    }

    try {
      const success = await createElection(
        title.trim(),
        description.trim(),
        validCandidates,
        parseInt(durationHours)
      );

      if (success) {
        handleClose();
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error creating election:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      // Reset form
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setCandidates(['', '']);
        setDurationHours('24');
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !isLoading && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => isLoading && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
          <DialogDescription>
            Set up a new anonymous election for your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Election Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Student Council President 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the election..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Candidates * (2-10)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCandidate}
                  disabled={candidates.length >= 10 || isLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                {candidates.map((candidate, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Candidate ${index + 1}`}
                      value={candidate}
                      onChange={(e) => handleCandidateChange(index, e.target.value)}
                      disabled={isLoading}
                    />
                    {candidates.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCandidate(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="720"
                placeholder="24"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                How long the election will remain open for voting
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
              <p className="font-medium">Privacy & Security</p>
              <p className="text-muted-foreground">
                • All votes will be encrypted using FHE (Fully Homomorphic Encryption)
              </p>
              <p className="text-muted-foreground">
                • Individual votes remain private and cannot be decrypted
              </p>
              <p className="text-muted-foreground">
                • Only the aggregated sum can be decrypted by the election admin
              </p>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Election'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

