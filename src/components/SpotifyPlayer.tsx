import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

interface SpotifyPlayerProps {
  trackUri?: string;
}

const SpotifyPlayer = ({ trackUri }: SpotifyPlayerProps) => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isReady, setIsReady] = useState(false);
  const accessTokenRef = useRef<string>("");

  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tokenData } = await supabase
          .from("spotify_tokens")
          .select("access_token")
          .eq("user_id", user.id)
          .single();

        if (!tokenData?.access_token) {
          toast.error("No Spotify access token found");
          return;
        }

        accessTokenRef.current = tokenData.access_token;

        // Load Spotify SDK
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          const spotifyPlayer = new window.Spotify.Player({
            name: "MoodTune Web Player",
            getOAuthToken: (cb: (token: string) => void) => {
              cb(accessTokenRef.current);
            },
            volume: 0.5,
          });

          // Error handling
          spotifyPlayer.addListener("initialization_error", ({ message }: any) => {
            console.error("Initialization error:", message);
            toast.error("Failed to initialize player");
          });

          spotifyPlayer.addListener("authentication_error", ({ message }: any) => {
            console.error("Authentication error:", message);
            toast.error("Authentication failed. Please reconnect Spotify.");
          });

          spotifyPlayer.addListener("account_error", ({ message }: any) => {
            console.error("Account error:", message);
            toast.error("Account error. Spotify Premium required.");
          });

          spotifyPlayer.addListener("playback_error", ({ message }: any) => {
            console.error("Playback error:", message);
          });

          // Player state updates
          spotifyPlayer.addListener("player_state_changed", (state: any) => {
            if (!state) return;

            setCurrentTrack(state.track_window.current_track);
            setIsPaused(state.paused);
            setPosition(state.position);
            setDuration(state.duration);
          });

          // Ready
          spotifyPlayer.addListener("ready", ({ device_id }: any) => {
            console.log("Ready with Device ID", device_id);
            setDeviceId(device_id);
            setIsReady(true);
            toast.success("Spotify player ready!");
          });

          // Not Ready
          spotifyPlayer.addListener("not_ready", ({ device_id }: any) => {
            console.log("Device ID has gone offline", device_id);
            setIsReady(false);
          });

          // Connect to the player
          spotifyPlayer.connect();
          setPlayer(spotifyPlayer);
        };
      } catch (error) {
        console.error("Error initializing player:", error);
        toast.error("Failed to initialize Spotify player");
      }
    };

    initializePlayer();

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (trackUri && deviceId && accessTokenRef.current) {
      playTrack(trackUri);
    }
  }, [trackUri, deviceId]);

  const playTrack = async (uri: string) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          body: JSON.stringify({ uris: [uri] }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessTokenRef.current}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to play track");
      }
    } catch (error) {
      console.error("Error playing track:", error);
      toast.error("Failed to play track");
    }
  };

  const togglePlay = () => {
    player?.togglePlay();
  };

  const skipToNext = () => {
    player?.nextTrack();
  };

  const skipToPrevious = () => {
    player?.previousTrack();
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    player?.setVolume(newVolume / 100);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isReady) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm border-border">
        <p className="text-sm text-muted-foreground text-center">
          Initializing Spotify player...
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border shadow-card">
      <div className="space-y-4">
        {/* Current Track Info */}
        {currentTrack && (
          <div className="flex items-center gap-4">
            <img
              src={currentTrack.album.images[0]?.url}
              alt={currentTrack.name}
              className="w-16 h-16 rounded-lg shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{currentTrack.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artists.map((a: any) => a.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[position]}
            max={duration}
            step={1000}
            className="cursor-pointer"
            disabled
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={skipToPrevious}
            className="hover:bg-primary/10"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full shadow-glow-primary"
          >
            {isPaused ? (
              <Play className="w-6 h-6 ml-1" />
            ) : (
              <Pause className="w-6 h-6" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={skipToNext}
            className="hover:bg-primary/10"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-sm text-muted-foreground w-10 text-right">
            {volume}%
          </span>
        </div>
      </div>
    </Card>
  );
};

export default SpotifyPlayer;
