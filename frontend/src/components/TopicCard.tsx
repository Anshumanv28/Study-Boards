import React from "react";
import { BoardsTopic } from "../services/boardsDatabaseService";

interface TopicCardProps {
  topic: BoardsTopic;
  contentCount?: number;
  onClick: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  contentCount,
  onClick,
}) => {
  const formatTopicName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getIcon = () => {
    if (topic.icon) return topic.icon;
    return "📚"; // Default icon
  };

  const getColor = () => {
    if (topic.color) return topic.color;
    return "#3B82F6"; // Default blue
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-gray-300"
      style={{
        borderLeftColor: getColor(),
        borderLeftWidth: "4px",
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">{getIcon()}</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {formatTopicName(topic.name)}
              </h3>
            </div>
            {topic.description && (
              <p className="text-sm text-gray-600 mb-4">{topic.description}</p>
            )}
            <div className="flex items-center text-sm text-gray-500">
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
                {contentCount !== undefined ? (
                  contentCount === 0 ? (
                    "No content available"
                  ) : (
                    <>
                      {contentCount} item{contentCount !== 1 ? "s" : ""}
                    </>
                  )
                ) : (
                  "Loading..."
                )}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${getColor()}20` }}
            >
              <span className="text-2xl">{getIcon()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
