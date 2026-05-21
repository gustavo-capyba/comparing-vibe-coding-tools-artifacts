
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','staff','user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nationality TEXT NOT NULL CHECK (nationality IN ('BR','US')),
  phone TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Sightings
CREATE TABLE public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_type TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed can view sightings" ON public.sightings FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own sightings" ON public.sightings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own sightings" ON public.sightings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own sightings" ON public.sightings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Emergency alerts
CREATE TABLE public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  message TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own alerts" ON public.emergency_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own alerts" ON public.emergency_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff update alerts" ON public.emergency_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'staff') OR public.has_role(auth.uid(),'admin'));

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  animal_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, animal_type)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own subs" ON public.subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime for sightings and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.sightings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
