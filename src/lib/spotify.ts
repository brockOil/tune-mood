import { supabase } from "@/integrations/supabase/client";

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_CLIENT_ID = "d4e814ec1a9b4cc499a1ca754c3def70";
const REDIRECT_URI = `${window.location.origin}/callback`;

// Generate code verifier and challenge for PKCE
const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const getSpotifyAuthUrl = async () => {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Store code verifier for token exchange
  localStorage.setItem('code_verifier', codeVerifier);

  const scopes = [
    "user-read-private",
    "user-read-email",
    "user-top-read",
    "user-library-read",
    "playlist-read-private",
    "user-read-recently-played",
    "streaming",
    "user-read-playback-state",
    "user-modify-playback-state",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: scopes,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    show_dialog: "true",
  });

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No active session");
  }

  const codeVerifier = localStorage.getItem('code_verifier');
  if (!codeVerifier) {
    throw new Error("No code verifier found");
  }

  const { data, error } = await supabase.functions.invoke("spotify-auth", {
    body: {
      code,
      redirectUri: REDIRECT_URI,
      codeVerifier,
    },
  });

  // Clear code verifier after use
  localStorage.removeItem('code_verifier');

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
