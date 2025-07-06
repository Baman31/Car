import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Youtube, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  thumbnail: z.string().url("Please enter a valid image URL"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  price: z.number().min(0, "Price must be 0 or greater"),
});

const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required"),
  description: z.string().optional(),
  youtubeUrl: z.string().min(1, "YouTube URL is required").refine(
    (url) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url),
    "Please enter a valid YouTube URL (youtube.com or youtu.be)"
  ),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  orderIndex: z.number().min(0, "Order index must be 0 or greater").optional(),
});

const noteSchema = z.object({
  title: z.string().min(1, "Note title is required"),
  pdfUrl: z.string().min(1, "PDF URL is required").refine(
    (url) => /^https?:\/\/.+/.test(url),
    "Please enter a valid URL"
  ),
  fileSize: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;
type ModuleFormData = z.infer<typeof moduleSchema>;
type NoteFormData = z.infer<typeof noteSchema>;

interface CourseFormProps {
  course?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CourseForm({ course, onSuccess, onCancel }: CourseFormProps) {
  const [modules, setModules] = useState<ModuleFormData[]>([]);
  const [notes, setNotes] = useState<NoteFormData[]>([]);
  const [existingModules, setExistingModules] = useState<any[]>([]);
  const [existingNotes, setExistingNotes] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing modules and notes when editing
  useEffect(() => {
    if (course && course.modules) {
      setExistingModules(course.modules || []);
    }
    if (course && course.notes) {
      setExistingNotes(course.notes || []);
    }
  }, [course]);

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? {
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      thumbnail: course.thumbnail || "",
      level: course.level || "Beginner",
      price: course.price || 0,
    } : {
      title: "",
      description: "",
      category: "",
      thumbnail: "",
      level: "Beginner",
      price: 0,
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: CourseFormData & { modules: ModuleFormData[]; notes: NoteFormData[] }) => {
      const url = course ? `/api/mongo/courses/${course._id || course.id}` : '/api/mongo/courses';
      const method = course ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Course operation failed:", errorText);
        throw new Error(`Failed to ${course ? 'update' : 'create'} course: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mongo/courses"] });
      toast({
        title: "Success",
        description: `Course ${course ? 'updated' : 'created'} successfully`,
      });
      form.reset();
      setModules([]);
      setNotes([]);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${course ? 'update' : 'create'} course`,
        variant: "destructive",
      });
    },
  });

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: "",
        description: "",
        youtubeUrl: "",
        duration: 0,
      },
    ]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof ModuleFormData, value: any) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  const addNote = () => {
    setNotes([
      ...notes,
      {
        title: "",
        pdfUrl: "",
        fileSize: "",
      },
    ]);
  };

  const removeExistingModule = (moduleIndex: number) => {
    setExistingModules(existingModules.filter((_, i) => i !== moduleIndex));
  };

  const removeExistingNote = (noteIndex: number) => {
    setExistingNotes(existingNotes.filter((_, i) => i !== noteIndex));
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const updateNote = (index: number, field: keyof NoteFormData, value: any) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = { ...updatedNotes[index], [field]: value };
    setNotes(updatedNotes);
  };

  const onSubmit = (data: CourseFormData) => {
    // Validate modules and notes before submitting
    const validatedModules = modules.map((module, index) => ({
      ...module,
      orderIndex: index,
      duration: Number(module.duration) || 0,
    }));

    const validatedNotes = notes.map(note => ({
      ...note,
      fileSize: note.fileSize || 'Unknown',
    }));

    // Combine existing and new content
    const allModules = [...existingModules, ...validatedModules];
    const allNotes = [...existingNotes, ...validatedNotes];

    // Check if at least one module or note exists
    if (allModules.length === 0 && allNotes.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one video module or PDF note",
        variant: "destructive",
      });
      return;
    }

    // Validate modules
    for (const module of validatedModules) {
      if (!module.title || !module.youtubeUrl || !module.duration) {
        toast({
          title: "Error",
          description: "All video modules must have title, YouTube URL, and duration",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate notes
    for (const note of validatedNotes) {
      if (!note.title || !note.pdfUrl) {
        toast({
          title: "Error",
          description: "All PDF notes must have title and URL",
          variant: "destructive",
        });
        return;
      }
    }

    const courseData = {
      ...data,
      modules: allModules,
      notes: allNotes,
    };

    console.log("Submitting course data:", courseData);
    createCourseMutation.mutate(courseData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-700">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">{course ? "✏️" : "✨"}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course ? "Edit Course" : "Create New Course"}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Build engaging educational content for your students</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="bg-white/50 border-gray-300 hover:bg-gray-50 dark:bg-gray-800/50 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={createCourseMutation.isPending}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {createCourseMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {course ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <span className="mr-2">{course ? "💾" : "🚀"}</span>
                {course ? "Update Course" : "Create Course"}
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          {/* Basic Course Information */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/10">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📋</span>
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-800 dark:text-white">Course Information</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Define the basic details of your course</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-orange-500">📚</span>
                      <span>Course Title</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter an engaging course title" 
                        {...field} 
                        className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-red-500">💬</span>
                      <span>Description</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what students will learn and achieve in this course..." 
                        rows={4}
                        {...field} 
                        className="text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-red-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">🏷️</span>
                        </div>
                        <span>Category</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                            <SelectValue placeholder="Choose category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-2">
                          <SelectItem value="Programming" className="text-lg p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                            <div className="flex items-center space-x-2">
                              <span>💻</span>
                              <span>Programming</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Data Science" className="text-lg p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50">
                            <div className="flex items-center space-x-2">
                              <span>📊</span>
                              <span>Data Science</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Mathematics" className="text-lg p-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50">
                            <div className="flex items-center space-x-2">
                              <span>📐</span>
                              <span>Mathematics</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Business" className="text-lg p-3 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50">
                            <div className="flex items-center space-x-2">
                              <span>💼</span>
                              <span>Business</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Design" className="text-lg p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50">
                            <div className="flex items-center space-x-2">
                              <span>🎨</span>
                              <span>Design</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Other" className="text-lg p-3 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50">
                            <div className="flex items-center space-x-2">
                              <span>📚</span>
                              <span>Other</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">📈</span>
                        </div>
                        <span>Level</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-green-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl shadow-xl border-2">
                          <SelectItem value="Beginner" className="text-lg p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50">
                            <div className="flex items-center space-x-2">
                              <span>🌱</span>
                              <span>Beginner</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Intermediate" className="text-lg p-3 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50">
                            <div className="flex items-center space-x-2">
                              <span>🌿</span>
                              <span>Intermediate</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Advanced" className="text-lg p-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50">
                            <div className="flex items-center space-x-2">
                              <span>🌳</span>
                              <span>Advanced</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400">💰</span>
                        </div>
                        <span>Price</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-purple-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm pl-12"
                          />
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                            $
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
                      <span className="text-pink-500">🖼️</span>
                      <span>Thumbnail URL</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/beautiful-course-image.jpg" 
                        {...field} 
                        className="h-12 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-pink-500 rounded-xl bg-white dark:bg-gray-800 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Existing Video Modules */}
          {course && existingModules.length > 0 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center gap-2">
                      Existing Video Lectures
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your current course content</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-8">
                {existingModules.map((module, index) => (
                  <div key={`existing-${index}`} className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-xl"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg">Existing Module {index + 1}</h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Currently Published</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingModule(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Title:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{module.title}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Duration:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{module.duration} minutes</p>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">YouTube URL:</span>
                        <a href={module.youtubeUrl} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline mt-1 break-all">
                          {module.youtubeUrl}
                        </a>
                      </div>
                      
                      {module.description && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Description:</span>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{module.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* New Video Modules */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center gap-2">
                      {course ? "Add New Video Lectures" : "Video Lectures"}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Create engaging video content for your course</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full border border-purple-200 dark:border-purple-700">
                    <span className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                      {modules.length} {modules.length === 1 ? 'Module' : 'Modules'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {modules.map((module, index) => (
                <div key={index} className="group relative bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl"></div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">Module {index + 1}</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400">New Content</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeModule(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                          📝 Module Title
                        </label>
                        <Input
                          placeholder="Enter module title"
                          value={module.title}
                          onChange={(e) => updateModule(index, "title", e.target.value)}
                          className="h-11 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-lg bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                          ⏱️ Duration
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            value={module.duration || ""}
                            onChange={(e) => updateModule(index, "duration", Number(e.target.value))}
                            className="h-11 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-lg bg-white dark:bg-gray-800 pr-20"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                            minutes
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        🎥 YouTube URL
                      </label>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={module.youtubeUrl}
                        onChange={(e) => updateModule(index, "youtubeUrl", e.target.value)}
                        className="h-11 border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        💬 Description (Optional)
                      </label>
                      <Textarea
                        placeholder="Describe what students will learn in this module..."
                        value={module.description}
                        onChange={(e) => updateModule(index, "description", e.target.value)}
                        rows={3}
                        className="border-2 border-purple-200 dark:border-purple-700 focus:border-purple-500 rounded-lg bg-white dark:bg-gray-800 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                onClick={addModule}
                className="w-full h-12 border-2 border-dashed border-purple-300 dark:border-purple-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Video Module
              </Button>
            </CardContent>
          </Card>

          {/* Existing PDF Notes */}
          {course && existingNotes.length > 0 && (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10">
              <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-t-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center gap-2">
                      Existing PDF Notes
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your current course materials</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-8">
                {existingNotes.map((note, index) => (
                  <div key={`existing-note-${index}`} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-xl"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg">Existing Note {index + 1}</h4>
                          <p className="text-sm text-green-600 dark:text-green-400">Currently Available</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingNote(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                          <span className="font-semibold text-green-700 dark:text-green-300 text-sm">Title:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{note.title}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                          <span className="font-semibold text-green-700 dark:text-green-300 text-sm">File Size:</span>
                          <p className="text-gray-900 dark:text-white font-medium">{note.fileSize || 'Unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                        <span className="font-semibold text-green-700 dark:text-green-300 text-sm">PDF URL:</span>
                        <a href={note.pdfUrl} target="_blank" rel="noopener noreferrer" className="block text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:underline mt-1 break-all">
                          {note.pdfUrl}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* New PDF Notes */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-amber-50 dark:from-gray-800 dark:to-amber-900/10">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center gap-2">
                      {course ? "Add New PDF Notes" : "PDF Notes"}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Provide downloadable resources for students</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-full border border-amber-200 dark:border-amber-700">
                    <span className="text-amber-700 dark:text-amber-300 text-sm font-semibold">
                      {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {notes.map((note, index) => (
                <div key={index} className="group relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-t-xl"></div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">Note {index + 1}</h4>
                        <p className="text-sm text-amber-600 dark:text-amber-400">New Resource</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNote(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                          📄 Note Title
                        </label>
                        <Input
                          placeholder="Enter note title"
                          value={note.title}
                          onChange={(e) => updateNote(index, "title", e.target.value)}
                          className="h-11 border-2 border-amber-200 dark:border-amber-700 focus:border-amber-500 rounded-lg bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                          📊 File Size
                        </label>
                        <Input
                          placeholder="e.g., 2.5 MB"
                          value={note.fileSize}
                          onChange={(e) => updateNote(index, "fileSize", e.target.value)}
                          className="h-11 border-2 border-amber-200 dark:border-amber-700 focus:border-amber-500 rounded-lg bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                        🔗 PDF URL
                      </label>
                      <Input
                        placeholder="https://example.com/document.pdf"
                        value={note.pdfUrl}
                        onChange={(e) => updateNote(index, "pdfUrl", e.target.value)}
                        className="h-11 border-2 border-amber-200 dark:border-amber-700 focus:border-amber-500 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                onClick={addNote}
                className="w-full h-12 border-2 border-dashed border-amber-300 dark:border-amber-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add PDF Note
              </Button>
            </CardContent>
          </Card>

          {/* Action Section */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Preview Section */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">👁️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Ready to Preview</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Review your course before publishing</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 h-12"
                  >
                    <span className="mr-2">❌</span>
                    Cancel
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-600 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 text-blue-700 dark:text-blue-300 px-8 py-3 h-12"
                  >
                    <span className="mr-2">👀</span>
                    Preview Course
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-600 hover:from-yellow-100 hover:to-amber-100 dark:hover:from-yellow-900/30 dark:hover:to-amber-900/30 text-yellow-700 dark:text-yellow-300 px-8 py-3 h-12"
                  >
                    <span className="mr-2">💾</span>
                    Save Draft
                  </Button>
                  
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={createCourseMutation.isPending}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {createCourseMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {course ? "Updating..." : "Publishing..."}
                      </>
                    ) : (
                      <>
                        <span className="mr-2">{course ? "📝" : "🚀"}</span>
                        {course ? "Update Course" : "Publish Course"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Form Valid</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{modules.length + (existingModules?.length || 0)} Modules</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>{notes.length + (existingNotes?.length || 0)} Notes</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Auto-saved • Last change: just now
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}