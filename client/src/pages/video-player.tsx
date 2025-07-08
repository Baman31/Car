import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Play, Clock, BookOpen, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function VideoPlayer() {
  const [match, params] = useRoute("/video/:courseId/:moduleId");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: course, isLoading } = useQuery<any>({
    queryKey: [`/api/mongo/courses/${params?.courseId}`],
    enabled: !!params?.courseId,
  });

  // Module completion mutation
  const completionMutation = useMutation({
    mutationFn: async ({ moduleId, isCompleted }: { moduleId: string; isCompleted: boolean }) => {
      const method = isCompleted ? 'POST' : 'DELETE';
      return await apiRequest(method, `/api/mongo/courses/${params?.courseId}/modules/${moduleId}/complete`, {});
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/mongo/courses/${params?.courseId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/student/enrollments"] });
      
      toast({
        title: variables.isCompleted ? "Module Completed" : "Module Uncompleted",
        description: variables.isCompleted ? "Great job! Keep up the progress." : "Module marked as incomplete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update module completion",
        variant: "destructive",
      });
    }
  });

  // Helper function to check if module is completed
  const isModuleCompleted = (module: any) => {
    if (!user?.id || !module?.completedBy) return false;
    return module.completedBy.some((completion: any) => 
      completion.userId === user.id
    );
  };

  // Handle module completion toggle
  const handleModuleToggle = (moduleId: string, currentlyCompleted: boolean) => {
    completionMutation.mutate({ 
      moduleId, 
      isCompleted: !currentlyCompleted 
    });
  };

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
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`module-completion-${module._id}`}
                        checked={isModuleCompleted(module)}
                        onCheckedChange={(checked) => handleModuleToggle(module._id, isModuleCompleted(module))}
                        disabled={completionMutation.isPending}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label 
                        htmlFor={`module-completion-${module._id}`} 
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        {isModuleCompleted(module) ? 'Completed' : 'Mark Complete'}
                      </label>
                    </div>
                  </div>
                  {module.description && (
                    <p className="text-gray-600 mb-4">{module.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{module.duration} minutes</span>
                    {isModuleCompleted(module) && (
                      <div className="flex items-center ml-4 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </div>
                    )}
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
                  {course?.modules?.map((mod: any, index: number) => {
                    const isCompleted = isModuleCompleted(mod);
                    return (
                      <Link
                        key={mod._id}
                        href={`/video/${params.courseId}/${mod._id}`}
                      >
                        <div
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            mod._id === params.moduleId
                              ? 'bg-blue-50 border-blue-200'
                              : isCompleted 
                                ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {index + 1}. {mod.title}
                                </p>
                                {isCompleted && (
                                  <div className="flex-shrink-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {mod.duration} min
                                {isCompleted && (
                                  <span className="ml-2 text-green-600 font-medium">• Completed</span>
                                )}
                              </div>
                            </div>
                            {mod._id === params.moduleId && (
                              <Play className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}