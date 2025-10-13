import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TrackCardProps {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    preview_url?: string;
    external_urls: {
      spotify: string;
    };
  };
}

const TrackCard = ({ track }: TrackCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track.preview_url) {
      audioRef.current = new Audio(track.preview_url);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.preview_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const albumImage = track.album.images[0]?.url || "/placeholder.svg";
  const artistNames = track.artists.map((a) => a.name).join(", ");

  return (
    <Card className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary">
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={albumImage}
          alt={`${track.album.name} cover`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play Button Overlay */}
        {track.preview_url && (
          <Button
            onClick={togglePlay}
            variant="hero"
            size="icon"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 w-14 h-14 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </Button>
        )}
      </div>

      {/* Track Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
          {track.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 truncate">
          {artistNames}
        </p>
        <p className="text-xs text-muted-foreground mb-4 truncate">
          {track.album.name}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(track.external_urls.spotify, "_blank")}
            variant="outline"
            size="sm"
            className="flex-1 border-primary/50 hover:border-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Spotify
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TrackCard;
