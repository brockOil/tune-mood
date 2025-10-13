import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken } from "@/lib/spotify";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Authentication cancelled or failed");
      toast.error("Authentication failed");
      setTimeout(() => navigate("/profile"), 2000);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      toast.error("Authentication failed");
      setTimeout(() => navigate("/profile"), 2000);
      return;
    }

    const handleCallback = async () => {
      try {
        await exchangeCodeForToken(code);
        toast.success("Successfully connected to Spotify!");
        navigate("/profile");
      } catch (err) {
        console.error("Error exchanging code:", err);
        setError(err instanceof Error ? err.message : "Failed to connect");
        toast.error("Failed to connect to Spotify");
        setTimeout(() => navigate("/profile"), 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-destructive text-xl mb-4">{error}</div>
            <p className="text-muted-foreground">Redirecting...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connecting to Spotify</h2>
            <p className="text-muted-foreground">Please wait...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Callback;
