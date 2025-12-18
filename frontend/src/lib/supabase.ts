import { createClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://xbrtqfisytoamfvdmqkp.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicnRxZmlzeXRvYW1mdmRtcWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTE0MjQsImV4cCI6MjA4MTU2NzQyNH0.dxu8wxEv1bHJmJGKV7FdOfIpRbfPHRV5iJxnWWg06uQ";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth types
export interface AuthState {
  user: any | null;
  loading: boolean;
}

// Database types (matching the schema)
export interface BoardsTopic {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BoardsContent {
  id: number;
  topic: string;
  title: string;
  description: string | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  video_url: string | null;
  content_type: "pdf" | "video" | "both";
  difficulty_level: "easy" | "medium" | "hard";
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: number;
  user_id: string;
  content_id: number;
  completed: boolean;
  completed_at: string | null;
  time_spent: number;
  created_at: string;
  updated_at: string;
}
