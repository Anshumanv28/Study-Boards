// Supabase Edge Function for PDF Watermarking
// This function validates authentication, fetches PDFs from S3, and applies watermarks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, degrees } from "npm:pdf-lib@1.17.1";

const DEFAULT_WATERMARK_TEXT = "StudyBoards - Confidential";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pdfUrl?: string;
  s3Key?: string;
  watermarkText?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { pdfUrl, s3Key, watermarkText } = body;

    if (!pdfUrl && !s3Key) {
      return new Response(
        JSON.stringify({ error: "Missing pdfUrl or s3Key" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get watermark text from env or request
    const watermark =
      watermarkText || Deno.env.get("WATERMARK_TEXT") || DEFAULT_WATERMARK_TEXT;

    // Fetch PDF from URL or S3
    let pdfBytes: Uint8Array;
    if (pdfUrl) {
      // Fetch from provided URL
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBytes = new Uint8Array(arrayBuffer);
    } else if (s3Key) {
      // Check if s3Key is actually a URL
      if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
        // It's a URL, fetch it
        const response = await fetch(s3Key);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch PDF from URL: ${response.statusText}`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      } else {
        // It's an S3 key, fetch from Supabase Storage
        const bucketName = Deno.env.get("S3_BUCKET_NAME") || "Boards-study";
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(s3Key);

        if (error || !data) {
          throw new Error(
            `Failed to fetch from S3: ${error?.message || "Unknown error"}`
          );
        }

        const arrayBuffer = await data.arrayBuffer();
        pdfBytes = new Uint8Array(arrayBuffer);
      }
    } else {
      throw new Error("No valid source provided");
    }

    // Apply watermark
    const watermarkedPdfBytes = await addWatermarkToPDF(pdfBytes, watermark);

    // Return watermarked PDF
    return new Response(watermarkedPdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="watermarked.pdf"',
      },
    });
  } catch (error) {
    console.error("Error in watermark-pdf function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Add diagonal watermark to a PDF
 * Uses the same settings as the client-side implementation
 */
async function addWatermarkToPDF(
  pdfBytes: Uint8Array,
  watermarkText: string
): Promise<Uint8Array> {
  // Load the PDF document
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont("Helvetica-Bold");

  // Get page dimensions for positioning
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Calculate diagonal position
  const fontSize = Math.min(width, height) * 0.06; // 6% of smaller dimension
  const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
  const textHeight = fontSize;

  // Calculate angle and position for diagonal watermark
  const angle = -45; // 45 degrees counter-clockwise

  // Add watermark to all pages
  pages.forEach((page) => {
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Calculate spacing for full page coverage
    // Diagonal spacing to cover the entire page - spacing multiplier 0.7
    const diagonalSpacing =
      Math.sqrt(textWidth * textWidth + textHeight * textHeight) * 0.7;
    const horizontalSpacing = diagonalSpacing * Math.cos((45 * Math.PI) / 180);
    const verticalSpacing = diagonalSpacing * Math.sin((45 * Math.PI) / 180);

    // Calculate how many watermarks we need to cover the page
    // Add extra padding to ensure full coverage
    const padding = Math.max(pageWidth, pageHeight) * 0.1;
    const cols = Math.ceil((pageWidth + padding * 2) / horizontalSpacing) + 1;
    const rows = Math.ceil((pageHeight + padding * 2) / verticalSpacing) + 1;

    // Draw watermark across the entire page in a grid pattern
    for (let row = -1; row <= rows; row++) {
      for (let col = -1; col <= cols; col++) {
        // Calculate position with diagonal offset
        const x = col * horizontalSpacing - padding;
        const y = row * verticalSpacing - padding;

        // Only draw if the watermark would be visible on the page
        if (
          x + textWidth > -padding &&
          x < pageWidth + padding &&
          y + textHeight > -padding &&
          y < pageHeight + padding
        ) {
          page.drawText(watermarkText, {
            x: x - textWidth / 2,
            y: y - textHeight / 2,
            size: fontSize,
            font: font,
            color: rgb(0.7, 0.7, 0.7), // Light gray color
            opacity: 0.3, // Semi-transparent
            rotate: degrees(angle),
          });
        }
      }
    }
  });

  // Save the watermarked PDF
  const watermarkedPdfBytes = await pdfDoc.save();
  return watermarkedPdfBytes;
}
