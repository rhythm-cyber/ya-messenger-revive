-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'invisible', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'public' CHECK (type IN ('public', 'private')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'state', 'language', 'interest')),
  avatar_url TEXT,
  max_members INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'image', 'file', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  reply_to UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create room_members table
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE,
  UNIQUE(room_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for rooms
CREATE POLICY "Public rooms are viewable by everyone" ON public.rooms
  FOR SELECT USING (type = 'public' OR id IN (
    SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON public.rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their rooms or direct messages" ON public.messages
  FOR SELECT USING (
    (room_id IS NOT NULL AND room_id IN (
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )) OR
    (room_id IS NULL AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
  );

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're involved in" ON public.friendships
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policies for room_members
CREATE POLICY "Users can view room memberships" ON public.room_members
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can join rooms" ON public.room_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" ON public.room_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rooms for Indian states and languages
INSERT INTO public.rooms (name, description, category, type) VALUES
  ('General Chat', 'Welcome to the general chat room', 'general', 'public'),
  ('Andhra Pradesh', 'Chat room for Andhra Pradesh residents', 'state', 'public'),
  ('Assam', 'Chat room for Assam residents', 'state', 'public'),
  ('Bihar', 'Chat room for Bihar residents', 'state', 'public'),
  ('Gujarat', 'Chat room for Gujarat residents', 'state', 'public'),
  ('Karnataka', 'Chat room for Karnataka residents', 'state', 'public'),
  ('Kerala', 'Chat room for Kerala residents', 'state', 'public'),
  ('Maharashtra', 'Chat room for Maharashtra residents', 'state', 'public'),
  ('Tamil Nadu', 'Chat room for Tamil Nadu residents', 'state', 'public'),
  ('West Bengal', 'Chat room for West Bengal residents', 'state', 'public'),
  ('Delhi', 'Chat room for Delhi residents', 'state', 'public'),
  ('Hindi', 'हिंदी भाषा चैट रूम', 'language', 'public'),
  ('English', 'English language chat room', 'language', 'public'),
  ('Tamil', 'தமிழ் மொழி அரட்டை அறை', 'language', 'public'),
  ('Telugu', 'తెలుగు భాష చాట్ రూమ్', 'language', 'public'),
  ('Bengali', 'বাংলা ভাষার চ্যাট রুম', 'language', 'public'),
  ('Marathi', 'मराठी भाषा चॅट रूम', 'language', 'public'),
  ('Gujarati', 'ગુજરાતી ભાષા ચેટ રૂમ', 'language', 'public'),
  ('Kannada', 'ಕನ್ನಡ ಭಾಷಾ ಚಾಟ್ ರೂಮ್', 'language', 'public'),
  ('Malayalam', 'മലയാളം ഭാഷാ ചാറ്റ് റൂം', 'language', 'public'),
  ('Punjabi', 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਚੈਟ ਰੂਮ', 'language', 'public');

-- Create indexes for better performance
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.rooms REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.friendships REPLICA IDENTITY FULL;
ALTER TABLE public.room_members REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;