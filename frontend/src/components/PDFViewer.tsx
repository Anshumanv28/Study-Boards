import React, { useState, useRef, useEffect } from "react";
import { S3PDFFile, awsS3PdfService } from "../services/awsS3PdfService";
import { downloadWithWatermark } from "../services/watermarkService";
import { supabase } from "../lib/supabase";

interface PDFViewerProps {
  pdf: S3PDFFile;
  onClose: () => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdf,
  onClose,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load PDF from Edge Function if needed
  useEffect(() => {
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if this is an Edge Function URL
        if (awsS3PdfService.isEdgeFunctionUrl(pdf.url)) {
          const parsed = awsS3PdfService.parseEdgeFunctionUrl(pdf.url);
          if (!parsed) {
            throw new Error("Invalid Edge Function URL format");
          }

          // Get authentication token
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("User must be authenticated to view PDFs");
          }

          // Fetch watermarked PDF from Edge Function
          const response = await fetch(parsed.functionUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: process.env.REACT_APP_SUPABASE_ANON_KEY || "",
            },
            body: JSON.stringify({
              pdfUrl: parsed.s3Key,
              watermarkText:
                process.env.REACT_APP_WATERMARK_TEXT ||
                "StudyBoards - Confidential",
            }),
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Unauthorized. Please log in to view PDFs.");
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Failed to load PDF: ${response.statusText}`
            );
          }

          // Create blob URL from response
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(blobUrl);
        } else {
          // Regular URL, use directly
          setPdfBlobUrl(null);
        }
      } catch (err: any) {
        console.error("Error loading PDF:", err);
        setError(err.message || "Failed to load PDF. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdf.url]);

  // Cleanup blob URL on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  // Prevent right-click and other download methods
  useEffect(() => {
    const preventDownload = (e: MouseEvent) => {
      // Prevent right-click context menu
      if (e.button === 2) {
        e.preventDefault();
        return false;
      }
    };

    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventKeyboardDownload = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+P, etc.
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "p" || e.key === "S" || e.key === "P")
      ) {
        e.preventDefault();
        // Show message that they should use the download button
        alert(
          "Please use the Download button above to download this PDF with watermark."
        );
        return false;
      }
    };

    // Add event listeners
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("mousedown", preventDownload);
    document.addEventListener("keydown", preventKeyboardDownload);

    // Cleanup
    return () => {
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("mousedown", preventDownload);
      document.removeEventListener("keydown", preventKeyboardDownload);
    };
  }, []);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError("Failed to load PDF. Please try again.");
  };

  const handleDownload = async () => {
    try {
      setIsWatermarking(true);

      // Extract original URL or S3 key for download
      let originalUrl = pdf.url;
      let s3Key: string | undefined;

      if (awsS3PdfService.isEdgeFunctionUrl(pdf.url)) {
        const parsed = awsS3PdfService.parseEdgeFunctionUrl(pdf.url);
        if (parsed) {
          // The s3Key might be a full URL or an S3 key path
          originalUrl = parsed.s3Key;
          // If it's a URL, use it as pdfUrl; if it's an S3 key, use it as s3Key
          if (
            parsed.s3Key.startsWith("http://") ||
            parsed.s3Key.startsWith("https://")
          ) {
            // It's a URL, don't set s3Key
            s3Key = undefined;
          } else {
            // It's an S3 key path
            s3Key = parsed.s3Key;
            originalUrl = ""; // Clear URL since we're using S3 key
          }
        }
      } else if (pdf.key) {
        // Use the key (might be URL or S3 key path)
        if (pdf.key.startsWith("http://") || pdf.key.startsWith("https://")) {
          originalUrl = pdf.key;
          s3Key = undefined;
        } else {
          s3Key = pdf.key;
          originalUrl = ""; // Clear URL since we're using S3 key
        }
      }

      await downloadWithWatermark(
        originalUrl || pdf.url,
        pdf.name,
        "pdf",
        undefined,
        s3Key
      );
    } catch (error: any) {
      console.error("Error downloading PDF with watermark:", error);
      setError(error.message || "Failed to download PDF. Please try again.");
    } finally {
      setIsWatermarking(false);
    }
  };

  // Determine the URL to use for the iframe
  const iframeSrc = pdfBlobUrl || pdf.url;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] ${className}`}
    >
      <div className="bg-white w-full h-full flex flex-col relative">
        {/* Header Bar - Outside PDF viewer */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white relative z-[10000]">
          <div className="flex-1">
            <p className="text-xs text-gray-500 italic">
              Use the Download button to get a watermarked copy
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={isWatermarking}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title="Download PDF with Watermark"
            >
              {isWatermarking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Adding Watermark...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm">Download</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-colors"
              title="Close"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-hidden relative min-h-0 w-full h-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-red-600 font-medium mb-2">
                  Failed to load PDF
                </p>
                <p className="text-gray-600 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {iframeSrc && (
            <iframe
              ref={iframeRef}
              src={`${iframeSrc}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              title={pdf.name}
              style={{
                pointerEvents: "auto",
              }}
              // Add sandbox to limit iframe capabilities
              sandbox="allow-same-origin allow-scripts"
              // Disable download attribute
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
