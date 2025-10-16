import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import TrackCard from "@/components/TrackCard";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { getRecommendations, searchTracks } from "@/lib/spotify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Recommendations = () => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("");

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

  const loadMoodRecommendations = async (mood: string) => {
    if (!isConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }

    setLoading(true);
    setSelectedMood(mood);
    try {
      const data = await getRecommendations({ mood, limit: 20 });
      setTracks(data.tracks || []);
      toast.success(`Found ${data.tracks?.length || 0} tracks for ${mood} mood`);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast.error("Failed to load recommendations");
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your Spotify account first");
      return;
    }

    setLoading(true);
    setSelectedMood("");
    try {
      const data = await searchTracks(searchQuery, 20);
      setTracks(data.tracks?.items || []);
      toast.success(`Found ${data.tracks?.items?.length || 0} tracks`);
    } catch (error) {
      console.error("Error searching tracks:", error);
      toast.error("Failed to search tracks");
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const moods = [
    { value: "happy", label: "Happy" },
    { value: "energetic", label: "Energetic" },
    { value: "chill", label: "Chill" },
    { value: "sad", label: "Sad" },
    { value: "romantic", label: "Romantic" },
  ];

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
            Discover Music
          </h1>
          <p className="text-muted-foreground text-lg">
            Search tracks or discover music by mood using Spotify
          </p>
        </div>

        {/* Filters and Search */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border shadow-card">
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by track, artist, or album..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-background/50 border-border"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  Search
                </Button>
              </div>

              {/* Mood Filters */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Or discover by mood:</p>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={selectedMood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => loadMoodRecommendations(mood.value)}
                      disabled={loading}
                    >
                      {mood.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Spotify Player */}
        {isConnected && selectedTrackUri && (
          <div className="mt-8 mb-12 max-w-2xl mx-auto">
            <SpotifyPlayer trackUri={selectedTrackUri} />
          </div>
        )}

        {/* Tracks Grid */}
        {loading ? (
          <div className="text-center">
            <p className="text-muted-foreground">Loading tracks...</p>
          </div>
        ) : tracks.length > 0 ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {tracks.length} Track{tracks.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    if (!isConnected) {
                      toast.error("Please connect your Spotify account first");
                      return;
                    }
                    setSelectedTrackUri(track.uri);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <TrackCard track={track} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="p-12 bg-card/30 backdrop-blur-sm border-border text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Ready to discover music</h3>
              <p className="text-muted-foreground">
                {isConnected
                  ? "Search for tracks or select a mood to get started"
                  : "Connect your Spotify account to start streaming"}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
