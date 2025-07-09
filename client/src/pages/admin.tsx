import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import StatsCard from "@/components/stats-card";
import CourseForm from "@/components/admin/course-form";
import TestForm from "@/components/admin/test-form";
import StudentGrades from "@/components/admin/student-grades";
import UserApprovals from "@/components/admin/user-approvals";
import UserManagement from "@/components/admin/user-management";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getGradeColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Plus, Youtube, FileText, Edit, Trash2, Award, Users, BookOpen, BarChart3, Target, TrendingUp, GraduationCap, Shield, UserCheck, Activity, Clock, Calendar, PieChart, LineChart, Zap, RefreshCw } from "lucide-react";
import type { User, Course, TestResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AdminTestResult extends TestResult {
  test?: {
    id: number;
    title: string;
    courseId: number;
  };
  course?: {
    id: number;
    title: string;
  };
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analytics");

  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{
    totalCourses: number;
    totalStudents: number;
    studentsEnrolled: number;
    uniqueStudentsEnrolled?: number;
    approvedEnrolledStudents: number;
    averageScore: number;
    averageCompletion: number;
    courseCompletionRate: number;
    completedCourses: number;
    testsCompleted: number;
    approvedStudents: number;
    activeCourses: number;
  }>({
    queryKey: ["/api/mongo/admin/stats"],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time data
    refetchIntervalInBackground: true,
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/courses"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/mongo/admin/users"],
  });

  const { data: tests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/tests"],
  });

  const { data: studentResults, isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/admin/student-results"],
  });

  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/admin/pending-approvals"],
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await apiRequest("DELETE", `/api/mongo/tests/${testId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test",
        variant: "destructive",
      });
    },
  });

  // Handle test edit
  const handleEditTest = (test: any) => {
    console.log('Edit test clicked:', test);
    setEditingTest(test);
    setShowTestForm(true);
  };

  // Handle test delete
  const handleDeleteTest = async (testId: string) => {
    console.log('Delete test clicked:', testId);
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      deleteTestMutation.mutate(testId);
    }
  };

  // Manual refresh functionality - no automatic intervals

  // Calculate additional analytics metrics
  const analyticsData = {
    // User engagement metrics
    totalActiveUsers: users?.filter(user => user.isActive !== false)?.length || 0,
    pendingApprovals: pendingApprovals?.length || 0,
    approvalRate: users && pendingApprovals 
      ? Math.round(((users.length - pendingApprovals.length) / users.length) * 100) 
      : 0,
    
    // Course metrics
    activeCourses: courses?.filter(course => course.isActive !== false)?.length || 0,
    courseCategories: courses ? courses.map(course => course.category).filter((category, index, arr) => arr.indexOf(category) === index).length : 0,
    
    // Test performance metrics
    totalTestResults: studentResults?.reduce((acc, student) => acc + (student.testResults?.length || 0), 0) || 0,
    averageTestScore: studentResults?.length ? 
      Math.round(
        studentResults.reduce((acc, student) => {
          const studentAvg = student.testResults?.length ? 
            student.testResults.reduce((sum: number, test: any) => sum + (test.score || 0), 0) / student.testResults.length : 0;
          return acc + studentAvg;
        }, 0) / studentResults.length
      ) : 0,
    
    // Activity metrics
    recentActivity: {
      newUsers: users?.filter(user => {
        const createdDate = new Date(user.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate >= weekAgo;
      })?.length || 0,
      newCourses: courses?.filter(course => {
        const createdDate = new Date(course.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate >= weekAgo;
      })?.length || 0,
      newTests: tests?.filter(test => {
        const createdDate = new Date(test.createdAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdDate >= weekAgo;
      })?.length || 0,
    }
  };

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await apiRequest("DELETE", `/api/mongo/courses/${courseId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/stats"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse.mutate(courseId);
  };

  if (statsLoading && activeTab === "analytics") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        {/* Enhanced Admin Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          </div>
          
          <div className="relative px-8 py-8 backdrop-blur-sm bg-black/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
                  <p className="text-blue-100 text-lg font-medium">
                    Comprehensive system management and analytics dashboard
                  </p>
                </div>
              </div>
              
              {/* Admin stats mini cards */}
              <div className="hidden lg:flex space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px] border border-white/30 relative">
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full " />
                  </div>
                  <div className="text-2xl font-bold text-white">{adminStats?.activeCourses || 0}</div>
                  <div className="text-blue-100 text-sm font-medium">Active Courses</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px] border border-white/30 relative">
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full " />
                  </div>
                  <div className="text-2xl font-bold text-white">{adminStats?.approvedEnrolledStudents || 0}</div>
                  <div className="text-blue-100 text-sm font-medium">Approved & Enrolled</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center min-w-[120px] border border-white/30 relative">
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full " />
                  </div>
                  <div className="text-2xl font-bold text-white">{adminStats?.averageScore || 0}%</div>
                  <div className="text-blue-100 text-sm font-medium">Avg Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="px-8">
            <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "analytics"
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("approvals")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "approvals"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>User Approvals</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "users"
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>User Management</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("courses")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "courses"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Courses</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("tests")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "tests"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Tests</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("grading")}
                className={`px-6 py-4 rounded-t-2xl font-semibold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === "grading"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg transform -translate-y-1"
                    : "text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Grading</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Ultra-Enhanced Content Area with Advanced Styling */}
        <div className="flex-1 overflow-auto relative">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] bg-[length:20px_20px]"></div>
          </div>
          
          {/* Floating Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-lg animate-pulse delay-500"></div>
          
          {/* Main Content Container */}
          <div className="relative z-10 p-8 space-y-8">
          {/* Tab Content Based on Active Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Ultra-Enhanced Analytics Header with Advanced Styling */}
              <div className="relative group">
                {/* Animated Background Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                
                {/* Main Header Container */}
                <div className="relative rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-br from-white/90 via-blue-50/80 to-purple-50/60 dark:from-gray-900/90 dark:via-blue-900/30 dark:to-purple-900/20 backdrop-blur-xl">
                  {/* Animated Top Border */}
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-pink-500 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="relative bg-gradient-to-r from-white/20 via-white/10 to-white/5 backdrop-blur-sm">
                    {/* Floating Decorative Elements */}
                    <div className="absolute top-4 right-8 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-lg animate-pulse"></div>
                    <div className="absolute bottom-4 left-8 w-8 h-8 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-md animate-pulse delay-700"></div>
                    
                    <div className="p-10">
                      <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
                        <div className="flex items-center space-x-8">
                          {/* Enhanced Icon Container */}
                          <div className="relative group/icon">
                            <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-20 group-hover/icon:opacity-40 transition-opacity duration-300"></div>
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl transform group-hover/icon:scale-105 transition-transform duration-300">
                              <BarChart3 className="w-12 h-12 text-white drop-shadow-lg" />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                            </div>
                          </div>
                          
                          {/* Enhanced Title Section */}
                          <div className="space-y-3">
                            <div className="flex items-center space-x-4">
                              <h2 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                                Platform Analytics
                              </h2>
                              <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full border border-blue-200 dark:border-blue-700">
                                <span className="text-blue-700 dark:text-blue-300 text-sm font-bold flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span>Live Dashboard</span>
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-xl font-medium max-w-md">
                              Advanced insights and real-time analytics for your educational platform
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="font-medium">Real-time Data</span>
                              </div>
                              <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                                <span className="font-medium">Interactive Charts</span>
                              </div>
                              <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-500"></div>
                                <span className="font-medium">Advanced Metrics</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Controls Section */}
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="relative group/status">
                              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl blur opacity-20 group-hover/status:opacity-40 transition-opacity duration-300"></div>
                              <div className="relative flex items-center space-x-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-3 rounded-xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm">
                                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse shadow-lg"></div>
                                <span className="text-green-800 dark:text-green-200 font-bold">Manual Refresh Mode</span>
                                <div className="px-2 py-1 bg-white/50 dark:bg-gray-800/50 rounded-md text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Click to update
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="lg"
                            onClick={() => {
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/stats"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/student-results"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/users"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/courses"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
                              queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/pending-approvals"] });
                              toast({
                                title: "Analytics Refreshed",
                                description: "All platform data has been updated successfully",
                              });
                            }}
                            className="relative group/refresh bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-gray-800/90 dark:to-blue-900/30 border-gray-200/50 dark:border-gray-700/50 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/30 backdrop-blur-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0 group-hover/refresh:opacity-20 transition-opacity duration-300"></div>
                            <RefreshCw className="w-5 h-5 mr-3 group-hover/refresh:rotate-180 transition-transform duration-500" />
                            Refresh Analytics
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Users */}
                <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Courses</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {adminStats?.activeCourses || 0}
                        </p>
                        
                      </div>
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Courses */}
                <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Approved & Enrolled</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {adminStats?.approvedEnrolledStudents || 0}
                        </p>
                        
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Results */}
                <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Average Score</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {adminStats?.averageScore || 0}%
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          {adminStats?.testsCompleted || 0} tests completed
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg Completion</p>
                        <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                          {adminStats?.averageCompletion || 0}%
                        </p>
                        
                      </div>
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Activity Chart */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <LineChart className="w-5 h-5 text-blue-600" />
                          <span>User Engagement Overview</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Weekly activity metrics</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        <Zap className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* User Statistics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl relative">
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full " />
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                                <div className="w-1 h-1 bg-blue-500 rounded-full " />
                              </div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats?.totalStudents || analyticsData.totalActiveUsers}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">Live count</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl relative">
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full " />
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
                                <div className="w-1 h-1 bg-green-500 rounded-full " />
                              </div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{analyticsData.recentActivity.newUsers}</p>
                              <p className="text-xs text-green-600 dark:text-green-400">Weekly growth</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Course Categories */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                          <PieChart className="w-4 h-4" />
                          <span>Course Distribution</span>
                          <div className="w-1 h-1 bg-blue-500 rounded-full " />
                        </h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl relative">
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full " />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Total Categories</span>
                            <span className="font-bold text-gray-900 dark:text-white">{analyticsData.courseCategories}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Active Courses</span>
                            <span className="font-bold text-gray-900 dark:text-white">{adminStats?.activeCourses || 0}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">Live Updates</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-1 h-1 bg-green-500 rounded-full " />
                              <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Analytics */}
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <Target className="w-5 h-5 text-purple-600" />
                          <span>Performance Analytics</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Test results and achievements</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        <Activity className="w-3 h-3 mr-1" />
                        Updated
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Test Performance */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl relative">
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full " />
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
                                <div className="w-1 h-1 bg-purple-500 rounded-full" />
                              </div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats?.testsCompleted || analyticsData.totalTestResults}</p>
                              <p className="text-xs text-purple-600 dark:text-purple-400">Manual refresh</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl relative">
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                                <div className="w-1 h-1 bg-orange-500 rounded-full " />
                              </div>
                              <p className="text-xl font-bold text-gray-900 dark:text-white">{adminStats?.averageScore || analyticsData.averageTestScore}%</p>
                              <p className="text-xs text-orange-600 dark:text-orange-400">Real-time avg</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Student Performance Breakdown */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                          <GraduationCap className="w-4 h-4" />
                          <span>Student Overview</span>
                        </h4>
                        <div className="space-y-2">
                          {studentResults?.map((student, index) => (
                            <div key={student.student._id} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                      {student.student.firstName} {student.student.lastName}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {student.testResults?.filter(test => test.result)?.length || 0} tests completed
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {student.testResults?.filter(test => test.result)?.length ? 
                                      Math.round(student.testResults.filter(test => test.result).reduce((sum, test) => sum + ((test.result.score || 0) / (test.maxScore || 100) * 100), 0) / student.testResults.filter(test => test.result).length) 
                                      : 0}%
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!studentResults || studentResults.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No test results available yet</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Section */}
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    <span>Recent Platform Activity</span>
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Latest updates and changes across the platform</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">New Users</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This week</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-blue-600 mb-2">{analyticsData.recentActivity.newUsers}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {analyticsData.recentActivity.newUsers > 0 ? 'Great growth!' : 'Steady state'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">New Courses</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This week</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-green-600 mb-2">{analyticsData.recentActivity.newCourses}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {analyticsData.recentActivity.newCourses > 0 ? 'Content expanding!' : 'Stable catalog'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">New Tests</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">This week</p>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-purple-600 mb-2">{analyticsData.recentActivity.newTests}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {analyticsData.recentActivity.newTests > 0 ? 'Assessment growth!' : 'Stable testing'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* User Approvals Tab */}
          {activeTab === "approvals" && (
            <div className="space-y-6">
              <UserApprovals />
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <UserManagement />
            </div>
          )}

          {/* Course Management Tab */}
          {activeTab === "courses" && (
            <div className="space-y-8">
              {/* Header Section */}
              <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20">
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm">
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                          <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Course Management
                          </h2>
                          <p className="text-gray-600 dark:text-gray-300 text-lg">
                            Create, edit, and manage educational content
                          </p>
                        </div>
                      </div>
                      
                      {/* Statistics & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800 shadow-lg">
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-bold text-orange-800 dark:text-orange-200">
                              {(courses as any[])?.length || 0} Active Courses
                            </span>
                          </div>
                        </div>
                        
                        <Dialog open={showCourseForm} onOpenChange={setShowCourseForm}>
                          <DialogTrigger asChild>
                            <Button 
                              size="lg" 
                              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Plus className="h-5 w-5 mr-3" />
                              Create New Course
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 border-0 shadow-2xl">
                            {/* Gradient Header */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
                            
                            {/* Header Section */}
                            <div className="relative bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 dark:from-orange-500/20 dark:via-red-500/20 dark:to-pink-500/20 -m-6 mb-6 p-8 rounded-t-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                                    <BookOpen className="h-8 w-8 text-white" />
                                  </div>
                                  <div>
                                    <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                                      <span>{editingCourse ? 'Edit Course' : 'Create New Course'}</span>
                                      <div className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 rounded-full border border-orange-200 dark:border-orange-700">
                                        <span className="text-orange-700 dark:text-orange-300 text-sm font-semibold">
                                          {editingCourse ? 'Update Mode' : 'Creation Mode'}
                                        </span>
                                      </div>
                                    </DialogTitle>
                                    <DialogDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                                      {editingCourse ? 'Update course information and content to improve your educational offering' : 'Fill in the details to create an engaging new course for your students'}
                                    </DialogDescription>
                                  </div>
                                </div>
                                
                                {/* Status Indicator */}
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full "></div>
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">Ready</span>
                                </div>
                              </div>
                              
                              {/* Progress Steps */}
                              <div className="mt-6 flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">1</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Course Info</span>
                                </div>
                                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">2</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</span>
                                </div>
                                <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">3</span>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Content Area with Custom Scrollbar */}
                            <div className="overflow-y-auto max-h-[calc(95vh-200px)] pr-2" style={{
                              scrollbarWidth: 'thin',
                              scrollbarColor: '#f97316 #f3f4f6'
                            }}>
                              <div className="space-y-6">
                                {/* Features Banner */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">📚</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Rich Content</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Videos & Notes</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">🎯</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">Structured</p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">Organized Learning</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">📊</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">Trackable</p>
                                        <p className="text-xs text-green-600 dark:text-green-400">Progress Monitoring</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">🚀</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Engaging</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Interactive Content</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Course Form */}
                                <CourseForm 
                                  course={editingCourse}
                                  onSuccess={() => {
                                    setShowCourseForm(false);
                                    setEditingCourse(null);
                                  }}
                                  onCancel={() => {
                                    setShowCourseForm(false);
                                    setEditingCourse(null);
                                  }}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="space-y-6">
                {coursesLoading ? (
                  <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-800/50 dark:to-slate-800/50">
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 p-6 ">
                            <div className="aspect-video bg-gray-300 dark:bg-gray-600 rounded-xl mb-4"></div>
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : courses && (courses as any[]).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(courses as any[]).map((course, index) => (
                      <div key={course._id} className={`rounded-3xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl hover:-translate-y-2 ${
                        index % 3 === 0 
                          ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10' 
                          : index % 3 === 1
                          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'
                          : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10'
                      }`}>
                        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                          {/* Course Thumbnail */}
                          <div className="relative aspect-video overflow-hidden">
                            {course.thumbnail ? (
                              <img 
                                src={course.thumbnail} 
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                            ) : (
                              <div className={`flex items-center justify-center h-full ${
                                index % 3 === 0 
                                  ? 'bg-gradient-to-br from-blue-400 to-cyan-500' 
                                  : index % 3 === 1
                                  ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                                  : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                              }`}>
                                <BookOpen className="w-16 h-16 text-white opacity-80" />
                              </div>
                            )}
                            <div className="absolute top-4 right-4">
                              <Badge className={`px-3 py-1 text-xs font-bold shadow-lg ${
                                index % 3 === 0 
                                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                  : index % 3 === 1
                                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}>
                                {course.category || 'General'}
                              </Badge>
                            </div>
                          </div>

                          {/* Course Content */}
                          <div className="p-6 space-y-4">
                            <div>
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                {course.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                                {course.description}
                              </p>
                            </div>

                            {/* Course Stats */}
                            <div className="flex items-center justify-between">
                              <div className={`px-3 py-1 rounded-lg border ${
                                index % 3 === 0 
                                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                  : index % 3 === 1
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                <div className="flex items-center space-x-1">
                                  <Youtube className="w-3 h-3" />
                                  <span className="text-xs font-medium">{course.modules?.length || 0} modules</span>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-lg border ${
                                index % 3 === 0 
                                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                  : index % 3 === 1
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              }`}>
                                <div className="flex items-center space-x-1">
                                  <FileText className="w-3 h-3" />
                                  <span className="text-xs font-medium">{course.notes?.length || 0} notes</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditCourse(course)}
                                className={`flex-1 border-2 font-semibold transition-all duration-300 ${
                                  index % 3 === 0 
                                    ? 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300' 
                                    : index % 3 === 1
                                    ? 'border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300'
                                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                                }`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-bold flex items-center space-x-2">
                                      <Trash2 className="h-6 w-6 text-red-600" />
                                      <span>Delete Course</span>
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-base">
                                      Are you sure you want to delete <span className="font-semibold text-red-600">"{course.title}"</span>? This action cannot be undone and will remove all associated content.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCourse(course._id)}
                                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Course
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-800/50 dark:to-slate-800/50">
                    <div className="text-center py-16 px-8">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Courses Found</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                        Create your first course to start building your educational platform
                      </p>
                      <Button 
                        onClick={() => setShowCourseForm(true)}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        Create Your First Course
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === "tests" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Test Management</h3>
                <Dialog open={showTestForm} onOpenChange={setShowTestForm}>
                  <DialogTrigger asChild>
                    <Button className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 overflow-hidden">
                      {/* Animated background overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                      
                      {/* Icon with enhanced styling */}
                      <div className="relative flex items-center space-x-2">
                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                        <span className="relative z-10 tracking-wide">Create Test</span>
                      </div>
                      
                      {/* Subtle pulse effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-indigo-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/20 group-hover:to-indigo-400/20 transition-all duration-300"></div>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-gray-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 border-0 shadow-2xl">
                    {/* Gradient Header */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    
                    {/* Header Section */}
                    <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 -m-6 mb-6 p-6 rounded-t-xl">
                      <DialogTitle className="sr-only">Create Test</DialogTitle>
                      <DialogDescription className="sr-only">Create a new test for your course</DialogDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-2xl">📝</span>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create Assessment</h3>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">Design engaging tests for your students</p>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg flex items-center justify-center mb-1">
                              <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Validated</span>
                          </div>
                          <div className="text-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-lg flex items-center justify-center mb-1">
                              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">⚡</span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Fast</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="overflow-y-auto max-h-[calc(95vh-140px)]" style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#8b5cf6 #f3f4f6'
                    }}>
                      <TestForm 
                        editingTest={editingTest}
                        onSuccess={() => {
                          setShowTestForm(false);
                          setEditingTest(null);
                        }}
                        onCancel={() => {
                          setShowTestForm(false);
                          setEditingTest(null);
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-6">
                  {testsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                      ))}
                    </div>
                  ) : tests && tests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tests.map((test) => (
                        <div key={test._id} className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                          {/* Header with gradient background */}
                          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-xl"></div>
                          
                          {/* Test Icon */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{test.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{test.courseName || "General"}</p>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 relative">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900" 
                                title="Edit Test"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditTest(test);
                                }}
                              >
                                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900" 
                                title="Delete Test"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteTest(test._id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{test.description}</p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{test.questions?.length || 0}</span>
                                </div>
                                <div>
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Questions</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
                                  <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">⏱️</span>
                                </div>
                                <div>
                                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{test.timeLimit || 60}m</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Passing Score Badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-700">
                                <span className="text-purple-700 dark:text-purple-300 text-xs font-semibold">
                                  Pass: {test.passingScore || 60}%
                                </span>
                              </div>
                            </div>
                            
                            {/* Status Indicator */}
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full "></div>
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Active</span>
                            </div>
                          </div>

                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <BookOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Plus className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Tests Yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Create engaging tests to assess your students' knowledge and track their progress
                      </p>
                      
                      <div className="space-y-4">
                        <Button 
                          onClick={() => setShowTestForm(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Test
                        </Button>
                        
                        <div className="flex items-center justify-center space-x-6 text-sm text-gray-400 dark:text-gray-500">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Multiple Choice</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Timed Tests</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span>Auto Grading</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grading Tab */}
          {activeTab === "grading" && (
            <div className="space-y-6">
              <StudentGrades />
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}