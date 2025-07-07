import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, Award, Users, BookOpen, RefreshCw, Activity } from "lucide-react";

interface GradeFormProps {
  student: any;
  test: any;
  existingResult?: any;
  onSuccess: () => void;
}

function GradeForm({ student, test, existingResult, onSuccess }: GradeFormProps) {
  const [score, setScore] = useState(existingResult?.score || "");
  const [grade, setGrade] = useState(existingResult?.grade || "");
  const [maxScore, setMaxScore] = useState(existingResult?.maxScore || test.maxScore || 100);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addResultMutation = useMutation({
    mutationFn: async () => {
      const testId = test._id || test.testId;
      const response = await fetch(`/api/mongo/tests/${testId}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student._id,
          score: Number(score),
          grade,
          maxScore: Number(maxScore) || 100,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save grade");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/student-results"] });
      toast({
        title: "Success",
        description: `Grade ${existingResult ? 'updated' : 'added'} for ${student.firstName} ${student.lastName}`,
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save grade",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!score || !grade) {
      toast({
        title: "Error",
        description: "Please enter both score and grade",
        variant: "destructive",
      });
      return;
    }
    addResultMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Score (out of {maxScore})
        </label>
        <Input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Enter score"
          min="0"
          max={maxScore}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Max Score
        </label>
        <Input
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          placeholder="Enter max score"
          min="1"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Grade</label>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A+">A+</SelectItem>
            <SelectItem value="A">A</SelectItem>
            <SelectItem value="B+">B+</SelectItem>
            <SelectItem value="B">B</SelectItem>
            <SelectItem value="C+">C+</SelectItem>
            <SelectItem value="C">C</SelectItem>
            <SelectItem value="D">D</SelectItem>
            <SelectItem value="F">F</SelectItem>
          </SelectContent>
        </Select>
      </div>
      

      
      <Button 
        type="submit" 
        className="w-full"
        disabled={addResultMutation.isPending}
      >
        {addResultMutation.isPending 
          ? (existingResult ? "Updating..." : "Adding...") 
          : (existingResult ? "Update Grade" : "Add Grade")
        }
      </Button>
    </form>
  );
}

export default function StudentGrades() {
  const [selectedTest, setSelectedTest] = useState<string>("all");
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedTestData, setSelectedTestData] = useState<any>(null);
  const [existingResult, setExistingResult] = useState<any>(null);
  const queryClient = useQueryClient();

  // Real-time data fetching with auto-refresh
  const { data: tests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/tests"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const { data: students, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/users"],
    select: (data) => data.filter((user: any) => user.role === 'student'),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const { data: studentResults, isLoading: resultsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/admin/student-results"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Auto-refresh test results data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/student-results"] });
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  const openGradeDialog = (student: any, test: any, existingResult?: any) => {
    setSelectedStudent(student);
    setSelectedTestData(test);
    setExistingResult(existingResult || null);
    setGradeDialogOpen(true);
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  if (testsLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const filteredTests = selectedTest && selectedTest !== "all"
    ? tests?.filter(test => test._id === selectedTest)
    : tests;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Real-time Indicators */}
      <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20">
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Real-Time Test Results
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Live student performance tracking and grading system
                  </p>
                </div>
              </div>
              
              {/* Real-time Stats */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-800 dark:text-green-200 text-sm font-medium">Live Updates</span>
                </div>
                <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800 dark:text-purple-200 text-sm font-medium">{students?.length || 0} Students</span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">{tests?.length || 0} Tests</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/mongo/users"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/student-results"] });
                  }}
                  className="bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Filter by Test:</label>
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Tests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tests</SelectItem>
                {tests?.map((test) => (
                  <SelectItem key={test._id} value={test._id}>
                    {test.title} ({test.course?.title})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tests with Students */}
      <div className="space-y-4">
        {filteredTests?.map((test) => (
          <Card key={test._id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {test.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {test.course?.title} • Max Score: {test.maxScore || 100}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <Activity className="w-3 h-3" />
                      <span>Live Data</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {test.results?.length || 0} / {students?.length || 0} Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Student</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-center py-2">Score</th>
                      <th className="text-center py-2">Grade</th>
                      <th className="text-center py-2">Date Completed</th>
                      <th className="text-center py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students?.map((student: any) => {
                      const result = test.results?.find((r: any) => 
                        r.student.toString() === student._id.toString()
                      );
                      
                      return (
                        <tr key={student._id} className="border-b">
                          <td className="py-2 font-medium">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="py-2 text-gray-600">{student.email}</td>
                          <td className="py-2 text-center">
                            {result ? (
                              <span className="font-semibold">
                                {result.score}/{result.maxScore || test.maxScore || 100}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not graded</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {result ? (
                              <Badge className={getGradeColor(result.grade)}>
                                {result.grade}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            {result ? (
                              new Date(result.completedAt).toLocaleDateString()
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openGradeDialog(student, test, result)}
                                >
                                  {result ? (
                                    <>
                                      <Edit className="h-3 w-3 mr-1" />
                                      Edit
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Grade
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5" />
                                    {result ? 'Edit' : 'Add'} Grade
                                  </DialogTitle>
                                  <p className="text-sm text-gray-600">
                                    {selectedStudent?.firstName} {selectedStudent?.lastName} - {selectedTestData?.title}
                                  </p>
                                </DialogHeader>
                                {selectedStudent && selectedTestData && (
                                  <GradeForm
                                    student={selectedStudent}
                                    test={selectedTestData}
                                    existingResult={existingResult}
                                    onSuccess={() => setGradeDialogOpen(false)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTests?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-500">
              {selectedTest !== "all" ? "No test found for the selected filter" : "No tests available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}