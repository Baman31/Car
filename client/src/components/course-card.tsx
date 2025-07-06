import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Video, Play, ArrowRight } from "lucide-react";
import { getProgressColor, getStatusColor } from "@/lib/utils";
import type { Course, Enrollment } from "@shared/schema";

interface CourseCardProps {
  course: any; // MongoDB course structure
  enrollment?: Enrollment;
}

export default function CourseCard({ course, enrollment }: CourseCardProps) {
  const progress = enrollment?.progress || 0;
  const status = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started";
  
  const getButtonText = () => {
    if (progress === 100) return "Review Course";
    if (progress > 0) return "Continue Learning";
    return "Start Course";
  };

  const getButtonVariant = () => {
    return progress === 100 ? "secondary" : "default";
  };

  return (
    <div className="course-card">
      <div className="relative overflow-hidden group">
        {/* Main Image with Enhanced Styling */}
        <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
          <img 
            src={course.thumbnail} 
            alt={course.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
          
          {/* Decorative Corner Gradients */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/30 to-transparent" />
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-10">
          <Badge className={`${getStatusColor(status)} backdrop-blur-sm border border-white/20 shadow-lg font-semibold px-3 py-1.5 text-xs uppercase tracking-wider`}>
            {status}
          </Badge>
        </div>

        {/* Course Level Indicator */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
            <span className="text-white text-xs font-medium">
              {course.category || 'General'}
            </span>
          </div>
        </div>

        {/* Play Button with Enhanced Styling */}
        <div className="absolute bottom-4 right-4 z-10">
          <Link href={`/courses/${course._id || course.id}`}>
            <Button 
              size="icon" 
              className="rounded-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-110 border-2 border-white/20 backdrop-blur-sm w-12 h-12"
            >
              <Play className="h-5 w-5 ml-0.5" />
            </Button>
          </Link>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
        </div>
        
        {/* Duration Display */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-white" />
              <span className="text-white text-xs font-medium">
                {Math.floor((course.duration || 0) / 60)}h
              </span>
            </div>
          </div>
        </div>

        {/* Hover Overlay with Course Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-start p-6">
          <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <h4 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h4>
            <p className="text-sm text-gray-300 line-clamp-2">{course.description}</p>
          </div>
        </div>
      </div>
      <div className="p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="space-y-6">
          {/* Course Header */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              {course.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
              {course.description}
            </p>
          </div>
          
          {/* Course Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    {Math.floor((course.duration || 0) / 60)} hours
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Video className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Lessons</p>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                    {course.modules?.length || 0} videos
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Section */}
          {enrollment && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">Learning Progress</span>
                <span className="text-sm font-bold text-green-900 dark:text-green-100 bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                  {progress}%
                </span>
              </div>
              <div className="relative h-3 bg-green-100 dark:bg-green-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-pulse" />
              </div>
            </div>
          )}
          
          {/* Action Button */}
          <Link href={`/courses/${course._id || course.id}`}>
            <Button 
              variant={getButtonVariant()} 
              className="w-full py-4 text-base font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-none shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>{getButtonText()}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
