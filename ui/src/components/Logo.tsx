import { motion } from 'framer-motion';
import { Vote } from 'lucide-react';

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <motion.div 
      className={`flex items-center gap-3 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Vote className="w-6 h-6 text-primary" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      <span className="text-xl font-bold text-foreground">Anonymous Election</span>
    </motion.div>
  );
};
