import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, CheckCircle, XCircle, ChevronRight, Hash } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Election, useElectionContract } from '../hooks/useElectionContract';
import { VoteDialog } from './VoteDialog';
import { DecryptDialog } from './DecryptDialog';
import { motion } from 'framer-motion';

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

  const isAdmin = address?.toLowerCase() === election.admin?.toLowerCase();

  useEffect(() => {
    const checkVoteStatus = async () => {
      const voted = await hasUserVoted(electionId);
      setHasVoted(voted);
    };
    if (address) {
      checkVoteStatus();
    }
  }, [electionId, address]);

  const getStatusBadge = () => {
    if (election.isFinalized) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground border-border/50">
          <CheckCircle className="w-3 h-3 mr-1" /> Finalized
        </Badge>
      );
    }
    if (!election.isActive) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="w-3 h-3 mr-1" /> Ended
        </Badge>
      );
    }
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" /> Active
      </Badge>
    );
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Hash className="w-24 h-24 rotate-12" />
          </div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl font-bold truncate mb-1 group-hover:text-primary transition-colors">
                  {election.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {election.description}
                </CardDescription>
              </div>
              <div className="shrink-0">
                {getStatusBadge()}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 flex-1 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                <span>Candidates</span>
                <span>{election.candidateNames.length} Total</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {election.candidateNames.map((name, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="bg-background/50 border-border/50 group-hover:border-primary/30 transition-colors"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Voters</span>
                </div>
                <div className="text-lg font-bold">{Number(election.totalVoters)}</div>
              </div>
            </div>

            {hasVoted && (
              <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/5 p-3 rounded-xl border border-primary/10">
                <CheckCircle className="h-4 w-4" />
                <span>Vote recorded on-chain</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2 pb-6 px-6 relative z-10">
            {!hasVoted && election.isActive ? (
              <Button 
                onClick={() => setShowVoteDialog(true)} 
                className="w-full group/btn relative overflow-hidden h-11"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Cast Your Vote <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-trust to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            ) : (isAdmin || election.isFinalized) ? (
              <Button 
                onClick={() => setShowDecryptDialog(true)} 
                variant={election.isFinalized ? "outline" : "secondary"}
                className="w-full h-11 border-border/50"
              >
                {election.isFinalized ? "View Final Results" : "Finalize & View Results"}
              </Button>
            ) : (
              <Button disabled variant="ghost" className="w-full h-11 opacity-50">
                Election Ended
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>

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

