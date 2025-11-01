import Header from "@/components/Header";
import Hero from "@/components/Hero";
import RatingSystem from "@/components/RatingSystem";
import RatingHistory from "@/components/RatingHistory";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <RatingSystem />
        <div className="container mx-auto px-4 py-8">
          <RatingHistory />
        </div>
      </main>
    </div>
  );
};

export default Index;
