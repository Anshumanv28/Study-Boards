// AWS S3-compatible PDF service for Supabase Storage
// This service uses the AWS SDK with your S3 credentials

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3File {
  name: string;
  size: number;
  lastModified: string;
  url: string;
  key: string;
  type: "pdf" | "docx";
  extension: string;
}

// Keep the old interface for backward compatibility
export interface S3PDFFile extends S3File {
  type: "pdf";
}

export interface S3TopicResponse {
  pdfs: S3PDFFile[];
  totalCount: number;
}

class AWSS3PDFService {
  // Get S3 credentials from environment variables with fallback for development
  private readonly BUCKET_NAME =
    process.env.REACT_APP_S3_BUCKET_NAME || "Boards-study";
  private readonly REGION = process.env.REACT_APP_S3_REGION || "ap-northeast-1";
  private readonly ENDPOINT =
    process.env.REACT_APP_S3_ENDPOINT ||
    "https://xbrtqfisytoamfvdmqkp.storage.supabase.co/storage/v1/s3";
  private readonly ACCESS_KEY_ID =
    process.env.REACT_APP_S3_ACCESS_KEY_ID ||
    "51cc7043f78bc0fa857aee4ad1aa7800";
  private readonly SECRET_ACCESS_KEY =
    process.env.REACT_APP_S3_SECRET_ACCESS_KEY ||
    "01ed1b2665e17714c2d7cad641b60ec93dfee3aa48b8f204753f4c38cda2b622";

  private s3Client: S3Client;

  constructor() {
    // Warn if using fallback values (development mode)
    if (
      !process.env.REACT_APP_S3_ACCESS_KEY_ID ||
      !process.env.REACT_APP_S3_SECRET_ACCESS_KEY
    ) {
      console.warn(
        "Using fallback S3 credentials. Set REACT_APP_S3_ACCESS_KEY_ID and REACT_APP_S3_SECRET_ACCESS_KEY for production."
      );
    }

    this.s3Client = new S3Client({
      region: this.REGION,
      endpoint: this.ENDPOINT,
      credentials: {
        accessKeyId: this.ACCESS_KEY_ID,
        secretAccessKey: this.SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for Supabase S3-compatible storage
    });
  }

  /**
   * Get all files (PDFs and DOCX) from S3 storage for a specific topic
   */
  async getFilesByTopic(topic: string): Promise<S3File[]> {
    try {
      console.log(
        `Fetching files for topic: ${topic} from S3 bucket: ${this.BUCKET_NAME}`
      );

      const command = new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
        Prefix: `${topic}/`,
        MaxKeys: 100,
      });

      const response = await this.s3Client.send(command);

      if (!response.Contents || response.Contents.length === 0) {
        console.log(`No files found for topic: ${topic}`);
        return [];
      }

      // Filter for PDF and DOCX files and format the response
      const files: S3File[] = [];

      for (const obj of response.Contents) {
        if (
          obj.Key &&
          (obj.Key.toLowerCase().endsWith(".pdf") ||
            obj.Key.toLowerCase().endsWith(".docx"))
        ) {
          const fileName = obj.Key.split("/").pop() || "";
          const extension = fileName.split(".").pop()?.toLowerCase() || "";
          const fileType = extension === "pdf" ? "pdf" : "docx";

          try {
            // For PDFs, use watermarking for authenticated users
            // For DOCX, use regular signed URL (watermarking not fully implemented)
            const useWatermark = fileType === "pdf";
            const signedUrl = await this.getSignedUrl(obj.Key, useWatermark);

            files.push({
              name: fileName,
              url: signedUrl,
              size: obj.Size || 0,
              lastModified:
                obj.LastModified?.toISOString() || new Date().toISOString(),
              key: obj.Key,
              type: fileType,
              extension: extension,
            });
          } catch (urlError) {
            console.error(
              `Error generating signed URL for ${obj.Key}:`,
              urlError
            );
            // Still include the file but without URL
            files.push({
              name: fileName,
              url: "",
              size: obj.Size || 0,
              lastModified:
                obj.LastModified?.toISOString() || new Date().toISOString(),
              key: obj.Key,
              type: fileType,
              extension: extension,
            });
          }
        }
      }

      console.log(`Found ${files.length} files for topic: ${topic}`);
      console.log("Files breakdown:", {
        total: files.length,
        pdfs: files.filter((f) => f.type === "pdf").length,
        docx: files.filter((f) => f.type === "docx").length,
      });
      console.log(
        "All files:",
        files.map((f) => `${f.name} (${f.type})`)
      );
      return files;
    } catch (error) {
      console.error("Error fetching files from S3:", error);
      return [];
    }
  }

  /**
   * Get all PDFs from S3 storage for a specific topic (backward compatibility)
   */
  async getPDFsByTopic(topic: string): Promise<S3PDFFile[]> {
    const allFiles = await this.getFilesByTopic(topic);
    return allFiles.filter((file) => file.type === "pdf") as S3PDFFile[];
  }

  /**
   * Get all topics with PDFs or DOCX files from S3 storage
   */
  async getTopicsWithPDFs(): Promise<string[]> {
    try {
      console.log("Fetching topics from S3 bucket...");

      const command = new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
        Delimiter: "/",
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);

      if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
        return [];
      }

      // Extract topic names from prefixes and filter for topics that have PDFs or DOCX files
      const topics: string[] = [];
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          const topic = prefix.Prefix.replace("/", ""); // Remove trailing slash
          if (topic) {
            // Check if this topic has any files (PDFs or DOCX)
            const files = await this.getFilesByTopic(topic);
            if (files.length > 0) {
              topics.push(topic);
            }
          }
        }
      }

      console.log(`Found topics with files: ${topics}`);
      return topics;
    } catch (error) {
      console.error("Error fetching topics from S3:", error);
      return [];
    }
  }

  /**
   * Get all topics (including those without files) from S3 storage
   */
  async getAllTopics(): Promise<string[]> {
    try {
      console.log("Fetching all topics from S3 bucket...");

      const command = new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
        Delimiter: "/",
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);

      if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
        return [];
      }

      // Extract topic names from prefixes
      const topics: string[] = [];
      response.CommonPrefixes.forEach((prefix) => {
        if (prefix.Prefix) {
          const topic = prefix.Prefix.replace("/", ""); // Remove trailing slash
          if (topic) {
            topics.push(topic);
          }
        }
      });

      console.log(`Found all topics: ${topics}`);
      return topics;
    } catch (error) {
      console.error("Error fetching all topics from S3:", error);
      return [];
    }
  }

  /**
   * Get signed URL for a file
   * For PDFs, returns Edge Function URL for watermarking
   * For other files, returns regular signed URL
   */
  private async getSignedUrl(
    key: string,
    useWatermark: boolean = true
  ): Promise<string> {
    try {
      // For PDFs, always use Edge Function for watermarking
      if (useWatermark && (key.endsWith(".pdf") || key.endsWith(".PDF"))) {
        const edgeFunctionUrl = this.getEdgeFunctionUrl();
        return `edge-function:${edgeFunctionUrl}:${key}`;
      }

      // For non-PDF files, return regular signed URL
      const command = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      // Generate a signed URL that's valid for 1 hour
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
      return signedUrl;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      // Fallback to public URL
      return `${this.ENDPOINT}/${this.BUCKET_NAME}/${key}`;
    }
  }

  /**
   * Get Edge Function URL for watermarking
   */
  private getEdgeFunctionUrl(): string {
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
   * Check if a URL is an Edge Function URL
   */
  isEdgeFunctionUrl(url: string): boolean {
    return url.startsWith("edge-function:");
  }

  /**
   * Parse Edge Function URL to get function URL and S3 key
   * Format: edge-function:FUNCTION_URL:S3_KEY_OR_URL
   * Since URLs contain colons (https://), we need to find where the function URL ends
   */
  parseEdgeFunctionUrl(
    url: string
  ): { functionUrl: string; s3Key: string } | null {
    if (!this.isEdgeFunctionUrl(url)) {
      return null;
    }

    // Remove the prefix
    const content = url.replace("edge-function:", "");

    // Find the end of the function URL by looking for "/watermark-pdf"
    // The function URL should end with this path, followed by :, then the PDF URL/key
    const watermarkPdfIndex = content.indexOf("/watermark-pdf");
    if (watermarkPdfIndex !== -1) {
      const functionUrlEnd = watermarkPdfIndex + "/watermark-pdf".length;
      // The separator should be right after the function URL
      if (functionUrlEnd < content.length && content[functionUrlEnd] === ":") {
        return {
          functionUrl: content.substring(0, functionUrlEnd),
          s3Key: content.substring(functionUrlEnd + 1),
        };
      }
    }

    // Fallback: Try to find where the first URL ends and the second begins
    // Look for pattern: https://...something...:https:// or https://...something...:http://
    // This finds the colon that separates two URLs
    const urlPattern = /(https?:\/\/[^:]+):(https?:\/\/.+)/;
    const match = content.match(urlPattern);
    if (match && match.index !== undefined) {
      // Find the colon that separates the two URLs
      // The first URL ends before the second URL starts
      const firstUrlEnd = match.index + match[1].length;
      if (content[firstUrlEnd] === ":") {
        return {
          functionUrl: content.substring(0, firstUrlEnd),
          s3Key: content.substring(firstUrlEnd + 1),
        };
      }
    }

    // Another fallback: if the content has two "http" occurrences, split between them
    const firstHttp = content.indexOf("http");
    if (firstHttp !== -1) {
      const secondHttp = content.indexOf("http", firstHttp + 4);
      if (secondHttp !== -1) {
        // The separator should be right before the second "http"
        const separatorIndex = secondHttp - 1;
        if (separatorIndex > 0 && content[separatorIndex] === ":") {
          return {
            functionUrl: content.substring(0, separatorIndex),
            s3Key: content.substring(separatorIndex + 1),
          };
        }
      }
    }

    console.error("Could not parse Edge Function URL:", url);
    console.error("Content:", content);
    return null;
  }

  /**
   * Check if a PDF exists in S3 storage
   */
  async checkPDFExists(topic: string, filename: string): Promise<boolean> {
    try {
      const key = `${topic}/${filename}`;
      const command = new GetObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error("Error checking PDF existence:", error);
      return false;
    }
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format date in human readable format
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Unknown date";
    }
  }

  /**
   * Test S3 connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("Testing S3 connection...");
      const command = new ListObjectsV2Command({
        Bucket: this.BUCKET_NAME,
        MaxKeys: 1,
      });

      await this.s3Client.send(command);
      console.log("✅ S3 connection successful");
      return true;
    } catch (error) {
      console.error("❌ S3 connection failed:", error);
      return false;
    }
  }
}

export const awsS3PdfService = new AWSS3PDFService();
