import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle } from 'lucide-react';

export const Hero = () => {
  // Pre-calculate SVG paths to avoid undefined values
  const getWavePath = (i: number, variant: number = 0): string => {
    // Ensure i and variant are valid numbers
    const index = Number.isFinite(i) ? i : 0;
    const varValue = Number.isFinite(variant) ? variant : 0;
    
    const baseY = 160 + index * 40;
    const offset = varValue * 32; // 0 or 32 for different variants

    // Calculate all values explicitly to avoid undefined
    const y1 = baseY + offset;
    const y2 = 144 + index * 40 + offset;
    const y3 = 128 + index * 40 + offset;
    const y4 = 96 + index * 40 + offset;
    const y5 = 106.7 + index * 40 + offset;
    const y6 = 117 + index * 40 + offset;
    const y7 = 171 + index * 40 + offset;
    const y8 = 181.3 + index * 40 + offset;
    const y9 = 192 + index * 40 + offset;
    const y10 = 160 + index * 40 + offset;
    const y11 = 149.3 + index * 40 + offset;
    const y12 = 139 + index * 40 + offset;
    const y13 = 149 + index * 40 + offset;
    const y14 = 138.7 + index * 40 + offset;
    const y15 = 128 + index * 40 + offset;
    const y16 = 96 + index * 40 + offset;
    const y17 = 80 + index * 40 + offset;
    const y18 = 64 + index * 40 + offset;

    return `M0,${y1}L48,${y2}C96,${y3},192,${y4},288,${y5}C384,${y6},480,${y7},576,${y8}C672,${y9},768,${y10},864,${y11}C960,${y12},1056,${y13},1152,${y14}C1248,${y15},1344,${y16},1392,${y17}L1440,${y18}L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z`;
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Animated background waves */}
      <div className="absolute inset-0 -z-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: i * 0.2 }}
          >
            <svg className="w-full h-full" viewBox="0 0 1440 320">
              <motion.path
                fill="currentColor"
                className="text-primary"
                d={getWavePath(i, 0)}
                animate={{
                  d: [
                    getWavePath(i, 0),
                    getWavePath(i, 1),
                  ],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              />
            </svg>
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-trust to-primary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Anonymous Elections with FHE
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Vote privately with Fully Homomorphic Encryption.
            <br />
            Your vote stays encrypted, only the sum is revealed.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              { icon: Shield, title: "Encrypted", desc: "Ballots secured by blockchain", id: "encrypted" },
              { icon: Lock, title: "Private", desc: "Only smart contract sees votes", id: "private" },
              { icon: CheckCircle, title: "Transparent", desc: "Public results after close", id: "transparent" },
            ].map((feature, i) => (
              <motion.button
                key={i}
                onClick={() => {
                  document.getElementById(feature.id)?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary transition-colors cursor-pointer text-left"
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
                <p className="text-xs text-primary mt-3 font-medium">Click to learn more →</p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
