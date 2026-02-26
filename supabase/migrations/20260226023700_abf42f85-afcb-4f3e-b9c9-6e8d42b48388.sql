
-- Users table (custom auth system)
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read users" ON public.users FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert users" ON public.users FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON public.users FOR UPDATE TO anon USING (true);
CREATE POLICY "Anyone can delete users" ON public.users FOR DELETE TO anon USING (true);

-- Seed admin user
INSERT INTO public.users (id, name, is_admin) VALUES ('123.com', 'Admin', true);

-- Chat rooms
CREATE TABLE public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  open_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chat_rooms" ON public.chat_rooms FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert chat_rooms" ON public.chat_rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can delete chat_rooms" ON public.chat_rooms FOR DELETE TO anon USING (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chat_messages" ON public.chat_messages FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert chat_messages" ON public.chat_messages FOR INSERT TO anon WITH CHECK (true);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- User joined rooms
CREATE TABLE public.user_joined_rooms (
  user_id TEXT NOT NULL,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, room_id)
);

ALTER TABLE public.user_joined_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user_joined_rooms" ON public.user_joined_rooms FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert user_joined_rooms" ON public.user_joined_rooms FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can delete user_joined_rooms" ON public.user_joined_rooms FOR DELETE TO anon USING (true);

-- Calendar spaces
CREATE TABLE public.calendar_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  open_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read calendar_spaces" ON public.calendar_spaces FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert calendar_spaces" ON public.calendar_spaces FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can delete calendar_spaces" ON public.calendar_spaces FOR DELETE TO anon USING (true);

-- Schedules
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.calendar_spaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read schedules" ON public.schedules FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert schedules" ON public.schedules FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can delete schedules" ON public.schedules FOR DELETE TO anon USING (true);

-- User joined calendars
CREATE TABLE public.user_joined_calendars (
  user_id TEXT NOT NULL,
  calendar_id UUID NOT NULL REFERENCES public.calendar_spaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, calendar_id)
);

ALTER TABLE public.user_joined_calendars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read user_joined_calendars" ON public.user_joined_calendars FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert user_joined_calendars" ON public.user_joined_calendars FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can delete user_joined_calendars" ON public.user_joined_calendars FOR DELETE TO anon USING (true);

-- Notices
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notices" ON public.notices FOR SELECT TO anon USING (true);
CREATE POLICY "Anyone can insert notices" ON public.notices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone can update notices" ON public.notices FOR UPDATE TO anon USING (true);
CREATE POLICY "Anyone can delete notices" ON public.notices FOR DELETE TO anon USING (true);
