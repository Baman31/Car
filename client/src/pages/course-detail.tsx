import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { X, Play, Clock, Youtube, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PdfViewer from "@/components/pdf-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/sidebar";
import type { Course, CourseModule, CourseNote } from "@shared/schema";

export default function CourseDetail() {
  const { id } = useParams();
  const courseId = id || "";

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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{course.title}</h2>
              <p className="text-gray-600 mt-1">
                {currentModule ? `Module: ${currentModule.title}` : "Course Overview"}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {/* Video Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Lectures</h3>
                {modules?.length > 0 ? (
                  <div className="space-y-3">
                    {modules.map((module: any, index: number) => (
                      <Link key={module._id || index} href={`/video/${courseId}/${module._id}`}>
                        <Card className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Play className="h-6 w-6 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-medium text-gray-900 truncate">
                                    {index + 1}. {module.title}
                                  </h4>
                                  {module.description && (
                                    <p className="text-sm text-gray-600 truncate mt-1">
                                      {module.description}
                                    </p>
                                  )}
                                  <div className="flex items-center mt-2 text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{module.duration} minutes</span>
                                    <Youtube className="h-4 w-4 ml-4 mr-1" />
                                    <span>Video Lecture</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <Button variant="outline" size="sm">
                                  <Play className="h-4 w-4 mr-2" />
                                  Watch
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No video lectures available</p>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">PDF Notes & Resources</h3>
                <PdfViewer notes={notes || []} />
              </div>
            </div>

            {/* Course Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h3>
                <div className="space-y-2">
                  {modules?.map((module: any, index: number) => (
                    <div
                      key={module._id || index}
                      className="p-3 rounded border-l-4 border-primary bg-white"
                    >
                      <p className="font-medium text-gray-900">{module.title}</p>
                      <p className="text-sm text-gray-500">
                        Video {index + 1} • {module.duration} min
                      </p>
                      {module.description && (
                        <p className="text-xs text-gray-400 mt-1">{module.description}</p>
                      )}
                    </div>
                  ))}
                  
                  {notes?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <h4 className="font-medium text-gray-900 mb-2">PDF Resources</h4>
                      {notes.map((note: any, index: number) => (
                        <div key={note._id || index} className="p-3 rounded border-l-4 border-blue-500 bg-white">
                          <p className="font-medium text-gray-900">{note.title}</p>
                          <p className="text-sm text-gray-500">
                            PDF Document • {note.fileSize || 'Unknown size'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {modules?.length === 0 && notes?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-4 opacity-50">📚</div>
                      <p>No content available</p>
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
