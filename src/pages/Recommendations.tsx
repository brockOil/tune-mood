import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Search, Heart, Zap, Cloud, Frown, Smile } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import TrackCard from "@/components/TrackCard";
import { getRecommendations, searchTracks } from "@/lib/spotify";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mood = "happy" | "energetic" | "chill" | "sad" | "romantic";

const moods: { value: Mood; label: string; icon: any; color: string }[] = [
  { value: "happy", label: "Happy", icon: Smile, color: "text-primary" },
  { value: "energetic", label: "Energetic", icon: Zap, color: "text-accent" },
  { value: "chill", label: "Chill", icon: Cloud, color: "text-secondary" },
  { value: "sad", label: "Sad", icon: Frown, color: "text-muted-foreground" },
  { value: "romantic", label: "Romantic", icon: Heart, color: "text-accent" },
];

const Recommendations = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkSpotifyConnection();
  }, []);

  const checkSpotifyConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("spotify_tokens")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setIsConnected(!!data && !error);
    } catch (err) {
      console.error("Error checking Spotify connection:", err);
    }
  };

  const handleMoodSelect = async (mood: Mood) => {
    setSelectedMood(mood);
    
    if (!isConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }

    setLoading(true);
    try {
      const data = await getRecommendations({ mood, limit: 20 });
      setRecommendations(data.tracks);
      toast.success(`Found ${data.tracks.length} recommendations!`);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!isConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }

    setLoading(true);
    try {
      const data = await searchTracks(searchQuery, 10);
      setSearchResults(data.tracks?.items || []);
      toast.success(`Found ${data.tracks?.items?.length || 0} tracks`);
    } catch (error) {
      console.error("Error searching:", error);
      toast.error("Failed to search tracks");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = async (trackId: string) => {
    setLoading(true);
    try {
      const data = await getRecommendations({ trackId, limit: 20 });
      setRecommendations(data.tracks);
      setSearchResults([]);
      toast.success(`Found ${data.tracks.length} similar tracks!`);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-28">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-card border border-primary/20">
              <Music className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Get Recommendations
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover new music based on your mood or favorite tracks
          </p>
        </div>

        {/* Tabs for Selection Mode */}
        <Tabs defaultValue="mood" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="mood">By Mood</TabsTrigger>
            <TabsTrigger value="song">By Song</TabsTrigger>
          </TabsList>

          {/* Mood-Based Selection */}
          <TabsContent value="mood" className="space-y-8">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-card">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                How are you feeling?
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  const isSelected = selectedMood === mood.value;
                  
                  return (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-glow-primary"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${mood.color}`} />
                      <p className="text-sm font-medium">{mood.label}</p>
                    </button>
                  );
                })}
              </div>

              {selectedMood && (
                <div className="mt-6 text-center">
                  <Button 
                    variant="hero" 
                    size="lg"
                    onClick={() => handleMoodSelect(selectedMood)}
                    disabled={loading}
                  >
                    {loading ? "Finding Music..." : "Find Music"}
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Song-Based Selection */}
          <TabsContent value="song" className="space-y-8">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-card">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Search for a song
              </h2>
              
              <div className="flex gap-4 max-w-2xl mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for songs or artists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
                <Button onClick={handleSearch} variant="hero" disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="mt-8">
                {searchResults.length > 0 ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Search Results</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((track) => (
                        <div key={track.id} onClick={() => handleTrackSelect(track.id)}>
                          <TrackCard track={track} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Search results will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recommendations Display */}
        {recommendations.length > 0 && (
          <div className="mt-12 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Your Recommendations
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </div>
        )}

        {/* Placeholder */}
        {recommendations.length === 0 && (
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="p-12 bg-card/30 backdrop-blur-sm border-border text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Ready to discover?</h3>
              <p className="text-muted-foreground">
                {isConnected 
                  ? "Select a mood or search for a song to get personalized recommendations" 
                  : "Connect your Spotify account to get started"}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
