import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getGradeColor } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { BookOpen, Calendar, Award, User, Trophy, TrendingUp, Target, CheckCircle, RefreshCw, Activity } from "lucide-react";

export default function TestResults() {
  const { user, isAdmin } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const queryClient = useQueryClient();
  
  // Get test results based on user role (no automatic refresh)
  const { data: testResults, isLoading } = useQuery<any[]>({
    queryKey: isAdmin ? ['/api/mongo/admin/student-results'] : ['/api/mongo/student/my-results'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const endpoint = isAdmin ? '/api/mongo/admin/student-results' : '/api/mongo/student/my-results';
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch all tests for statistics (no automatic refresh)
  const { data: allTests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/tests"],
    enabled: !!user && isAdmin,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Skeleton className="h-16" />
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Extract unique courses for filtering
  const uniqueCourses = Array.from(
    new Set(
      isAdmin 
        ? testResults?.flatMap((studentData: any) => 
            studentData.testResults?.map((test: any) => test.course?.title).filter(Boolean)
          ).filter(Boolean) || []
        : testResults?.map((result: any) => result.course?.title).filter(Boolean) || []
    )
  );

  // Filter data based on selected course for real-time course-specific analytics
  const filteredTestResults = testResults?.map((student: any) => {
    if (selectedCourse === "all") return student;
    
    return {
      ...student,
      testResults: student.testResults?.filter((test: any) => 
        test.course?.title === selectedCourse
      ) || []
    };
  }).filter((student: any) => 
    selectedCourse === "all" || student.testResults?.length > 0
  );

  // Calculate comprehensive real-time statistics based on selected course
  const totalTests = isAdmin 
    ? selectedCourse === "all" 
      ? (allTests?.length || 0)
      : (allTests?.filter((test: any) => 
          testResults?.some((student: any) => 
            student.testResults?.some((t: any) => 
              t.course?.title === selectedCourse && t.testId === test._id
            )
          )
        ).length || 0)
    : testResults?.length || 0;
  
  // Total unique students who have completed at least one test in selected course
  const studentsCompleted = isAdmin && filteredTestResults ? new Set(
    filteredTestResults.filter((student: any) => 
      student.testResults?.some((t: any) => t.result)
    ).map((student: any) => student.student._id)
  ).size : 0;
  
  // Total students enrolled in the selected course (or all courses)
  const totalStudentsInCourse = isAdmin && filteredTestResults ? filteredTestResults.length : 0;
  
  // Average score across all completed tests in selected course
  const averageScore = isAdmin && filteredTestResults ? 
    (() => {
      const allScores = filteredTestResults.reduce((scores: number[], student: any) => {
        const studentScores = student.testResults?.filter((t: any) => t.result)
          .map((t: any) => (t.result.score / t.maxScore) * 100) || [];
        return scores.concat(studentScores);
      }, []);
      return allScores.length > 0 ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length) : 0;
    })() : 85;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-8">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              {isAdmin ? (
                <span>Academic <span className="underline decoration-yellow-400">Performance</span> Dashboard</span>
              ) : (
                <span>Your <span className="underline decoration-yellow-400">Achievement</span> Journey</span>
              )}
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              {isAdmin 
                ? "Track student progress and performance across all courses"
                : "Monitor your learning progress and celebrate your achievements"
              }
            </p>
            
            {/* Real-Time Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <Target className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 font-mono">{totalTests}</div>
                  <p className="text-green-100 font-medium">Total Tests</p>
                  <p className="text-green-200/70 text-sm mt-1">
                    {isAdmin ? "Created in system" : "Available to you"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <User className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 font-mono">{studentsCompleted}</div>
                  <p className="text-green-100 font-medium">Students Completed</p>
                  <p className="text-green-200/70 text-sm mt-1">
                    {isAdmin ? "Have taken tests" : "Including you"}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="relative">
                    <Trophy className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2 font-mono">{averageScore}%</div>
                  <p className="text-green-100 font-medium">Average Score</p>
                  <p className="text-green-200/70 text-sm mt-1">
                    Across all completed tests
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Manual Refresh Indicator */}
            <div className="mt-8 flex items-center justify-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-medium">Manual Refresh</span>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span className="text-white text-sm font-medium">Click to refresh</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
                  {/* Header Section */}
                  <div className="text-center lg:text-left space-y-3">
                    <div className="flex items-center justify-center lg:justify-start space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                        {isAdmin ? <User className="w-6 h-6 text-white" /> : <Award className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 dark:from-white dark:via-emerald-100 dark:to-teal-100 bg-clip-text text-transparent">
                          {isAdmin ? "Student Performance Overview" : "Performance Analytics"}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          {isAdmin ? "Comprehensive insights into student achievements" : "Track your learning journey and achievements"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Course Filter and Refresh Button */}
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                        <SelectTrigger className="w-full sm:w-56 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-2 border-white/30 dark:border-gray-600/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:border-emerald-500 dark:focus:border-emerald-400">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"></div>
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-white/30 dark:border-gray-600/30 rounded-xl shadow-2xl">
                          <SelectItem value="all" className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>All Courses</span>
                            </div>
                          </SelectItem>
                          {uniqueCourses.map((course) => (
                            <SelectItem key={course} value={course} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span>{course}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Manual Refresh Button */}
                    <button 
                      onClick={() => {
                        if (isAdmin) {
                          queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/student-results"] });
                          queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
                        } else {
                          queryClient.invalidateQueries({ queryKey: ["/api/mongo/student/my-results"] });
                        }
                      }}
                      className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                      title="Refresh data"
                    >
                      <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                  </div>
                </div>
                
                {/* Real-Time Course-Specific Stats Display */}
                {isAdmin && testResults && (
                  <div className="mt-6 pt-6 border-t border-white/20 dark:border-gray-600/20">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {selectedCourse === "all" ? "Overall Statistics" : `${selectedCourse} Course Analytics`}
                      </h3>
                      <div className="flex items-center space-x-2 bg-white/20 dark:bg-gray-800/20 rounded-full px-3 py-1">
                        <Activity className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Updated Data</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">
                              {selectedCourse === "all" ? "Total Students" : "Students in Course"}
                            </p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 font-mono">
                              {totalStudentsInCourse}
                            </p>
                            <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                              {selectedCourse === "all" ? "Across all courses" : "Enrolled & active"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-500 rounded-lg">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Students Completed</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100 font-mono">
                              {studentsCompleted}
                            </p>
                            <p className="text-xs text-green-500 dark:text-green-300 mt-1">
                              {totalStudentsInCourse > 0 ? `${Math.round((studentsCompleted / totalStudentsInCourse) * 100)}% completion rate` : "No students yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500 rounded-lg">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Average Score</p>
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-100 font-mono">
                              {averageScore}%
                            </p>
                            <p className="text-xs text-purple-500 dark:text-purple-300 mt-1">
                              {selectedCourse === "all" ? "All courses combined" : "Course performance"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </div>

        {/* Results Display */}
        <div className="space-y-6">
        {isAdmin ? (
          // Admin view: Show filtered students and their results based on selected course
          filteredTestResults?.map((studentData: any, index: number) => (
            <div key={studentData.student._id} className={`rounded-3xl border border-white/20 shadow-2xl overflow-hidden ${
              index % 2 === 0 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10' 
                : 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10'
            }`}>
              <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                        index % 2 === 0 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                          : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                          {studentData.student.firstName} {studentData.student.lastName}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-300 font-medium flex items-center space-x-2 mt-1">
                          <span>📧</span>
                          <span>{studentData.student.email}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className={`px-4 py-2 rounded-xl border shadow-lg ${
                        index % 2 === 0 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <Award className={`h-4 w-4 ${
                            index % 2 === 0 ? 'text-green-600' : 'text-blue-600'
                          }`} />
                          <span className={`text-sm font-bold ${
                            index % 2 === 0 
                              ? 'text-green-800 dark:text-green-200' 
                              : 'text-blue-800 dark:text-blue-200'
                          }`}>
                            {studentData.testResults?.filter((t: any) => t.result).length || 0} / {studentData.testResults?.length || 0} Tests Completed
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Circle */}
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 20}`}
                            strokeDashoffset={`${2 * Math.PI * 20 * (1 - ((studentData.testResults?.filter((t: any) => t.result).length || 0) / Math.max(studentData.testResults?.length || 1, 1)))}`}
                            className={index % 2 === 0 ? 'text-green-500' : 'text-blue-500'}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold ${
                            index % 2 === 0 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {Math.round(((studentData.testResults?.filter((t: any) => t.result).length || 0) / Math.max(studentData.testResults?.length || 1, 1)) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-4">
                    {studentData.testResults?.map((testResult: any, testIndex: number) => {
                      const percentage = testResult.result 
                        ? Math.round((testResult.result.score / testResult.maxScore) * 100) 
                        : 0;
                      
                      return (
                        <div 
                          key={testResult.testId} 
                          className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                            testResult.result 
                              ? 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-green-200/50' 
                              : 'border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/20 dark:to-slate-800/20 hover:shadow-gray-200/50'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${
                                  testResult.result ? 'bg-green-500' : 'bg-gray-400'
                                }`}>
                                  <BookOpen className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                    {testResult.testTitle}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {testResult.course?.title} • <span className="text-purple-600 dark:text-purple-400">{testResult.course?.category}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                              {testResult.result ? (
                                <>
                                  <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <div className="text-center">
                                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                                        {testResult.result.score}<span className="text-gray-500 dark:text-gray-400">/{testResult.maxScore}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {percentage}% Score
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Badge className={`${getGradeColor(testResult.result.grade)} px-4 py-2 text-sm font-bold shadow-lg`}>
                                    Grade: {testResult.result.grade}
                                  </Badge>
                                  
                                  <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                                      <Calendar className="h-4 w-4" />
                                      <span className="text-sm font-medium">
                                        {formatDate(testResult.result.completedAt)}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium border-2 border-gray-300 dark:border-gray-600">
                                  📋 Not Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress Bar for Completed Tests */}
                          {testResult.result && (
                            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">Performance</span>
                                <span className="text-sm font-bold text-green-800 dark:text-green-200">{percentage}%</span>
                              </div>
                              <div className="h-2 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {(!studentData.testResults || studentData.testResults.length === 0) && (
                      <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Tests Available</h4>
                        <p className="text-gray-500 dark:text-gray-400">This student hasn't been assigned any tests yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </div>
          ))
        ) : (
          // Student view: Show only their own results
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                My Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults?.map((result: any) => (
                  <div 
                    key={result.testId} 
                    className="p-4 rounded-lg border border-green-200 bg-green-50"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{result.testTitle}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.course?.title} • {result.course?.category}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="font-medium">{result.score}</span>
                          <span className="text-gray-500">/{result.maxScore}</span>
                          <span className="text-gray-500 ml-1">
                            ({Math.round((result.score / result.maxScore) * 100)}%)
                          </span>
                        </div>
                        <Badge className={getGradeColor(result.grade)}>
                          {result.grade}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(result.completedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No test results available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {(!filteredTestResults || filteredTestResults.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isAdmin 
                ? selectedCourse === "all" 
                  ? "No students found" 
                  : `No students found for ${selectedCourse}`
                : "No test results yet"
              }
            </h3>
            <p className="text-gray-500">
              {isAdmin 
                ? selectedCourse === "all"
                  ? "No students are available in the system" 
                  : `No students have taken tests in ${selectedCourse} course yet`
                : "Complete some tests to see your results here"
              }
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </main>
    </div>
  );
}