// refactor: optimize frontend component structure and error handling
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Election, useElectionContract } from '../hooks/useElectionContract';
import { VoteDialog } from './VoteDialog';
import { DecryptDialog } from './DecryptDialog';

interface ElectionCardProps {
  electionId: number;
  election: Election;
  onUpdate?: () => void;
}

export function ElectionCard({ electionId, election, onUpdate }: ElectionCardProps) {
  const { address } = useAccount();
  const { hasUserVoted } = useElectionContract();
  const [hasVoted, setHasVoted] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [showDecryptDialog, setShowDecryptDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Check if current user is the election admin
  const isAdmin = address?.toLowerCase() === election.admin?.toLowerCase();
  // Convert endTime from seconds to milliseconds for Date object
  const endDate = new Date(Number(election.endTime) * 1000);
  const isEnded = Date.now() > endDate.getTime();

  useEffect(() => {
    const checkVoteStatus = async () => {
      try {
        const voted = await hasUserVoted(electionId);
        setHasVoted(voted);
      } catch (error) {
        console.error('Failed to check vote status:', error);
        setHasVoted(false);
      }
    };
    if (address) {
      checkVoteStatus();
    }
  }, [electionId]);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const end = endDate.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeRemaining('Ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeRemaining(`${days}d ${hours % 24}h remaining`);
      } else {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endDate]);

  const getStatusBadge = () => {
    if (election.isFinalized) {
      return <Badge variant="secondary" className="bg-gray-500">Finalized</Badge>;
    }
    if (!election.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    if (isEnded && !election.isFinalized) {
      return <Badge variant="destructive">Ended</Badge>;
    }
    if (election.isActive && !isEnded) {
      return <Badge className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{election.title}</CardTitle>
              <CardDescription>{election.description}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Candidates ({election.candidateNames.length})</h4>
            <div className="flex flex-wrap gap-2">
              {election.candidateNames.map((name, idx) => (
                <Badge key={idx} variant="outline">{name}</Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{Number(election.totalVoters)} votes</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{timeRemaining}</span>
            </div>
          </div>

          {hasVoted && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>You have voted</span>
            </div>
          )}

          {isAdmin && (
            <div className="text-xs text-muted-foreground">
              You are the admin of this election
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {!hasVoted && election.isActive && !isEnded && (
            <Button 
              onClick={() => setShowVoteDialog(true)} 
              className="flex-1"
            >
              Cast Vote
            </Button>
          )}

          {isAdmin && isEnded && !election.isFinalized && (
            <Button 
              onClick={() => setShowDecryptDialog(true)} 
              variant="secondary"
              className="flex-1"
            >
              View Results
            </Button>
          )}

          {election.isFinalized && isAdmin && (
            <Button 
              onClick={() => setShowDecryptDialog(true)} 
              variant="outline"
              className="flex-1"
            >
              View Results
            </Button>
          )}
        </CardFooter>
      </Card>

      <VoteDialog
        open={showVoteDialog}
        onOpenChange={setShowVoteDialog}
        electionId={electionId}
        election={election}
        onSuccess={() => {
          setHasVoted(true);
          onUpdate?.();
        }}
      />

      <DecryptDialog
        open={showDecryptDialog}
        onOpenChange={setShowDecryptDialog}
        electionId={electionId}
        election={election}
        onFinalized={() => onUpdate?.()}
      />
    </>
  );
}

