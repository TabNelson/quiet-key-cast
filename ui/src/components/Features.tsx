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
    <section className="py-16 bg-muted/30" id="features">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            SilentVote Hub combines blockchain technology with advanced cryptography 
            to create a voting system that is simultaneously private and transparent.
          </p>
        </motion.div>

        <div className="space-y-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              id={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-2">
                <CardHeader className="bg-card">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-lg bg-primary/10 ${feature.color}`}>
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.subtitle}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {feature.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                      >
                        <div className="flex items-start gap-3">
                          <detail.icon className={`w-5 h-5 mt-1 ${feature.color}`} />
                          <div>
                            <h4 className="font-semibold mb-1">{detail.title}</h4>
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
      </div>
    </section>
  );
};
