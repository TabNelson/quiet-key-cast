import { ProgressBar } from './ProgressBar';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const Footer = () => {
  // Mock data - in production, this would come from smart contract
  const totalVotes = 45823;
  const expectedVotes = 100000;

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-lg mt-20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="max-w-2xl mx-auto mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ProgressBar current={totalVotes} total={expectedVotes} label="Platform-wide Votes" />
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-verified" />
            <span>Powered by secure smart contracts</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
            <a href="#" className="hover:text-primary transition-colors">About</a>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-muted-foreground">
          © 2024 SilentVote Hub. All votes are encrypted and secured on-chain.
        </div>
      </div>
    </footer>
  );
};
