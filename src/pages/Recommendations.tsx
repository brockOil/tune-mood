import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import TrackCard from "@/components/TrackCard";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Recommendations = () => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTrackUri, setSelectedTrackUri] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    checkSpotifyConnection();
    loadTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchQuery, selectedFilter]);

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

  const loadTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTracks(data || []);
      toast.success(`Loaded ${data?.length || 0} tracks`);
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = tracks;

    // Filter by mood
    if (selectedFilter !== "all") {
      filtered = filtered.filter((track) => track.mood === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (track) =>
          track.name.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album.toLowerCase().includes(query)
      );
    }

    setFilteredTracks(filtered);
  };

  const moods = [
    { value: "all", label: "All Tracks" },
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
            Music Library
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse and stream your favorite tracks
          </p>
        </div>

        {/* Filters and Search */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border shadow-card">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by track, artist, or album..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>

              {/* Mood Filters */}
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.value}
                    variant={selectedFilter === mood.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(mood.value)}
                  >
                    {mood.label}
                  </Button>
                ))}
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
        ) : filteredTracks.length > 0 ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {filteredTracks.length} Track{filteredTracks.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    if (!isConnected) {
                      toast.error("Please connect your Spotify account first");
                      return;
                    }
                    setSelectedTrackUri(track.spotify_uri);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <TrackCard
                    track={{
                      id: track.spotify_id,
                      name: track.name,
                      artists: [{ name: track.artist }],
                      album: {
                        name: track.album,
                        images: track.album_art_url
                          ? [{ url: track.album_art_url }]
                          : [],
                      },
                      preview_url: track.preview_url,
                      external_urls: {
                        spotify: `https://open.spotify.com/track/${track.spotify_id}`,
                      },
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="p-12 bg-card/30 backdrop-blur-sm border-border text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : isConnected
                  ? "The music library is empty"
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
