import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Play, Clock, Youtube, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import PdfViewer from "@/components/pdf-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/sidebar";
import type { Course, CourseModule, CourseNote } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = id || "";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading, error } = useQuery<any>({
    queryKey: [`/api/mongo/courses/${courseId}`],
    queryFn: async () => {
      const response = await fetch(`/api/mongo/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch course");
      }
      return response.json();
    },
    enabled: !!courseId,
  });

  // Module completion mutation
  const completionMutation = useMutation({
    mutationFn: async ({ moduleId, isCompleted }: { moduleId: string; isCompleted: boolean }) => {
      const method = isCompleted ? 'POST' : 'DELETE';
      return await apiRequest(method, `/api/mongo/courses/${courseId}/modules/${moduleId}/complete`, {});
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/mongo/courses/${courseId}`] });
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

  // For MongoDB structure, modules and notes are embedded in the course document
  const modules = course?.modules || [];
  const notes = course?.notes || [];
  const modulesLoading = courseLoading;
  const notesLoading = courseLoading;

  if (courseLoading || modulesLoading || notesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Skeleton className="h-8 w-96 mb-2" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-6 w-6" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Skeleton className="aspect-video mb-6" />
                  <Skeleton className="h-32" />
                </div>
                <div className="lg:col-span-1">
                  <Skeleton className="h-64" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message;
    if (errorMessage.includes('not enrolled')) {
      return (
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">You are not enrolled in this course.</p>
              <p className="text-sm text-gray-500">Please contact an administrator for course access.</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Course</h2>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
            <p className="text-gray-500">The course you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  const currentModule = modules?.length > 0 ? modules[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        
        <div className="relative p-8">
          {/* Header with enhanced gradient styling */}
          <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl text-white shadow-lg">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">{course.title}</h2>
              <p className="text-blue-100 mt-2 flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                {currentModule ? `Module: ${currentModule.title}` : "Course Overview"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 transition-all duration-300">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {/* Video Section */}
              <div className="mb-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl mr-4 shadow-lg">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Video Lectures</h3>
                </div>
                {modules?.length > 0 ? (
                  <div className="space-y-4">
                    {modules.map((module: any, index: number) => {
                      const isCompleted = isModuleCompleted(module);
                      return (
                        <div key={module._id || index} className="relative">
                          <Card className={`hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-white via-blue-50/30 to-purple-50/30 border-l-4 ${isCompleted ? 'border-green-500' : 'border-gradient-to-b from-blue-500 to-purple-500'} group overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500"></div>
                            <CardContent className="p-6 relative">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                  <div className="flex-shrink-0">
                                    <div className={`w-16 h-16 ${isCompleted ? 'bg-gradient-to-br from-green-500 via-green-600 to-green-700' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                      {isCompleted ? (
                                        <Check className="h-8 w-8 text-white" />
                                      ) : (
                                        <Play className="h-8 w-8 text-white" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                        {index + 1}. {module.title}
                                      </h4>
                                      {isCompleted && (
                                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                          <Check className="h-3 w-3" />
                                          Completed
                                        </div>
                                      )}
                                    </div>
                                    {module.description && (
                                      <div className="text-sm text-gray-600 truncate mb-3">
                                        {module.description}
                                      </div>
                                    )}
                                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                                      <div className="flex items-center bg-blue-100 rounded-full px-3 py-1">
                                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                                        <span className="font-medium text-blue-700">{module.duration} min</span>
                                      </div>
                                      <div className="flex items-center bg-red-100 rounded-full px-3 py-1">
                                        <Youtube className="h-4 w-4 mr-1 text-red-600" />
                                        <span className="font-medium text-red-700">HD Video</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-3">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`module-${module._id}`}
                                      checked={isCompleted}
                                      onCheckedChange={(checked) => handleModuleToggle(module._id, isCompleted)}
                                      disabled={completionMutation.isPending}
                                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                    />
                                    <label 
                                      htmlFor={`module-${module._id}`} 
                                      className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                                    >
                                      {isCompleted ? 'Completed' : 'Mark Complete'}
                                    </label>
                                  </div>
                                  <Link href={`/video/${courseId}/${module._id}`}>
                                    <Button variant="outline" size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none hover:from-blue-600 hover:to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg">
                                      <Play className="h-5 w-5 mr-2" />
                                      Watch Now
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Youtube className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">No video lectures available</p>
                    <p className="text-sm text-gray-500 mt-1">Check back later for new content</p>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="mt-10">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mr-4 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">PDF Notes & Resources</h3>
                </div>
                <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 rounded-2xl p-6 shadow-xl border border-white/20">
                  <PdfViewer notes={notes || []} />
                </div>
              </div>
            </div>

            {/* Course Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 sticky top-8">
                <div className="flex items-center mb-6">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3 shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">Course Content</h3>
                </div>
                <div className="space-y-3">
                  {modules?.map((module: any, index: number) => (
                    <div
                      key={module._id || index}
                      className="p-4 rounded-xl bg-gradient-to-r from-white to-purple-50/50 border-l-4 border-gradient-to-b from-purple-500 to-pink-500 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{module.title}</p>
                          <div className="flex items-center mt-2 space-x-3">
                            <div className="flex items-center bg-purple-100 rounded-full px-2 py-1">
                              <span className="text-xs font-medium text-purple-700">Video {index + 1}</span>
                            </div>
                            <div className="flex items-center bg-pink-100 rounded-full px-2 py-1">
                              <Clock className="h-3 w-3 mr-1 text-pink-600" />
                              <span className="text-xs font-medium text-pink-700">{module.duration} min</span>
                            </div>
                          </div>
                          {module.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{module.description}</p>
                          )}
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ml-3 group-hover:scale-110 transition-transform duration-300">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notes?.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gradient-to-r from-purple-200 to-pink-200">
                      <div className="flex items-center mb-4">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mr-3 shadow-lg">
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="font-bold text-gray-900">PDF Resources</h4>
                      </div>
                      {notes.map((note: any, index: number) => (
                        <div key={note._id || index} className="p-4 rounded-xl bg-gradient-to-r from-white to-green-50/50 border-l-4 border-gradient-to-b from-green-500 to-emerald-500 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 mb-3">
                          <p className="font-bold text-gray-900">{note.title}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <div className="flex items-center bg-green-100 rounded-full px-2 py-1">
                              <svg className="h-3 w-3 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-medium text-green-700">PDF</span>
                            </div>
                            <div className="flex items-center bg-blue-100 rounded-full px-2 py-1">
                              <span className="text-xs font-medium text-blue-700">{note.fileSize || 'Download'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {modules?.length === 0 && notes?.length === 0 && (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-2xl">📚</span>
                      </div>
                      <p className="text-gray-600 font-medium">No content available</p>
                      <p className="text-sm text-gray-500 mt-1">Content will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
