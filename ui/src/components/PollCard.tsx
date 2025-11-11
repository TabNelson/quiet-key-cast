import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Users, Clock } from 'lucide-react';
import { useState } from 'react';

interface PollCardProps {
  id: string;
  title: string;
  description: string;
  options: string[];
  endTime: Date;
  totalVotes: number;
  status: 'active' | 'closed';
}

export const PollCard = ({ title, description, options, endTime, totalVotes, status }: PollCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const timeLeft = Math.max(0, endTime.getTime() - Date.now());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

  const handleVote = async () => {
    if (selectedOption === null) return;
    
    setIsVoting(true);
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsVoting(false);
    setHasVoted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-border hover:border-primary transition-colors">
        <CardHeader className="bg-muted/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
              {status === 'active' ? 'Active' : 'Closed'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-3">
            {options.map((option, index) => (
              <motion.button
                key={index}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedOption === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${hasVoted || status === 'closed' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !hasVoted && status === 'active' && setSelectedOption(index)}
                disabled={hasVoted || status === 'closed'}
                whileHover={!hasVoted && status === 'active' ? { scale: 1.02 } : {}}
                whileTap={!hasVoted && status === 'active' ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === index ? 'border-primary' : 'border-border'
                  }`}>
                    {selectedOption === index && (
                      <motion.div
                        className="w-3 h-3 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{totalVotes} votes</span>
            </div>
            {status === 'active' && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{hoursLeft}h remaining</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-verified" />
              <span>Encrypted</span>
            </div>
          </div>
        </CardContent>

        {status === 'active' && !hasVoted && (
          <CardFooter className="bg-muted/30 border-t border-border">
            <Button
              className="w-full"
              onClick={handleVote}
              disabled={selectedOption === null || isVoting}
            >
              {isVoting ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-lock-shake" />
                  Encrypting & Submitting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Submit Encrypted Vote
                </>
              )}
            </Button>
          </CardFooter>
        )}

        {hasVoted && (
          <CardFooter className="bg-success/10 border-t border-success/20">
            <div className="w-full text-center text-success font-medium">
              ✓ Vote submitted and encrypted
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};
