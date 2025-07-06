import { Play, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  title: string;
  duration: string;
  videoUrl?: string;
}

// Extract YouTube video ID from various YouTube URL formats
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export default function VideoPlayer({ title, duration, videoUrl }: VideoPlayerProps) {
  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  
  if (!videoUrl || !videoId) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <Play className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
            <Clock className="h-4 w-4" />
            {duration}
          </p>
        </div>
        <p className="text-gray-500">No video available</p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duration: {duration}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(videoUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Watch on YouTube
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
