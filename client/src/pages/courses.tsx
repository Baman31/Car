import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, BookOpen, TrendingUp, Star, Clock, FileText, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CourseCard from "@/components/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { Course, Enrollment } from "@shared/schema";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuth();
  
  // Mock user ID - in real app this would come from auth context
  const userId = 2;

  const { data: courses, isLoading: coursesLoading, error } = useQuery<any[]>({
    queryKey: ["/api/mongo/courses"],
    queryFn: async () => {
      const response = await fetch("/api/mongo/courses", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch courses");
      }
      return response.json();
    },
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: [`/api/users/${userId}/enrollments`],
  });

  // Real-time user-specific statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/mongo/user/stats"],
    queryFn: async () => {
      const response = await fetch("/api/mongo/user/stats", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user stats");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const categories = ["All Categories", "Programming", "Data Science", "Mathematics"];

  const filteredCourses = courses?.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
                           course.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  }) || [];

  const getEnrollmentForCourse = (courseId: any) => {
    return enrollments?.find(e => e.courseId === courseId);
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    const errorMessage = error.message;
    if (errorMessage.includes('pending approval')) {
      return (
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
              <p className="text-gray-600 mb-4">Your account is waiting for admin approval before you can access courses.</p>
              <p className="text-sm text-gray-500">Please contact an administrator or wait for approval.</p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Courses</h2>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 min-h-screen overflow-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">
              Explore Your <span className="underline decoration-yellow-400">Learning Journey</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover amazing courses designed to help you master new skills and advance your career
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded mx-auto"></div>
                    ) : (
                      <span className="relative">
                        {userStats?.totalCourses || courses?.length || 0}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      </span>
                    )}
                  </h3>
                  <p className="text-blue-100">Available Courses</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-16 rounded mx-auto"></div>
                    ) : (
                      <span className="relative">
                        {userStats?.availableTests || 0}
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      </span>
                    )}
                  </h3>
                  <p className="text-blue-100">Available Tests</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {statsLoading ? (
                      <div className="animate-pulse bg-white/20 h-8 w-12 rounded mx-auto"></div>
                    ) : (
                      <span className="relative">
                        {userStats?.averageScore || 0}%
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      </span>
                    )}
                  </h3>
                  <p className="text-blue-100">
                    {user?.role === 'admin' ? 'Students Avg Score' : 'Your Avg Score'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Search & Filter Bar */}
          <div className="mb-8 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                  {/* Header Section */}
                  <div className="text-center lg:text-left space-y-3">
                    <div className="flex items-center justify-center lg:justify-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 dark:from-white dark:via-purple-100 dark:to-indigo-100 bg-clip-text text-transparent">
                          Course Catalog
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          Discover courses that will transform your career
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search & Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Category Filter */}
                    <div className="relative">
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-56 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-2 border-white/30 dark:border-gray-600/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"></div>
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-white/30 dark:border-gray-600/30 rounded-xl shadow-2xl">
                          <SelectItem value="all" className="hover:bg-violet-50 dark:hover:bg-violet-900/30">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>All Categories</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="programming" className="hover:bg-blue-50 dark:hover:bg-blue-900/30">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>Programming</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="data science" className="hover:bg-green-50 dark:hover:bg-green-900/30">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Data Science</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="mathematics" className="hover:bg-orange-50 dark:hover:bg-orange-900/30">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span>Mathematics</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-500 dark:text-violet-400 z-10" />
                        <Input
                          placeholder="Search your next adventure..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 pr-4 h-12 w-full sm:w-80 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-2 border-white/30 dark:border-gray-600/30 rounded-xl shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-200 focus:border-violet-500 dark:focus:border-violet-400 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                        {/* Search Button Enhancement */}
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                          >
                            <span className="text-xs">×</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Active Filters Display */}
                {(searchTerm || selectedCategory !== "all") && (
                  <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-600/20">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Active filters:</span>
                      {selectedCategory !== "all" && (
                        <div className="bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                          <span>{selectedCategory}</span>
                          <button
                            onClick={() => setSelectedCategory("all")}
                            className="ml-1 hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      {searchTerm && (
                        <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                          <span>"{searchTerm}"</span>
                          <button
                            onClick={() => setSearchTerm("")}
                            className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </div>

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard 
                  key={course._id || course.id} 
                  course={course} 
                  enrollment={getEnrollmentForCourse(course.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory !== "all" 
                    ? "Try adjusting your search criteria" 
                    : "No courses are currently available"}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}