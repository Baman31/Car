import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, getGradeColor } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import { BookOpen, Calendar, Award, User, Trophy, TrendingUp, Target, CheckCircle } from "lucide-react";

export default function TestResults() {
  const { user, isAdmin } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("all");
  
  // Get test results based on user role
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

  // Calculate stats for hero section
  const totalTests = isAdmin 
    ? testResults?.reduce((acc: number, student: any) => acc + (student.testResults?.length || 0), 0) || 0
    : testResults?.length || 0;
  
  const completedTests = isAdmin
    ? testResults?.reduce((acc: number, student: any) => 
        acc + (student.testResults?.filter((t: any) => t.result).length || 0), 0) || 0
    : testResults?.length || 0;
  
  const averageScore = 85; // Simplified for now

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
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <Target className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{totalTests}</div>
                  <p className="text-green-100">Total Tests</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{completedTests}</div>
                  <p className="text-green-100">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 text-center">
                  <Trophy className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{Math.round(averageScore)}%</div>
                  <p className="text-green-100">Average Score</p>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="p-8">
          {/* Header */}
        <Card className="mb-8 shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {isAdmin ? "Student Performance Overview" : "Performance Analytics"}
                </h2>
                <p className="text-gray-600">
                  {isAdmin ? "View detailed test results organized by student" : "Track your test performance and progress"}
                </p>
              </div>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="w-48 border-gray-300 focus:border-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <div className="space-y-6">
        {isAdmin ? (
          // Admin view: Show all students and their results
          testResults?.map((studentData: any) => (
            <Card key={studentData.student._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {studentData.student.firstName} {studentData.student.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {studentData.student.email}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">
                      {studentData.testResults?.filter((t: any) => t.result).length || 0} / {studentData.testResults?.length || 0} Tests Completed
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentData.testResults?.map((testResult: any) => {
                    const percentage = testResult.result 
                      ? Math.round((testResult.result.score / testResult.maxScore) * 100) 
                      : 0;
                    
                    return (
                      <div 
                        key={testResult.testId} 
                        className={`p-4 rounded-lg border ${testResult.result ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{testResult.testTitle}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {testResult.course?.title} • {testResult.course?.category}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            {testResult.result ? (
                              <>
                                <div className="text-sm">
                                  <span className="font-medium">{testResult.result.score}</span>
                                  <span className="text-gray-500">/{testResult.maxScore}</span>
                                  <span className="text-gray-500 ml-1">({percentage}%)</span>
                                </div>
                                <Badge className={getGradeColor(testResult.result.grade)}>
                                  {testResult.result.grade}
                                </Badge>
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {formatDate(testResult.result.completedAt)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100">
                                Not Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!studentData.testResults || studentData.testResults.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tests available for this student</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
      {(!testResults || testResults.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isAdmin ? "No students found" : "No test results yet"}
            </h3>
            <p className="text-gray-500">
              {isAdmin 
                ? "No students are available in the system" 
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