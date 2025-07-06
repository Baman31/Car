import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Users, Clock, Mail, Calendar, BookOpen, Award, Shield } from "lucide-react";

export default function UserApprovals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ["/api/mongo/admin/pending-approvals"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/mongo/courses"],
  });

  const handleApproveUser = async (userId: any, selectedCourses: any[] = []) => {
    try {
      const response = await fetch(`/api/mongo/admin/users/${userId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isApproved: true,
          enrolledCourses: selectedCourses
        })
      });

      if (response.ok) {
        toast({
          title: "User Approved",
          description: "User has been approved and enrolled in selected courses.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/pending-approvals"] });
        queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/users"] });
      } else {
        throw new Error('Failed to approve user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: any) => {
    try {
      const response = await fetch(`/api/mongo/admin/users/${userId}/approval`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          isApproved: false
        })
      });

      if (response.ok) {
        toast({
          title: "User Rejected",
          description: "User request has been rejected.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mongo/admin/pending-approvals"] });
      } else {
        throw new Error('Failed to reject user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject user. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (approvalsLoading) {
    return (
      <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-emerald-500/10 to-green-500/10">
        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-green-600">
                <Clock className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Loading Approval Requests
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
                  Fetching pending student registrations...
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header Section */}
      <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-emerald-500/10 to-green-500/10">
        <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-green-600">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    User Approval Center
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 font-medium text-lg mt-1">
                    Review and approve student registration requests with course enrollment
                  </CardDescription>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      {(pendingApprovals as any[])?.length || 0} Pending Requests
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-6">
        {!pendingApprovals || (pendingApprovals as any[])?.length === 0 ? (
          <div className="rounded-3xl border border-white/20 shadow-2xl overflow-hidden bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-cyan-50/50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
            {/* Top Border Accent */}
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            
            <div className="text-center py-20 px-8">
              {/* Enhanced Empty State Icon */}
              <div className="relative mx-auto mb-8">
                <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 flex items-center justify-center shadow-2xl">
                  <Users className="h-16 w-16 text-emerald-500" />
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-bounce" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full animate-pulse" />
                <div className="absolute top-1/2 -left-4 w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full animate-ping" />
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                All Clear! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-md mx-auto mb-8">
                All registration requests have been processed. New requests will appear here for your review.
              </p>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Approval</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Approve users instantly</p>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Course Enrollment</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assign courses during approval</p>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Smart Management</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Efficient user management</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {(pendingApprovals as any[])?.map((user: any, index: number) => (
              <ApprovalRequestCard 
                key={user._id} 
                user={user} 
                courses={(courses as any[]) || []}
                onApprove={handleApproveUser}
                onReject={handleRejectUser}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ApprovalRequestCard({ user, courses, onApprove, onReject, index }: { 
  user: any; 
  courses: any[]; 
  onApprove: any; 
  onReject: any; 
  index: number;
}) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [showCourseSelection, setShowCourseSelection] = useState(false);

  const handleCourseChange = (courseId: string, checked: any) => {
    if (checked) {
      setSelectedCourses([...selectedCourses, courseId]);
    } else {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove(user._id, selectedCourses);
    setIsApproving(false);
    setShowCourseSelection(false);
  };

  // Dynamic gradient patterns based on index
  const getGradientPattern = (index: number) => {
    const patterns = [
      { bg: 'from-purple-500/10 via-indigo-500/10 to-blue-500/10', avatar: 'from-purple-500 via-indigo-500 to-blue-600', accent: 'purple' },
      { bg: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10', avatar: 'from-emerald-500 via-teal-500 to-cyan-600', accent: 'emerald' },
      { bg: 'from-rose-500/10 via-pink-500/10 to-fuchsia-500/10', avatar: 'from-rose-500 via-pink-500 to-fuchsia-600', accent: 'rose' },
      { bg: 'from-amber-500/10 via-orange-500/10 to-red-500/10', avatar: 'from-amber-500 via-orange-500 to-red-600', accent: 'amber' },
      { bg: 'from-blue-500/10 via-violet-500/10 to-purple-500/10', avatar: 'from-blue-500 via-violet-500 to-purple-600', accent: 'blue' },
    ];
    return patterns[index % patterns.length];
  };

  const getAccentColors = (accent: string) => {
    const colors = {
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-800 dark:text-purple-200',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-800 border-purple-300'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-800 dark:text-emerald-200',
        icon: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300'
      },
      rose: {
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        border: 'border-rose-200 dark:border-rose-800',
        text: 'text-rose-800 dark:text-rose-200',
        icon: 'text-rose-600',
        badge: 'bg-rose-100 text-rose-800 border-rose-300'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-800 dark:text-amber-200',
        icon: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-800 border-amber-300'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800 border-blue-300'
      }
    };
    return colors[accent as keyof typeof colors];
  };

  const pattern = getGradientPattern(index);
  const accentColors = getAccentColors(pattern.accent);

  return (
    <div className={`group rounded-3xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] bg-gradient-to-r ${pattern.bg}`}>
      {/* Top Border Accent */}
      <div className={`h-1 bg-gradient-to-r ${pattern.avatar}`} />
      
      {/* Main Content */}
      <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
        <div className="p-8">
          {/* Modern Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* User Profile Section - Enhanced */}
            <div className="lg:col-span-7">
              <div className="flex items-start space-x-6">
                {/* Avatar with Floating Animation */}
                <div className="relative group">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br ${pattern.avatar} transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <UserCheck className="w-12 h-12 text-white" />
                  </div>
                  {/* Floating Ring */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${pattern.avatar} opacity-30 animate-pulse`} />
                </div>
                
                {/* User Details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {user.firstName} {user.lastName}
                    </h3>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  </div>
                  
                  {/* Enhanced User Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-sm font-medium">@{user.username}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">Student Role</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Request Info Section - Enhanced */}
            <div className="lg:col-span-5 space-y-4">
              {/* Request Date Card */}
              <div className={`p-4 rounded-2xl border shadow-lg ${accentColors.bg} ${accentColors.border} transform transition-all duration-300 hover:scale-105`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className={`h-5 w-5 ${accentColors.icon}`} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Registration Date</p>
                      <p className={`text-sm font-bold ${accentColors.text}`}>
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 text-xs font-medium ${accentColors.badge} animate-pulse`}>
                    ⏳ Pending Review
                  </Badge>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Wait Time</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{courses.length} Available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Enhanced */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Dialog open={showCourseSelection} onOpenChange={setShowCourseSelection}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Award className="w-5 h-5 mr-3" />
                  Approve & Enroll in Courses
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                    <Award className="h-6 w-6 text-emerald-600" />
                    <span>Approve User & Enroll in Courses</span>
                  </DialogTitle>
                  <DialogDescription className="text-lg">
                    Select courses to enroll <span className="font-semibold text-emerald-600">{user.firstName} {user.lastName}</span> in upon approval
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
                            id={`course-${course._id}`}
                            checked={selectedCourses.includes(course._id)}
                            onCheckedChange={(checked) => handleCourseChange(course._id, checked)}
                            className="h-5 w-5"
                          />
                          <Label htmlFor={`course-${course._id}`} className="flex-1 font-medium cursor-pointer">
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
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold"
                      size="lg"
                    >
                      {isApproving ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Approve & Enroll in {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowCourseSelection(false)}
                      size="lg"
                      className="px-8"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              size="lg" 
              variant="destructive"
              onClick={() => onReject(user._id)}
              className="sm:w-auto bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <UserX className="w-5 h-5 mr-3" />
              Reject Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}