-- Create tracks table to store music
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL,
  album_art_url TEXT,
  preview_url TEXT,
  spotify_uri TEXT NOT NULL,
  duration_ms INTEGER,
  genre TEXT,
  mood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Create policies - tracks are viewable by everyone
CREATE POLICY "Tracks are viewable by everyone" 
ON public.tracks 
FOR SELECT 
USING (true);

-- Only authenticated users can add tracks
CREATE POLICY "Authenticated users can add tracks" 
ON public.tracks 
FOR INSERT 
WITH CHECK (auth.uid() = added_by);

-- Users can update tracks they added
CREATE POLICY "Users can update their own tracks" 
ON public.tracks 
FOR UPDATE 
USING (auth.uid() = added_by);

-- Users can delete tracks they added
CREATE POLICY "Users can delete their own tracks" 
ON public.tracks 
FOR DELETE 
USING (auth.uid() = added_by);

-- Create indexes for better performance
CREATE INDEX idx_tracks_mood ON public.tracks(mood);
CREATE INDEX idx_tracks_genre ON public.tracks(genre);
CREATE INDEX idx_tracks_spotify_id ON public.tracks(spotify_id);

-- Insert some sample tracks (popular songs with valid Spotify URIs)
INSERT INTO public.tracks (spotify_id, name, artist, album, album_art_url, spotify_uri, duration_ms, genre, mood) VALUES
('3n3Ppam7vgaVa1iaRUc9Lp', 'Mr. Brightside', 'The Killers', 'Hot Fuss', 'https://i.scdn.co/image/ab67616d0000b273ccdddd46119a4ff53eaf1f5d', 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp', 222973, 'rock', 'energetic'),
('0VjIjW4GlUZAMYd2vXMi3b', 'Blinding Lights', 'The Weeknd', 'After Hours', 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b', 200040, 'pop', 'happy'),
('7qiZfU4dY1lWllzX7mPBI', 'Shape of You', 'Ed Sheeran', '÷ (Deluxe)', 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96', 'spotify:track:7qiZfU4dY1lWllzX7mPBI', 233713, 'pop', 'happy'),
('3WMj8moIAXJhHsyLaqIIHI', 'Levitating', 'Dua Lipa', 'Future Nostalgia', 'https://i.scdn.co/image/ab67616d0000b273be841ba4bc24340152e3a79a', 'spotify:track:3WMj8moIAXJhHsyLaqIIHI', 203064, 'pop', 'happy'),
('2takcwOaAZWiXQijPHIx7B', 'Time', 'Pink Floyd', 'The Dark Side of the Moon', 'https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe', 'spotify:track:2takcwOaAZWiXQijPHIx7B', 413947, 'rock', 'chill'),
('4cOdK2wGLETKBW3PvgPWqT', 'Smells Like Teen Spirit', 'Nirvana', 'Nevermind', 'https://i.scdn.co/image/ab67616d0000b2732d81f491319b86356eb10c4e', 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', 301920, 'rock', 'energetic'),
('0nJW01T7XtvILxQgC5J7Wh', 'Someone Like You', 'Adele', '21', 'https://i.scdn.co/image/ab67616d0000b273372eb17991b31e30867bc4b5', 'spotify:track:0nJW01T7XtvILxQgC5J7Wh', 285000, 'pop', 'sad'),
('5CtI0qwDJkDQGwXD1H1cLb', 'Wonderwall', 'Oasis', '(What''s The Story) Morning Glory?', 'https://i.scdn.co/image/ab67616d0000b273b3f8613d86456bdc8f05c5cc', 'spotify:track:5CtI0qwDJkDQGwXD1H1cLb', 258626, 'rock', 'chill');