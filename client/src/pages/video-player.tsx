import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Clock, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/sidebar";

export default function VideoPlayer() {
  const [match, params] = useRoute("/video/:courseId/:moduleId");
  
  const { data: course, isLoading } = useQuery<any>({
    queryKey: [`/api/mongo/courses/${params?.courseId}`],
    enabled: !!params?.courseId,
  });

  if (!match || !params) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Video Not Found</h2>
            <p className="text-gray-600 mt-2">The requested video could not be found.</p>
            <Link href="/courses">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const module = course?.modules?.find((m: any) => m._id === params.moduleId);
  
  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Module Not Found</h2>
            <p className="text-gray-600 mt-2">The requested video module could not be found.</p>
            <Link href={`/courses/${params.courseId}`}>
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract YouTube video ID
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(module.youtubeUrl);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href={`/courses/${params.courseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {videoId ? (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={module.title}
                      className="w-full h-full rounded-t-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-t-lg">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Invalid video URL</p>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{module.title}</h1>
                  {module.description && (
                    <p className="text-gray-600 mb-4">{module.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{module.duration} minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-gray-900 mb-4">{course?.title}</h3>
                <div className="space-y-2">
                  {course?.modules?.map((mod: any, index: number) => (
                    <Link
                      key={mod._id}
                      href={`/video/${params.courseId}/${mod._id}`}
                    >
                      <div
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          mod._id === params.moduleId
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {index + 1}. {mod.title}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {mod.duration} min
                            </div>
                          </div>
                          {mod._id === params.moduleId && (
                            <Play className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}