import React, { useState, useEffect } from "react";
import { awsS3PdfService } from "../services/awsS3PdfService";

interface S3TopicCardProps {
  topicName: string;
  onClick: () => void;
}

const S3TopicCard: React.FC<S3TopicCardProps> = ({ topicName, onClick }) => {
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [pdfCount, setPdfCount] = useState<number | null>(null);
  const [docxCount, setDocxCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const handleClick = () => {
    console.log("S3TopicCard clicked for:", topicName);
    onClick();
  };

  useEffect(() => {
    loadFileCount();
  }, [topicName]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFileCount = async () => {
    try {
      setLoading(true);
      console.log(`S3TopicCard: Loading files for topic: ${topicName}`);
      const files = await awsS3PdfService.getFilesByTopic(topicName);
      console.log(
        `S3TopicCard: Received ${files.length} files for ${topicName}:`,
        files
      );

      const pdfs = files.filter((f) => f.type === "pdf");
      const docx = files.filter((f) => f.type === "docx");

      console.log(
        `S3TopicCard: ${topicName} breakdown - Total: ${files.length}, PDFs: ${pdfs.length}, DOCX: ${docx.length}`
      );

      setFileCount(files.length);
      setPdfCount(pdfs.length);
      setDocxCount(docx.length);
    } catch (error) {
      console.error("Error loading file count:", error);
      setFileCount(0);
      setPdfCount(0);
      setDocxCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Format topic name for display (capitalize first letter of each word)
  const formatTopicName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-gray-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {formatTopicName(topicName)}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {topicName === "geometry" &&
                "Shapes, angles, and spatial relationships"}
              {topicName === "number theory" &&
                "Numbers, equations, and mathematical concepts"}
              {topicName === "statistics" && "Data analysis and probability"}
              {topicName === "miscellenious" &&
                "Additional Study Boards topics"}
              {topicName === "Heart of Algebra" &&
                "Core algebraic concepts and functions"}
              {![
                "geometry",
                "number theory",
                "statistics",
                "miscellenious",
                "Heart of Algebra",
              ].includes(topicName) && "Study Boards topic"}
            </p>
            <div className="flex items-center text-sm text-gray-500">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
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
                  <span>
                    {fileCount === 0 ? (
                      "No files available"
                    ) : (
                      <>
                        {fileCount} file{fileCount !== 1 ? "s" : ""}
                        {pdfCount! > 0 && docxCount! > 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({pdfCount} PDF{pdfCount !== 1 ? "s" : ""},{" "}
                            {docxCount} DOCX)
                          </span>
                        )}
                        {pdfCount! > 0 && docxCount === 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            (PDFs)
                          </span>
                        )}
                        {docxCount! > 0 && pdfCount === 0 && (
                          <span className="text-xs text-gray-500 ml-1">
                            (DOCX)
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="ml-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default S3TopicCard;
