import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Users, UserMinus, Edit, Trash2, Shield, Crown, Calendar, BookOpen, Mail, UserCheck, Settings, Star, Award, Clock } from "lucide-react";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/mongo/admin/users"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/mongo/courses"],
  });

  const handleSuspendUser = async (userId: any, coursesToRemove: any) => {
    try {
      const response = await fetch(`/api/mongo/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          coursesToRemove
        })
      });

      if (response.ok) {
        toast({
          title: "User Suspended",
          description: "User has been suspended from selected courses.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/users"] });
      } else {
        throw new Error('Failed to suspend user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUserCourses = async (userId: any, newCourses: any) => {
    try {
      const response = await fetch(`/api/mongo/admin/users/${userId}/courses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enrolledCourses: newCourses
        })
      });

      if (response.ok) {
        toast({
          title: "Courses Updated",
          description: "User courses have been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/users"] });
      } else {
        throw new Error('Failed to update user courses');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user courses. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (usersLoading) {
    return (
      <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
              <p className="text-gray-600 dark:text-gray-300">Loading platform users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const approvedUsers = (users as any[])?.filter(user => user.isApproved && user.role !== 'admin') || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    Manage platform users and their course access
                  </p>
                </div>
              </div>
              
              {/* Statistics */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                      {approvedUsers.length} Active Users
                    </span>
                  </div>
                </div>
                
                <Badge className="px-3 py-1 text-sm font-medium bg-indigo-100 text-indigo-800 border-indigo-300">
                  🎯 Management Hub
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {approvedUsers.length === 0 ? (
          <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-800/50 dark:to-slate-800/50">
            <div className="text-center py-16 px-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <Users className="h-12 w-12 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Active Users</h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                No approved users to manage yet. Once users are approved, they'll appear here for management.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {approvedUsers.map((user: any, index: number) => (
              <UserManagementCard
                key={user._id}
                user={user}
                courses={(courses as any[]) || []}
                onSuspend={handleSuspendUser}
                onEditCourses={handleEditUserCourses}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserManagementCard({ user, courses, onSuspend, onEditCourses, index }: {
  user: any;
  courses: any[];
  onSuspend: any;
  onEditCourses: any;
  index: number;
}) {
  const [selectedCoursesToRemove, setSelectedCoursesToRemove] = useState<string[]>([]);
  const [newCourseSelection, setNewCourseSelection] = useState<string[]>(
    user.enrolledCourses?.map((c: any) => c._id || c) || []
  );

  const handleSuspendCourseChange = (courseId: string, checked: any) => {
    if (checked) {
      setSelectedCoursesToRemove([...selectedCoursesToRemove, courseId]);
    } else {
      setSelectedCoursesToRemove(selectedCoursesToRemove.filter((id: string) => id !== courseId));
    }
  };

  const handleEditCourseChange = (courseId: string, checked: any) => {
    if (checked) {
      setNewCourseSelection([...newCourseSelection, courseId]);
    } else {
      setNewCourseSelection(newCourseSelection.filter((id: string) => id !== courseId));
    }
  };

  const userEnrolledCourseIds = user.enrolledCourses?.map((c: any) => c._id || c) || [];

  return (
    <div className={`rounded-3xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl ${
      index % 2 === 0 
        ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10' 
        : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10'
    }`}>
      <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
        <div className="p-8">
          {/* User Profile Section */}
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/30 shadow-xl">
                  <AvatarImage src={user.avatar} className="object-cover" />
                  <AvatarFallback className={`text-xl font-bold text-white ${
                    index % 2 === 0 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-600'
                  }`}>
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                  index % 2 === 0 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}>
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={`px-3 py-1 text-sm font-medium ${
                    index % 2 === 0 
                      ? 'bg-blue-100 text-blue-800 border-blue-300' 
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </Badge>
                  <Badge className={`px-3 py-1 text-sm font-medium ${
                    index % 2 === 0 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    {userEnrolledCourseIds.length} courses enrolled
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* User Status Info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className={`px-4 py-2 rounded-xl border shadow-lg ${
                index % 2 === 0 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              }`}>
                <div className="flex items-center space-x-2">
                  <Calendar className={`h-4 w-4 ${
                    index % 2 === 0 ? 'text-blue-600' : 'text-purple-600'
                  }`} />
                  <span className={`text-sm font-bold ${
                    index % 2 === 0 
                      ? 'text-blue-800 dark:text-blue-200' 
                      : 'text-purple-800 dark:text-purple-200'
                  }`}>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
              
              <Badge className={`px-3 py-1 text-sm font-medium ${
                index % 2 === 0 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                <UserCheck className="w-3 h-3 mr-1" />
                Active User
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  className={`flex-1 border-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
                    index % 2 === 0 
                      ? 'border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300' 
                      : 'border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <UserMinus className="w-5 h-5 mr-3" />
                  Suspend from Courses
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                    <UserMinus className="h-6 w-6 text-red-600" />
                    <span>Suspend User from Courses</span>
                  </DialogTitle>
                  <DialogDescription className="text-lg">
                    Select courses to remove <span className="font-semibold text-red-600">{user.firstName} {user.lastName}</span> from
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  {userEnrolledCourseIds.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg">User is not enrolled in any courses</p>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-base font-semibold mb-4 flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-red-600" />
                        <span>Enrolled Courses:</span>
                      </Label>
                      <div className="mt-4 space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        {courses.filter((course: any) => userEnrolledCourseIds.includes(course._id)).map((course: any) => (
                          <div key={course._id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Checkbox
                              id={`suspend-${course._id}`}
                              checked={selectedCoursesToRemove.includes(course._id)}
                              onCheckedChange={(checked) => handleSuspendCourseChange(course._id, checked)}
                              className="h-5 w-5"
                            />
                            <Label htmlFor={`suspend-${course._id}`} className="flex-1 font-medium cursor-pointer">
                              {course.title}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {course.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      onClick={() => onSuspend(user._id, selectedCoursesToRemove)}
                      disabled={selectedCoursesToRemove.length === 0}
                      variant="destructive"
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-semibold"
                      size="lg"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Suspend from {selectedCoursesToRemove.length} Selected Course{selectedCoursesToRemove.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className={`flex-1 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
                    index % 2 === 0 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Edit Course Access
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-blue-600" />
                    <span>Edit User Courses</span>
                  </DialogTitle>
                  <DialogDescription className="text-lg">
                    Manage <span className="font-semibold text-blue-600">{user.firstName} {user.lastName}</span>'s course enrollments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div>
                    <Label className="text-base font-semibold mb-4 flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>Available Courses:</span>
                    </Label>
                    <div className="mt-4 space-y-3 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      {courses.map((course: any) => (
                        <div key={course._id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Checkbox
                            id={`edit-${course._id}`}
                            checked={newCourseSelection.includes(course._id)}
                            onCheckedChange={(checked) => handleEditCourseChange(course._id, checked)}
                            className="h-5 w-5"
                          />
                          <Label htmlFor={`edit-${course._id}`} className="flex-1 font-medium cursor-pointer">
                            {course.title}
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {course.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      onClick={() => onEditCourses(user._id, newCourseSelection)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold"
                      size="lg"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Update Course Enrollments ({newCourseSelection.length} course{newCourseSelection.length !== 1 ? 's' : ''})
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}