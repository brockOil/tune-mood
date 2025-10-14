import { supabase } from "@/integrations/supabase/client";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
// TODO: Replace with your actual Spotify Client ID
const SPOTIFY_CLIENT_ID = "d4e814ec1a9b4cc499a1ca754c3def70";
const REDIRECT_URI = `${window.location.origin}/callback`;

export const getSpotifyAuthUrl = () => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-library-read",
    "playlist-read-private",
    "user-read-recently-played",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No active session");
  }

  const { data, error } = await supabase.functions.invoke("spotify-auth", {
    body: {
      code,
      redirectUri: REDIRECT_URI,
    },
  });

  if (error) throw error;
  return data;
};

export const getRecommendations = async (params: {
  mood?: string;
  trackId?: string;
  limit?: number;
}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No active session");
  }

  const { data, error } = await supabase.functions.invoke(
    "spotify-recommendations",
    {
      body: params,
    }
  );

  if (error) throw error;
  return data;
};

export const searchTracks = async (query: string, limit: number = 10) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No active session");
  }

  const { data, error } = await supabase.functions.invoke("spotify-search", {
    body: {
      query,
      type: "track",
      limit,
    },
  });

  if (error) throw error;
  return data;
};
