import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, LogOut, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getSpotifyAuthUrl } from "@/lib/spotify";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setUser(authUser);

      const { data, error } = await supabase
        .from("spotify_tokens")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setIsAuthenticated(!!data && !error);
    } catch (err) {
      console.error("Error checking auth:", err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = async () => {
    const authUrl = await getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from("spotify_tokens")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setIsAuthenticated(false);
      toast.success("Disconnected from Spotify");
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark">
        <Navbar />
        <div className="container mx-auto px-4 py-12 pt-28">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      <div className="container mx-auto px-4 py-12 pt-28">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-card border border-primary/20">
                <User className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground">Manage your MoodTune account</p>
          </div>

          {!isAuthenticated ? (
            <Card className="p-12 bg-card/50 backdrop-blur-sm border-border shadow-card text-center">
              <Music className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-2xl font-semibold mb-4">Connect to Spotify</h2>
              <p className="text-muted-foreground mb-8">
                Sign in with your Spotify account to access personalized recommendations and save your preferences.
              </p>
              <Button variant="hero" size="lg" onClick={handleConnectSpotify}>
                Connect Spotify Account
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* User Info Card */}
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-card">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{user?.email || "User"}</h2>
                    <p className="text-muted-foreground">Connected to Spotify</p>
                  </div>
                </div>
              </Card>

              {/* Stats Card */}
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-card">
                <h3 className="text-xl font-semibold mb-6">Your Activity</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">42</p>
                    <p className="text-sm text-muted-foreground">Playlists</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-secondary">128</p>
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-accent">8</p>
                    <p className="text-sm text-muted-foreground">Saved Tracks</p>
                  </div>
                </div>
              </Card>

              {/* Actions Card */}
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-border shadow-card">
                <h3 className="text-xl font-semibold mb-6">Account Actions</h3>
                <div className="space-y-4">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    size="lg"
                    onClick={handleDisconnect}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Disconnect Spotify
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
