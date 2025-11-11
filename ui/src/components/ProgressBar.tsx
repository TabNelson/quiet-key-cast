import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar = ({ current, total, label = "Total Votes" }: ProgressBarProps) => {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold">
          {current.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-trust rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-end mt-1">
        <span className="text-xs text-muted-foreground">
          {percentage.toFixed(1)}% participation
        </span>
      </div>
    </div>
  );
};
