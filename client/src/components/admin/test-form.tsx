import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const testSchema = z.object({
  title: z.string().min(1, "Test title is required"),
  description: z.string().optional(),
  courseId: z.string().min(1, "Please select a course"),
  timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
  passingScore: z.number().min(0).max(100, "Passing score must be between 0-100"),
  attempts: z.number().min(1, "Must allow at least 1 attempt"),
});

type TestFormData = z.infer<typeof testSchema>;

interface TestFormProps {
  editingTest?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TestForm({ editingTest, onSuccess, onCancel }: TestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery<any[]>({
    queryKey: ["/api/mongo/courses"],
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      title: editingTest?.title || "",
      description: editingTest?.description || "",
      courseId: editingTest?.course?._id || "",
      timeLimit: editingTest?.timeLimit || 60,
      passingScore: editingTest?.passingScore || 60,
      attempts: editingTest?.attempts || 3,
    },
  });

  const testMutation = useMutation({
    mutationFn: async (data: TestFormData) => {
      const url = editingTest ? `/api/mongo/tests/${editingTest._id}` : "/api/mongo/tests";
      const method = editingTest ? "PUT" : "POST";
      
      const response = await apiRequest(url, {
        method,
        data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/tests"] });
      toast({
        title: "Success",
        description: editingTest ? "Test updated successfully" : "Test created successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingTest ? 'update' : 'create'} test`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestFormData) => {
    testMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                {editingTest ? "Edit Test" : "Create New Test"}
              </h2>
              <p className="text-white/80 mt-1">
                {editingTest ? "Update your test settings and content" : "Design engaging assessments for your students"}
              </p>
            </div>
          </div>
          <div className="space-x-3">
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={testMutation.isPending}
              className="bg-white text-blue-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              {testMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  {editingTest ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <span className="mr-2">{editingTest ? "💾" : "✨"}</span>
                  {editingTest ? "Update Test" : "Create Test"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          {/* Main Information Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800 dark:text-white">Test Information</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Define the basic details of your test</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {/* Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-blue-500">📝</span>
                      <span>Test Title</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter an engaging test title" 
                        {...field} 
                        className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-purple-500">💬</span>
                      <span>Description</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this test covers and any special instructions..." 
                        rows={4}
                        {...field} 
                        className="text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Selection */}
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-green-500">🎓</span>
                      <span>Associated Course</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                          <SelectValue placeholder="Choose the course for this test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl shadow-xl border-2">
                        {courses?.map((course) => (
                          <SelectItem key={course._id} value={course._id} className="text-lg p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-bold">📚</span>
                              </div>
                              <div>
                                <div className="font-semibold">{course.title}</div>
                                <div className="text-sm text-gray-500">({course.category})</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">⚙️</span>
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800 dark:text-white">Test Settings</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure timing, scoring, and attempt limits</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Time Limit */}
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">⏱️</span>
                        </div>
                        <span>Time Limit</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="60" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm pl-4 pr-20"
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                            minutes
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Passing Score */}
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">🎯</span>
                        </div>
                        <span>Passing Score</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="60" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm pl-4 pr-12"
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                            %
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Attempts */}
                <FormField
                  control={form.control}
                  name="attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400">🔄</span>
                        </div>
                        <span>Max Attempts</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="3" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm pl-4 pr-20"
                          />
                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                            attempts
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}