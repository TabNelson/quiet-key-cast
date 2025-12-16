import { ProgressBar } from './ProgressBar';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const Footer = () => {
  // Mock data - in production, this would come from smart contract
  const totalVotes = 45823;
  const expectedVotes = 100000;

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-lg mt-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter text-primary">
              <Shield className="w-8 h-8" />
              QUIET KEY CAST
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The premier platform for private, secure, and verifiable on-chain voting. 
              Built on cutting-edge Fully Homomorphic Encryption technology.
            </p>
            <div className="flex gap-4 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="w-3 h-3 bg-muted-foreground group-hover:bg-primary rounded-sm transition-colors" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary/40" /> Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary/40" /> Whitepaper</a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary/40" /> Security Audit</a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary/40" /> Open Source</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Status</h4>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center justify-between">
                <span className="text-xs font-medium text-success">Network Status</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-bold text-success">Operational</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-xs font-medium text-primary">FHE Relayer</span>
                <span className="text-xs font-bold text-primary">Connected</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="max-w-4xl mx-auto mb-12 p-8 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
             <span className="text-sm font-bold text-muted-foreground">Platform Adoption</span>
             <span className="text-sm font-bold text-primary">{((totalVotes/expectedVotes)*100).toFixed(1)}% of Milestone</span>
          </div>
          <ProgressBar current={totalVotes} total={expectedVotes} label="Total Secure Votes Processed" />
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 text-xs text-muted-foreground gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-verified" />
            <span>Secured by Fully Homomorphic Encryption (FHE)</span>
          </div>
          
          <div className="flex items-center gap-8">
            <span>© 2024 SilentVote Hub</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

