import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, Sparkles, Heart, Zap } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Music visualization" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-radial" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-card/30 backdrop-blur-sm border border-primary/20">
              <Music className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            MoodTune
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover music that matches your mood. AI-powered recommendations from Spotify, 
            tailored to how you feel right now.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/recommendations">
              <Button variant="hero" size="lg" className="min-w-[200px]">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="min-w-[200px] border-primary/50 hover:border-primary">
              Learn More
            </Button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <div className="px-6 py-3 rounded-full bg-card/40 backdrop-blur-sm border border-primary/20 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm">AI-Powered</span>
            </div>
            <div className="px-6 py-3 rounded-full bg-card/40 backdrop-blur-sm border border-secondary/20 flex items-center gap-2">
              <Heart className="w-5 h-5 text-secondary" />
              <span className="text-sm">Mood-Based</span>
            </div>
            <div className="px-6 py-3 rounded-full bg-card/40 backdrop-blur-sm border border-accent/20 flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm">Instant Results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-xl bg-card shadow-card border border-border hover:border-primary/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect Spotify</h3>
              <p className="text-muted-foreground">
                Link your Spotify account to access millions of tracks and personalized recommendations.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-card shadow-card border border-border hover:border-secondary/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Select Your Mood</h3>
              <p className="text-muted-foreground">
                Choose how you're feeling - happy, energetic, chill, sad, or romantic.
              </p>
            </div>

            <div className="p-8 rounded-xl bg-card shadow-card border border-border hover:border-accent/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Discover Music</h3>
              <p className="text-muted-foreground">
                Get instant recommendations with previews and links to play on Spotify.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
