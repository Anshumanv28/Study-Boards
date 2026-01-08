// Service for interacting with Boards database tables
import { supabase } from "../lib/supabase";

/**
 * Get Edge Function URL for watermarking
 */
function getEdgeFunctionUrl(): string {
  const functionsUrl =
    process.env.REACT_APP_SUPABASE_FUNCTIONS_URL ||
    process.env.REACT_APP_SUPABASE_URL?.replace(
      ".supabase.co",
      ".functions.supabase.co"
    ) ||
    "https://xbrtqfisytoamfvdmqkp.functions.supabase.co";
  return `${functionsUrl}/watermark-pdf`;
}

/**
 * Convert PDF URL to Edge Function URL format for watermarking
 * All PDFs are watermarked via Edge Function
 */
async function convertToWatermarkedUrl(
  pdfUrl: string | null
): Promise<string | null> {
  if (!pdfUrl) return null;

  try {
    // Always use Edge Function for watermarking
    const edgeFunctionUrl = getEdgeFunctionUrl();
    return `edge-function:${edgeFunctionUrl}:${pdfUrl}`;
  } catch (error) {
    console.error("Error converting to watermarked URL:", error);
    return null;
  }
}

// TypeScript types matching the database schema
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

class BoardsDatabaseService {
  /**
   * Get all topics from the database
   */
  async getTopics(): Promise<BoardsTopic[]> {
    try {
      const { data, error } = await supabase
        .from("boards_topics")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching topics:", error);
      return [];
    }
  }

  /**
   * Get a single topic by name
   */
  async getTopicByName(name: string): Promise<BoardsTopic | null> {
    try {
      const { data, error } = await supabase
        .from("boards_topics")
        .select("*")
        .eq("name", name)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching topic:", error);
      return null;
    }
  }

  /**
   * Get all content for a specific topic
   */
  async getContentByTopic(topicName: string): Promise<BoardsContent[]> {
    try {
      const { data, error } = await supabase
        .from("boards_content")
        .select("*")
        .eq("topic", topicName)
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching content:", error);
      return [];
    }
  }

  /**
   * Get content by ID
   */
  async getContentById(id: number): Promise<BoardsContent | null> {
    try {
      const { data, error } = await supabase
        .from("boards_content")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching content:", error);
      return null;
    }
  }

  /**
   * Get content filtered by type
   */
  async getContentByType(
    topicName: string,
    contentType: "pdf" | "video" | "both"
  ): Promise<BoardsContent[]> {
    try {
      const { data, error } = await supabase
        .from("boards_content")
        .select("*")
        .eq("topic", topicName)
        .or(`content_type.eq.${contentType},content_type.eq.both`)
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching content by type:", error);
      return [];
    }
  }

  /**
   * Get user progress for a specific content item
   */
  async getUserProgress(
    userId: string,
    contentId: number
  ): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("content_id", contentId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return null;
    }
  }

  /**
   * Get all progress for a user
   */
  async getUserProgressAll(userId: string): Promise<UserProgress[]> {
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching user progress:", error);
      return [];
    }
  }

  /**
   * Create or update user progress
   */
  async upsertUserProgress(
    userId: string,
    contentId: number,
    progress: {
      completed?: boolean;
      completed_at?: string | null;
      time_spent?: number;
    }
  ): Promise<UserProgress | null> {
    try {
      // First check if progress exists
      const existing = await this.getUserProgress(userId, contentId);

      if (existing) {
        // Update existing progress
        const { data, error } = await supabase
          .from("user_progress")
          .update({
            ...progress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            content_id: contentId,
            completed: progress.completed || false,
            completed_at: progress.completed_at || null,
            time_spent: progress.time_spent || 0,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error("Error upserting user progress:", error);
      return null;
    }
  }

  /**
   * Mark content as completed
   */
  async markAsCompleted(
    userId: string,
    contentId: number
  ): Promise<UserProgress | null> {
    return this.upsertUserProgress(userId, contentId, {
      completed: true,
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Update time spent on content
   */
  async updateTimeSpent(
    userId: string,
    contentId: number,
    additionalSeconds: number
  ): Promise<UserProgress | null> {
    const existing = await this.getUserProgress(userId, contentId);
    const currentTimeSpent = existing?.time_spent || 0;

    return this.upsertUserProgress(userId, contentId, {
      time_spent: currentTimeSpent + additionalSeconds,
    });
  }

  /**
   * Get content with user progress
   * PDF URLs are converted to Edge Function URLs for watermarking (all PDFs are watermarked)
   */
  async getContentWithProgress(
    topicName: string,
    userId: string | null
  ): Promise<(BoardsContent & { progress: UserProgress | null; watermarkedPdfUrl?: string | null })[]> {
    try {
      const content = await this.getContentByTopic(topicName);

      // Get all progress for this user (if authenticated)
      let progressMap = new Map<number, UserProgress>();
      if (userId) {
        const progressList = await this.getUserProgressAll(userId);
        progressMap = new Map(progressList.map((p) => [p.content_id, p]));
      }

      // Convert PDF URLs to watermarked URLs (all PDFs go through Edge Function)
      const contentWithProgress = await Promise.all(
        content.map(async (item) => {
          const watermarkedPdfUrl =
            item.pdf_url && (item.content_type === "pdf" || item.content_type === "both")
              ? await convertToWatermarkedUrl(item.pdf_url)
              : null;

          return {
            ...item,
            progress: progressMap.get(item.id) || null,
            watermarkedPdfUrl,
          };
        })
      );

      return contentWithProgress;
    } catch (error) {
      console.error("Error fetching content with progress:", error);
      return [];
    }
  }
}

export const boardsDatabaseService = new BoardsDatabaseService();
