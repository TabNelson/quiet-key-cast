import { Logo } from './Logo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          
          <motion.div 
            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Lock className="w-4 h-4 text-primary" />
            <span className="font-medium">End-to-end encrypted voting</span>
          </motion.div>

          <ConnectButton />
        </div>
      </div>
    </header>
  );
};
