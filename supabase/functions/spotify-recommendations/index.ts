import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mood to Spotify audio features mapping
const moodFeatures: Record<string, any> = {
  happy: {
    target_valence: 0.8,
    target_energy: 0.7,
    target_danceability: 0.7,
  },
  energetic: {
    target_valence: 0.7,
    target_energy: 0.9,
    target_danceability: 0.8,
  },
  chill: {
    target_valence: 0.5,
    target_energy: 0.3,
    target_danceability: 0.4,
  },
  sad: {
    target_valence: 0.2,
    target_energy: 0.3,
    target_danceability: 0.3,
  },
  romantic: {
    target_valence: 0.6,
    target_energy: 0.4,
    target_danceability: 0.5,
  },
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, trackId, limit = 20 } = await req.json();

    console.log('Recommendations request:', { mood, trackId, limit });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Failed to get authenticated user');
    }

    // Get user's Spotify tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('spotify_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Spotify not connected. Please authenticate first.');
    }

    // Check if token is expired
    let accessToken = tokenData.access_token;
    if (Date.now() >= tokenData.expires_at) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(tokenData.refresh_token);
      
      // Update token in database
      await supabase
        .from('spotify_tokens')
        .update({
          access_token: accessToken,
          expires_at: Date.now() + (3600 * 1000),
        })
        .eq('user_id', user.id);
    }

    // Build recommendations query
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (mood && moodFeatures[mood]) {
      // Add mood-based features
      Object.entries(moodFeatures[mood]).forEach(([key, value]) => {
        params.append(key, String(value));
      });

      // Get user's top tracks as seed
      const topTracksResponse = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (topTracksResponse.ok) {
        const topTracks = await topTracksResponse.json();
        console.log('Top tracks fetched:', topTracks.items?.length || 0);
        if (topTracks.items && topTracks.items.length > 0) {
          const seedTracks = topTracks.items
            .slice(0, 2)
            .map((t: any) => t.id)
            .join(',');
          params.append('seed_tracks', seedTracks);
          console.log('Using seed tracks:', seedTracks);
        }
      } else {
        console.log('Top tracks request failed:', topTracksResponse.status);
      }

      // Add seed genres based on mood
      const moodGenres: Record<string, string> = {
        happy: 'pop,dance,indie',
        energetic: 'electronic,rock,workout',
        chill: 'ambient,acoustic,lo-fi',
        sad: 'indie,alternative,soul',
        romantic: 'r-n-b,soul,indie',
      };

      if (moodGenres[mood]) {
        params.append('seed_genres', moodGenres[mood]);
      }
    } else if (trackId) {
      // Track-based recommendations
      params.append('seed_tracks', trackId);
    } else {
      throw new Error('Either mood or trackId is required');
    }

    // Log the final request URL for debugging
    const requestUrl = `https://api.spotify.com/v1/recommendations?${params.toString()}`;
    console.log('Spotify API Request URL:', requestUrl);

    // Get recommendations from Spotify
    const recommendationsResponse = await fetch(requestUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Spotify API Response Status:', recommendationsResponse.status);

    if (!recommendationsResponse.ok) {
      const errorData = await recommendationsResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Spotify recommendations failed with status:', recommendationsResponse.status);
      console.error('Spotify error details:', JSON.stringify(errorData));
      throw new Error(`Spotify API error: ${JSON.stringify(errorData)}`);
    }

    const recommendations = await recommendationsResponse.json();
    console.log(`Found ${recommendations.tracks?.length || 0} recommendations`);

    return new Response(
      JSON.stringify({ tracks: recommendations.tracks }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in spotify-recommendations:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
