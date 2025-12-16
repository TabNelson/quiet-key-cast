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
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Animated background waves */}
      <div className="absolute inset-0 -z-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            transition={{ delay: i * 0.2 }}
          >
            <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <motion.path
                fill="currentColor"
                className="text-primary"
                d={getWavePath(i, 0)}
                animate={{
                  d: [
                    getWavePath(i, 0),
                    getWavePath(i, 1),
                    getWavePath(i, 0),
                  ],
                }}
                transition={{
                  duration: 12 + i * 4,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut"
                }}
              />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 -z-5 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full bg-primary/10 blur-xl"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * 40 - 20, 0],
              x: [0, Math.random() * 40 - 20, 0],
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Next Generation Voting Protocol
          </motion.div>

          <motion.h1
            className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-br from-foreground via-primary to-foreground bg-clip-text text-transparent tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Vote in Silence, <br className="hidden md:block" />
            <span className="text-primary">Speak in Truth.</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Leveraging Fully Homomorphic Encryption (FHE) to ensure your privacy is never compromised. 
            The only transparent part is the result.
          </motion.p>

          <motion.div
            className="grid md:grid-cols-3 gap-8 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              { icon: Shield, title: "Zero-Knowledge", desc: "Prove validity without revealing choice", id: "encrypted" },
              { icon: Lock, title: "FHE Powered", desc: "Compute on encrypted data directly", id: "private" },
              { icon: CheckCircle, title: "Immutable", desc: "On-chain verification & storage", id: "transparent" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                className="relative group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5 overflow-hidden"
                whileHover={{ y: -8 }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <feature.icon className="w-24 h-24" />
                </div>
                <div className="relative z-10 text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex flex-col items-center gap-4 text-muted-foreground/60"
          >
            <p className="text-xs uppercase tracking-[0.2em] font-bold">Trusted by leading DAOs</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale filter hover:grayscale-0 transition-all duration-500">
              {/* Decorative Logos */}
              {['Zama', 'Ethereum', 'Arbitrum', 'Polygon'].map((logo) => (
                <span key={logo} className="text-xl font-black italic tracking-tighter">{logo}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
