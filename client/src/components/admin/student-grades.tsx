import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Edit, Plus, Award, Users, BookOpen } from "lucide-react";

interface GradeFormProps {
  student: any;
  test: any;
  existingResult?: any;
  onSuccess: () => void;
}

function GradeForm({ student, test, existingResult, onSuccess }: GradeFormProps) {
  const [score, setScore] = useState(existingResult?.score || "");
  const [grade, setGrade] = useState(existingResult?.grade || "");
  const [timeSpent, setTimeSpent] = useState(existingResult?.timeSpent || "");
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
          timeSpent: Number(timeSpent) || 0,
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
          Score (out of {test.maxScore || 100})
        </label>
        <Input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Enter score"
          min="0"
          max={test.maxScore || 100}
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
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Time Spent (minutes)
        </label>
        <Input
          type="number"
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          placeholder="Enter time spent"
          min="0"
        />
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

  const { data: tests, isLoading: testsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/tests"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/users"],
    select: (data) => data.filter((user: any) => user.role === 'student'),
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Test Grades Management</h3>
          <p className="text-gray-600">Manage student grades organized by test</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{students?.length || 0} Students</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>{tests?.length || 0} Tests</span>
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
                              <span>
                                {result.score}/{test.maxScore || 100}
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