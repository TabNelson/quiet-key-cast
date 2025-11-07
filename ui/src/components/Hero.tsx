import heroBackground from "@/assets/hero-background.jpg";

const Hero = () => {
  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="relative container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-glow-pulse">
            Rate. Compute. Stay Private.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Submit anonymous ratings using fully homomorphic encryption. View aggregated statistics without revealing individual data. Perfect for private feedback and anonymous polling.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur px-6 py-3 rounded-lg border border-primary/30">
              <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
              <span className="text-sm text-foreground">Anonymous Ratings (1-10)</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur px-6 py-3 rounded-lg border border-primary/30">
              <div className="w-2 h-2 bg-accent rounded-full animate-glow-pulse" />
              <span className="text-sm text-foreground">FHE-Powered Computation</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur px-6 py-3 rounded-lg border border-primary/30">
              <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
              <span className="text-sm text-foreground">Privacy-First Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
