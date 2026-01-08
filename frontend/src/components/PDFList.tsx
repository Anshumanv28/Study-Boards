import React, { useState, useEffect } from "react";
import {
  S3PDFFile,
  S3File,
  awsS3PdfService,
} from "../services/awsS3PdfService";
import {
  boardsDatabaseService,
  BoardsContent,
  UserProgress,
} from "../services/boardsDatabaseService";
import { useAuth } from "../contexts/AuthContext";
import { safeOpenUrl } from "../utils/urlValidation";
import { downloadWithWatermark } from "../services/watermarkService";
import PDFViewer from "./PDFViewer";
import { Link } from "react-router-dom";

interface PDFListProps {
  topic: string;
  className?: string;
  useDatabase?: boolean;
}

interface ContentWithProgress extends BoardsContent {
  progress: UserProgress | null;
  fileUrl?: string; // S3 URL for the file
}

const PDFList: React.FC<PDFListProps> = ({
  topic,
  className = "",
  useDatabase = false,
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<S3File[]>([]);
  const [dbContent, setDbContent] = useState<ContentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<S3PDFFile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [watermarkingFile, setWatermarkingFile] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [topic, useDatabase, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFiles = async () => {
    // Check authentication first
    if (!user) {
      setLoading(false);
      setError(null);
      setFiles([]);
      setDbContent([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (useDatabase) {
        // Load from database
        const userId = user?.id || null;
        const contentWithProgress =
          await boardsDatabaseService.getContentWithProgress(topic, userId);

        // Convert database content to file format for display
        // Use watermarked URL if available, otherwise use original URL
        const contentFiles: ContentWithProgress[] = contentWithProgress.map(
          (item) => ({
            ...item,
            fileUrl: (item as any).watermarkedPdfUrl || item.pdf_url || item.video_url || undefined,
          })
        );

        setDbContent(contentFiles);
        setFiles([]); // Clear S3 files
      } else {
        // Fallback to S3
        const topicFiles = await awsS3PdfService.getFilesByTopic(topic);
        setFiles(topicFiles);
        setDbContent([]); // Clear database content
      }
    } catch (err) {
      setError("Failed to load files");
      console.error("Error loading files:", err);
      // Fallback to S3 on error
      if (useDatabase) {
        try {
          const topicFiles = await awsS3PdfService.getFilesByTopic(topic);
          setFiles(topicFiles);
        } catch (s3Err) {
          console.error("Error loading S3 files:", s3Err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (contentId: number) => {
    if (!user?.id) return;

    try {
      await boardsDatabaseService.markAsCompleted(user.id, contentId);
      // Reload to update progress
      await loadFiles();
    } catch (err) {
      console.error("Error marking content as complete:", err);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDbContent = dbContent.filter(
    (content) =>
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (content.description &&
        content.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileClick = async (file: S3File) => {
    // Check authentication
    if (!user) {
      // This shouldn't happen since files are hidden, but just in case
      return;
    }

    if (file.type === "pdf") {
      setSelectedPDF(file as S3PDFFile);
    } else {
      // For DOCX files, download with watermark
      try {
        setWatermarkingFile(file.name);
        // Extract S3 key if available
        const s3Key = file.key;
        await downloadWithWatermark(file.url, file.name, "docx", undefined, s3Key);
      } catch (error: any) {
        console.error("Error downloading DOCX with watermark:", error);
        if (error.message?.includes("Unauthorized") || error.message?.includes("authenticated")) {
          setError("Please log in to download files.");
        } else {
          // Fallback to direct download if watermarking fails (shouldn't happen for authenticated users)
          safeOpenUrl(file.url, "_blank");
        }
      } finally {
        setWatermarkingFile(null);
      }
    }
  };

  const handleDbContentClick = (content: ContentWithProgress) => {
    // Check authentication
    if (!user) {
      // This shouldn't happen since files are hidden, but just in case
      return;
    }

    if (content.content_type === "pdf" || content.content_type === "both") {
      // Use watermarked URL if available, otherwise use original URL
      const pdfUrl = (content as any).watermarkedPdfUrl || content.pdf_url;
      
      if (pdfUrl) {
        // Create a file-like object for the PDF viewer
        const pdfFile: S3PDFFile = {
          name: content.pdf_filename || content.title,
          url: pdfUrl,
          size: 0,
          lastModified: content.created_at,
          key: content.pdf_url || pdfUrl, // Keep original URL as key for download, fallback to pdfUrl
          type: "pdf",
          extension: "pdf",
        };
        setSelectedPDF(pdfFile);
      }
    } else if (content.content_type === "video" && content.video_url) {
      // Safely open video URL with validation
      safeOpenUrl(content.video_url, "_blank");
    }
  };

  const handleCloseViewer = () => {
    setSelectedPDF(null);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Loading PDFs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
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
              Failed to load files
            </p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={loadFiles}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-6">
              Please log in to view resources in this topic. All files are
              watermarked and require authentication to access.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = useDatabase ? dbContent.length > 0 : files.length > 0;

  if (!hasContent) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">
              No content available
            </p>
            <p className="text-gray-500 text-sm">
              No content found for this topic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <p className="text-sm text-gray-600">
            {useDatabase
              ? `${dbContent.length} item${
                  dbContent.length !== 1 ? "s" : ""
                } available`
              : `${files.length} file${
                  files.length !== 1 ? "s" : ""
                } available`}
            {!useDatabase && files.length > 0 && (
              <span className="text-gray-500 ml-1">
                ({files.filter((f) => f.type === "pdf").length} PDFs,{" "}
                {files.filter((f) => f.type === "docx").length} DOCX)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadFiles}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Content Grid */}
      {useDatabase ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDbContent.map((content) => (
            <div
              key={content.id}
              onClick={() => handleDbContentClick(content)}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
            >
              {content.progress?.completed && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Completed
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-colors ${
                        content.content_type === "pdf"
                          ? "bg-red-100"
                          : content.content_type === "video"
                          ? "bg-purple-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {content.content_type === "pdf" ? (
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : content.content_type === "video" ? (
                        <svg
                          className="w-6 h-6 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 6.276A1 1 0 0014 7v6a1 1 0 00.553.894l4 2A1 1 0 0020 15V7a1 1 0 00-1.447-.894l-4 2z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {content.title}
                    </h4>
                    {content.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {content.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          content.content_type === "pdf"
                            ? "bg-red-100 text-red-800"
                            : content.content_type === "video"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {content.content_type.toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          content.difficulty_level === "easy"
                            ? "bg-green-100 text-green-800"
                            : content.difficulty_level === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {content.difficulty_level}
                      </span>
                    </div>
                    {user && !content.progress?.completed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(content.id);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark as complete
                      </button>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.name}
              onClick={() => handleFileClick(file)}
              className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:opacity-80 transition-colors ${
                        file.type === "pdf" ? "bg-red-100" : "bg-blue-100"
                      }`}
                    >
                      <svg
                        className={`w-6 h-6 ${
                          file.type === "pdf" ? "text-red-600" : "text-blue-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {file.name}
                    </h4>
                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                      <span>{awsS3PdfService.formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>
                        {awsS3PdfService.formatDate(file.lastModified)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          file.type === "pdf"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {file.type.toUpperCase()}
                      </span>
                      {watermarkingFile === file.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
                          Adding Watermark...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {((useDatabase && filteredDbContent.length === 0) ||
        (!useDatabase && filteredFiles.length === 0)) &&
        searchTerm && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No content found matching "{searchTerm}"
            </p>
          </div>
        )}

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <PDFViewer pdf={selectedPDF} onClose={handleCloseViewer} />
      )}
    </div>
  );
};

export default PDFList;
