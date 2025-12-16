import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, Key, Users, FileCheck, Code, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Features = () => {
  const features = [
    {
      id: 'encrypted',
      icon: Shield,
      title: "Encrypted Voting",
      subtitle: "Ballots secured by blockchain",
      color: "text-primary",
      details: [
        {
          icon: Key,
          title: "End-to-End Encryption",
          description: "Your vote is encrypted on your device before being submitted to the blockchain, ensuring no one can see your choice during the voting period."
        },
        {
          icon: Code,
          title: "Zero-Knowledge Proofs",
          description: "Advanced cryptographic techniques verify your vote is valid without revealing what you voted for, maintaining complete ballot secrecy."
        },
        {
          icon: FileCheck,
          title: "Immutable Records",
          description: "Once encrypted and stored on-chain, your vote cannot be altered, deleted, or tampered with, guaranteeing the integrity of the election."
        }
      ]
    },
    {
      id: 'private',
      icon: Lock,
      title: "Private Voting",
      subtitle: "Only smart contract sees votes",
      color: "text-trust",
      details: [
        {
          icon: Lock,
          title: "Smart Contract Privacy",
          description: "Your encrypted ballot is only accessible by the tally smart contract, which operates autonomously without human intervention or access."
        },
        {
          icon: Eye,
          title: "No External Access",
          description: "Not even administrators, validators, or node operators can view individual votes during the active voting period."
        },
        {
          icon: Users,
          title: "Voter Anonymity",
          description: "Your wallet address is cryptographically separated from your vote choice, ensuring complete anonymity while maintaining vote verification."
        }
      ]
    },
    {
      id: 'transparent',
      icon: CheckCircle,
      title: "Transparent Results",
      subtitle: "Public results after close",
      color: "text-verified",
      details: [
        {
          icon: Clock,
          title: "Automatic Decryption",
          description: "When voting closes, the smart contract automatically decrypts and tallies all votes, publishing final results that anyone can verify."
        },
        {
          icon: CheckCircle,
          title: "Auditable Process",
          description: "Every step of the voting and counting process is recorded on-chain, allowing independent verification of the election integrity."
        },
        {
          icon: Users,
          title: "Public Verification",
          description: "Anyone can verify the results by examining the blockchain, ensuring complete transparency and trust in the democratic process."
        }
      ]
    }
  ];

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden" id="features">
      {/* Background Decorative Patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border text-primary text-sm font-bold mb-4">
            Security & Transparency
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SilentVote Hub combines blockchain technology with advanced cryptography 
            to create a voting system that is simultaneously private and transparent.
          </p>
        </motion.div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              id={feature.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group">
                <CardHeader className="bg-card/50 border-b border-border/50 p-8">
                  <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-2xl bg-primary/10 ${feature.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner`}>
                      <feature.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold mb-1">{feature.title}</CardTitle>
                      <CardDescription className="text-lg font-medium opacity-70">{feature.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-3 gap-8">
                    {feature.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        className="p-6 rounded-xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all duration-300"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <div className="flex flex-col gap-4">
                          <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm`}>
                            <detail.icon className={`w-5 h-5 ${feature.color}`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg mb-2">{detail.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {detail.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Decorative Quote/End of section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 text-center border-t border-border/50 pt-12"
        >
          <p className="text-sm font-serif italic text-muted-foreground max-w-xl mx-auto">
            "The ballot is stronger than the bullet." - Abraham Lincoln. <br />
            <span className="not-italic font-sans text-xs uppercase tracking-widest font-bold mt-2 block">Powered by FHE Technology</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};
