-- Migration: Create Boards content management tables
-- Created: 2024
-- Description: Creates tables for Boards topics, content, and user progress tracking

-- Create sequences first (before tables that use them)
CREATE SEQUENCE IF NOT EXISTS boards_topics_id_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE SEQUENCE IF NOT EXISTS boards_content_id_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE SEQUENCE IF NOT EXISTS user_progress_id_seq
  AS integer
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Create boards_topics table
CREATE TABLE IF NOT EXISTS public.boards_topics (
  id integer NOT NULL DEFAULT nextval('boards_topics_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  icon character varying,
  color character varying,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT boards_topics_pkey PRIMARY KEY (id)
);

-- Set sequence ownership
ALTER SEQUENCE boards_topics_id_seq OWNED BY public.boards_topics.id;

-- Create boards_content table
CREATE TABLE IF NOT EXISTS public.boards_content (
  id integer NOT NULL DEFAULT nextval('boards_content_id_seq'::regclass),
  topic character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  pdf_url character varying,
  pdf_filename character varying,
  video_url character varying,
  content_type character varying DEFAULT 'pdf'::character varying CHECK (content_type::text = ANY (ARRAY['pdf'::character varying, 'video'::character varying, 'both'::character varying]::text[])),
  difficulty_level character varying DEFAULT 'medium'::character varying CHECK (difficulty_level::text = ANY (ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT boards_content_pkey PRIMARY KEY (id),
  CONSTRAINT boards_content_topic_fkey FOREIGN KEY (topic) REFERENCES public.boards_topics(name)
);

-- Set sequence ownership
ALTER SEQUENCE boards_content_id_seq OWNED BY public.boards_content.id;

-- Create user_progress table
CREATE TABLE IF NOT EXISTS public.user_progress (
  id integer NOT NULL DEFAULT nextval('user_progress_id_seq'::regclass),
  user_id uuid,
  content_id integer,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  time_spent integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_progress_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.boards_content(id) ON DELETE CASCADE,
  CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set sequence ownership
ALTER SEQUENCE user_progress_id_seq OWNED BY public.user_progress.id;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_boards_content_topic ON public.boards_content(topic);
CREATE INDEX IF NOT EXISTS idx_boards_content_content_type ON public.boards_content(content_type);
CREATE INDEX IF NOT EXISTS idx_boards_content_difficulty_level ON public.boards_content(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content_id ON public.user_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON public.user_progress(completed);

-- Enable Row Level Security (RLS) for better security
ALTER TABLE public.boards_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for boards_topics (public read access)
CREATE POLICY "Allow public read access to boards_topics"
  ON public.boards_topics
  FOR SELECT
  USING (true);

-- Create policies for boards_content (public read access)
CREATE POLICY "Allow public read access to boards_content"
  ON public.boards_content
  FOR SELECT
  USING (true);

-- Create policies for user_progress (users can only see their own progress)
CREATE POLICY "Users can view their own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.user_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_boards_topics_updated_at
  BEFORE UPDATE ON public.boards_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_content_updated_at
  BEFORE UPDATE ON public.boards_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

